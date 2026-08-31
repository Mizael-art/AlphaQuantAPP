/**
 * PERFORMANCE ENGINE
 *
 * Computes and persists PerformanceSnapshot rows (spec sections 43-55) so
 * public/admin pages read pre-aggregated data instead of recomputing the
 * full trade history on every request (spec section 76).
 *
 * CRITICAL (spec section 96): never sum trade ROI% across trades to produce
 * a cumulative ROI. All "total return" figures here are derived from
 * capital deltas (starting_capital -> final_capital), never by adding
 * percentages.
 */

import { prisma } from "../../db/client.js";
import type { Trade } from "@prisma/client";

export interface ComputedMetrics {
  startingCapital: number;
  finalCapital: number;
  totalPnlUsd: number;
  totalReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number | null;
  payoff: number | null;
  expectancy: number | null;
  avgTradePnlUsd: number;
  avgTradePct: number;
  avgWinnerUsd: number;
  avgLoserUsd: number;
  maxDrawdownUsd: number;
  maxDrawdownPct: number;
  avgR: number | null;
  largestWinUsd: number;
  largestLossUsd: number;
  totalFeesUsd: number;
  totalSlippageUsd: number;
}

/** Core metric computation shared by daily/weekly/monthly/all-time. */
export function computeMetrics(closedTrades: Trade[], startingCapital: number): ComputedMetrics {
  const n = closedTrades.length;
  const pnls = closedTrades.map((t) => t.realizedPnlUsd ?? 0);
  const totalPnlUsd = pnls.reduce((a, b) => a + b, 0);

  // Section 96: NEVER sum ROI%. Total return is capital-delta based.
  const finalCapital = startingCapital + totalPnlUsd;
  const totalReturnPct = startingCapital !== 0 ? (totalPnlUsd / startingCapital) * 100 : 0;

  const wins = closedTrades.filter((t) => (t.realizedPnlUsd ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.realizedPnlUsd ?? 0) < 0);
  const winRatePct = n > 0 ? (wins.length / n) * 100 : 0;

  const grossProfit = wins.reduce((a, t) => a + (t.realizedPnlUsd ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + (t.realizedPnlUsd ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : n > 0 && grossLoss === 0 ? null : null;

  const avgWinnerUsd = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoserUsd = losses.length > 0 ? -grossLoss / losses.length : 0;
  const payoff = avgLoserUsd !== 0 ? Math.abs(avgWinnerUsd / avgLoserUsd) : null;

  // Expectancy = winRate * avgWin - lossRate * avgLoss(abs)
  const lossRate = n > 0 ? losses.length / n : 0;
  const winRate = n > 0 ? wins.length / n : 0;
  const expectancy = n > 0 ? winRate * avgWinnerUsd - lossRate * Math.abs(avgLoserUsd) : null;

  const avgTradePnlUsd = n > 0 ? totalPnlUsd / n : 0;
  const avgTradePct =
    n > 0
      ? closedTrades.reduce((a, t) => a + (t.tradeRoiPct ?? 0), 0) / n // simple average of trade-level ROI is fine for "avg trade %"; NOT used for cumulative return
      : 0;

  const largestWinUsd = wins.length > 0 ? Math.max(...wins.map((t) => t.realizedPnlUsd ?? 0)) : 0;
  const largestLossUsd = losses.length > 0 ? Math.min(...losses.map((t) => t.realizedPnlUsd ?? 0)) : 0;

  // Drawdown from the equity path implied by trades in chronological order.
  const chronological = [...closedTrades].sort(
    (a, b) => (a.closedAt?.getTime() ?? 0) - (b.closedAt?.getTime() ?? 0),
  );
  let equity = startingCapital;
  let peak = startingCapital;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  for (const t of chronological) {
    equity += t.realizedPnlUsd ?? 0;
    peak = Math.max(peak, equity);
    const ddUsd = peak - equity;
    const ddPct = peak !== 0 ? (ddUsd / peak) * 100 : 0;
    maxDrawdownUsd = Math.max(maxDrawdownUsd, ddUsd);
    maxDrawdownPct = Math.max(maxDrawdownPct, ddPct);
  }

  const rValues = closedTrades.map((t) => t.rMultiple).filter((r): r is number => r !== null && r !== undefined);
  const avgR = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null;

  const totalFeesUsd = closedTrades.reduce(
    (a: number, t: Trade) => a + (t.entryFee ?? 0) + (t.exitFee ?? 0) + (t.funding ?? 0),
    0,
  );
  const totalSlippageUsd = closedTrades.reduce((a: number, t: Trade) => a + (t.slippage ?? 0), 0);

  return {
    startingCapital,
    finalCapital,
    totalPnlUsd,
    totalReturnPct,
    totalTrades: n,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRatePct,
    profitFactor,
    payoff,
    expectancy,
    avgTradePnlUsd,
    avgTradePct,
    avgWinnerUsd,
    avgLoserUsd,
    maxDrawdownUsd,
    maxDrawdownPct,
    avgR,
    largestWinUsd,
    largestLossUsd,
    totalFeesUsd,
    totalSlippageUsd,
  };
}

function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfUTCWeek(d: Date): Date {
  const day = startOfUTCDay(d);
  const dow = day.getUTCDay(); // 0=Sun
  const diff = (dow + 6) % 7; // Monday-start week
  day.setUTCDate(day.getUTCDate() - diff);
  return day;
}
function startOfUTCMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export const PROJECT_START_CAPITAL = 10_000; // documented default; override via env/config if the real project start differs

export async function computeAndPersistSnapshot(
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME",
  referenceDate: Date = new Date(),
) {
  let periodStart: Date;
  let periodEnd: Date;

  if (period === "DAILY") {
    periodStart = startOfUTCDay(referenceDate);
    periodEnd = new Date(periodStart.getTime() + 24 * 3600 * 1000);
  } else if (period === "WEEKLY") {
    periodStart = startOfUTCWeek(referenceDate);
    periodEnd = new Date(periodStart.getTime() + 7 * 24 * 3600 * 1000);
  } else if (period === "MONTHLY") {
    periodStart = startOfUTCMonth(referenceDate);
    periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
  } else {
    const first = await prisma.trade.findFirst({ orderBy: { createdAt: "asc" } });
    periodStart = first?.createdAt ?? referenceDate;
    periodEnd = new Date(referenceDate.getTime() + 1000);
  }

  const closedTrades = await prisma.trade.findMany({
    where: { status: "CLOSED", closedAt: { gte: periodStart, lt: periodEnd } },
  });

  const startingCapital =
    period === "ALL_TIME" ? PROJECT_START_CAPITAL : await getEquityAt(periodStart);

  const metrics = computeMetrics(closedTrades, startingCapital);

  return prisma.performanceSnapshot.upsert({
    where: { period_periodStart: { period, periodStart } },
    create: { period, periodStart, periodEnd, ...metrics },
    update: { periodEnd, ...metrics, computedAt: new Date() },
  });
}

/** Equity at a point in time = starting capital + realized P&L of all trades closed before it. */
async function getEquityAt(date: Date): Promise<number> {
  const closedBefore = await prisma.trade.findMany({
    where: { status: "CLOSED", closedAt: { lt: date } },
    select: { realizedPnlUsd: true },
  });
  const realized = closedBefore.reduce(
    (a: number, t: { realizedPnlUsd: number | null }) => a + (t.realizedPnlUsd ?? 0),
    0,
  );
  return PROJECT_START_CAPITAL + realized;
}

export async function getRealizedVsUnrealized() {
  const [closed, open] = await Promise.all([
    prisma.trade.aggregate({ where: { status: "CLOSED" }, _sum: { realizedPnlUsd: true } }),
    prisma.trade.aggregate({
      where: { status: { in: ["OPEN", "TP1_HIT", "TP2_HIT", "TP3_HIT"] } },
      _sum: { unrealizedPnlUsd: true },
    }),
  ]);
  const realizedPnlUsd = closed._sum.realizedPnlUsd ?? 0;
  const unrealizedPnlUsd = open._sum.unrealizedPnlUsd ?? 0;
  return { realizedPnlUsd, unrealizedPnlUsd, totalPnlUsd: realizedPnlUsd + unrealizedPnlUsd };
}

export async function getPerformanceByGroup(groupBy: "asset" | "strategyName" | "timeframe" | "direction") {
  const trades = await prisma.trade.findMany({ where: { status: "CLOSED" } });
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = String((t as any)[groupBy] ?? "UNKNOWN");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries()).map(([key, groupTrades]) => {
    const m = computeMetrics(groupTrades, PROJECT_START_CAPITAL);
    return { key, ...m };
  });
}
