/**
 * MONITORING ENGINE
 *
 * Runs server-side (worker process), never depends on the frontend/browser
 * being open (spec section 21: "Não depender do frontend").
 *
 * Responsibilities per spec section 21:
 * 1. fetch OPEN/WAITING_ENTRY trades
 * 2. get current price (via market-data-service, shared cache)
 * 3. calculate P&L / ROI / account impact
 * 4. check entry / TP / SL
 * 5. create TradeEvents
 * 6. update status
 * 7. persist
 */

import { prisma } from "../../db/client.js";
import { getPrices } from "../market-data-service/index.js";
import { calcPnl } from "../pnl-engine/index.js";
import { recordEvent, closeTrade } from "../trade-engine/index.js";
import type { Trade, TradeStatus } from "@prisma/client";

/**
 * Section 25 (AMBIGUITY): if within a single monitoring tick both TP and
 * SL levels are crossed relative to the last known price and this tick's
 * price (i.e. we cannot tell which happened first from ticker data alone),
 * mark the trade AMBIGUOUS instead of guessing. This is the documented,
 * consistent rule referenced by the spec — since this v1 uses REST ticker
 * polling (not full intrabar OHLC), ambiguity is detected whenever a single
 * poll interval crosses both levels.
 */
function detectAmbiguity(
  direction: "LONG" | "SHORT",
  prevPrice: number,
  newPrice: number,
  stopPrice: number,
  tpPrice: number,
): boolean {
  const lo = Math.min(prevPrice, newPrice);
  const hi = Math.max(prevPrice, newPrice);
  const stopCrossed = direction === "LONG" ? lo <= stopPrice : hi >= stopPrice;
  const tpCrossed = direction === "LONG" ? hi >= tpPrice : lo <= tpPrice;
  return stopCrossed && tpCrossed;
}

function isEntryReached(direction: "LONG" | "SHORT", entry: number, price: number): boolean {
  // Zone/level entry: reached once price trades through the entry level.
  return direction === "LONG" ? price <= entry : price >= entry;
}

function isTpHit(direction: "LONG" | "SHORT", tp: number, price: number): boolean {
  // Section 23: LONG TP hit when price >= level, SHORT TP hit when price <= level.
  return direction === "LONG" ? price >= tp : price <= tp;
}

function isStopHit(direction: "LONG" | "SHORT", stop: number, price: number): boolean {
  // Section 24: price-based, not ROI-based.
  return direction === "LONG" ? price <= stop : price >= stop;
}

export interface MonitoringTickResult {
  checked: number;
  updated: number;
  errors: Array<{ tradeId: string; error: string }>;
}

export async function runMonitoringTick(): Promise<MonitoringTickResult> {
  const openTrades = await prisma.trade.findMany({
    where: { status: { in: ["PUBLISHED", "WAITING_ENTRY", "OPEN", "TP1_HIT", "TP2_HIT", "TP3_HIT"] } },
  });

  const result: MonitoringTickResult = { checked: openTrades.length, updated: 0, errors: [] };
  if (openTrades.length === 0) return result;

  const prices = await getPrices(openTrades.map((t: Trade) => t.symbol));

  for (const trade of openTrades) {
    try {
      const price = prices.get(trade.symbol);
      if (price === undefined) continue;
      const changed = await processTrade(trade, price);
      if (changed) result.updated += 1;
    } catch (err) {
      result.errors.push({ tradeId: trade.id, error: (err as Error).message });
    }
  }

  await prisma.systemHealth.upsert({
    where: { service: "monitoring" },
    create: { service: "monitoring", status: "ONLINE", lastSuccessfulUpdate: new Date() },
    update: { status: "ONLINE", lastSuccessfulUpdate: new Date(), lastError: null },
  });

  return result;
}

async function processTrade(trade: Trade, price: number): Promise<boolean> {
  const prevPrice = trade.currentPrice ?? trade.entryPrice;
  let status: TradeStatus = trade.status;
  let changed = false;
  const direction = trade.direction as "LONG" | "SHORT";

  // 1. Entry detection (section 22)
  if (status === "PUBLISHED") {
    status = "WAITING_ENTRY";
    changed = true;
  }
  if (status === "WAITING_ENTRY" && isEntryReached(direction, trade.entryPrice, price)) {
    status = "OPEN";
    changed = true;
    await prisma.trade.update({ where: { id: trade.id }, data: { entryAt: new Date() } });
    await recordEvent({ tradeId: trade.id, eventType: "ENTRY_REACHED", metadata: { price } });
  }

  if (status === "OPEN" || status.endsWith("_HIT")) {
    // 2. Ambiguity check (section 25) — only meaningful once trade is open
    const nextTp =
      !trade.tp1Hit ? trade.tp1 : !trade.tp2Hit && trade.tp2 ? trade.tp2 : !trade.tp3Hit && trade.tp3 ? trade.tp3 : null;

    if (nextTp && detectAmbiguity(direction, prevPrice, price, trade.stopPrice, nextTp)) {
      await prisma.trade.update({ where: { id: trade.id }, data: { status: "AMBIGUOUS", currentPrice: price } });
      await recordEvent({
        tradeId: trade.id,
        eventType: "HISTORICAL_AMBIGUOUS",
        metadata: { prevPrice, price, stop: trade.stopPrice, tp: nextTp },
      });
      return true;
    }

    // 3. Stop detection (section 24) — checked before TP per direction rule below
    if (isStopHit(direction, trade.stopPrice, price)) {
      const pnl = calcPnl({
        direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.stopPrice,
        margin: trade.margin,
        leverage: trade.leverage,
        accountEquityBefore: trade.equityBefore ?? 10000,
        stopPrice: trade.stopPrice,
      });
      await recordEvent({ tradeId: trade.id, eventType: "STOP_HIT", metadata: { price } });
      await closeTrade({
        tradeId: trade.id,
        exitPrice: trade.stopPrice,
        exitReason: "STOP_HIT",
        realizedPnlUsd: pnl.pnlUsdNet,
      });
      return true;
    }

    // 4. TP detection (section 23), sequential TP1 -> TP2 -> TP3 -> TP4
    const tpChecks: Array<["tp1Hit" | "tp2Hit" | "tp3Hit" | "tp4Hit", number | null, TradeStatus]> = [
      ["tp1Hit", trade.tp1, "TP1_HIT"],
      ["tp2Hit", trade.tp2, "TP2_HIT"],
      ["tp3Hit", trade.tp3, "TP3_HIT"],
      ["tp4Hit", trade.tp4, "TP4_HIT"],
    ];
    for (const [flagField, tpLevel, newStatus] of tpChecks) {
      if (!tpLevel || (trade as unknown as Record<string, boolean>)[flagField]) continue;
      if (isTpHit(direction, tpLevel, price)) {
        await prisma.trade.update({ where: { id: trade.id }, data: { [flagField]: true, status: newStatus } });
        await recordEvent({ tradeId: trade.id, eventType: newStatus as any, metadata: { price, level: tpLevel } });
        changed = true;
        status = newStatus;
        // IMPORTANT: TP1_HIT does not necessarily mean CLOSED (spec section 12).
        // Only tp4 (or a strategy explicitly marked as full-close-at-tpN) closes the trade;
        // partial-close accounting is handled in performance-engine via realized/unrealized split.
      }
    }
  }

  // 5. Recompute live P&L / ROI / account impact for OPEN-family trades
  if (status === "OPEN" || status.endsWith("_HIT")) {
    const pnl = calcPnl({
      direction,
      entryPrice: trade.entryPrice,
      exitPrice: price,
      margin: trade.margin,
      leverage: trade.leverage,
      accountEquityBefore: trade.equityBefore ?? 10000,
      stopPrice: trade.stopPrice,
    });
    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        currentPrice: price,
        status,
        priceChangePct: pnl.priceReturnPct,
        tradeRoiPct: pnl.tradeRoiPct,
        pnlUsd: pnl.pnlUsdNet,
        unrealizedPnlUsd: pnl.pnlUsdNet,
        accountImpactPct: pnl.accountImpactPct,
        rMultiple: pnl.rMultiple,
      },
    });
    changed = true;
  } else if (changed) {
    await prisma.trade.update({ where: { id: trade.id }, data: { status, currentPrice: price } });
  }

  return changed;
}
