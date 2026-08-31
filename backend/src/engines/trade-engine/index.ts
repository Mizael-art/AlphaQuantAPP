/**
 * TRADE ENGINE
 *
 * Owns trade state transitions and enforces immutability of published
 * trade parameters (spec sections 12-14): once a call is PUBLISHED, its
 * entry/stop/targets/direction/timestamp/strategy/timeframe must not be
 * silently overwritten — any change creates a TradeEvent and the history
 * stays intact.
 */

import { prisma } from "../../db/client.js";
import type { TradeEventType } from "@prisma/client";

const IMMUTABLE_FIELDS = [
  "entryPrice",
  "stopPrice",
  "tp1",
  "tp2",
  "tp3",
  "tp4",
  "direction",
  "publishedAt",
  "strategyId",
  "timeframe",
] as const;

export async function recordEvent(params: {
  tradeId: string;
  eventType: TradeEventType;
  metadata?: Record<string, unknown>;
  actor?: string;
  source?: string;
}) {
  return prisma.tradeEvent.create({
    data: {
      tradeId: params.tradeId,
      eventType: params.eventType,
      metadata: params.metadata as any,
      actor: params.actor ?? "system",
      source: params.source ?? "trade-engine",
    },
  });
}

/**
 * Applies an admin edit to a PUBLISHED+ trade. If the edit touches an
 * immutable field, records SL_UPDATED / TP_UPDATED events with old/new
 * values instead of just overwriting silently.
 */
export async function applyAdminEdit(params: {
  tradeId: string;
  actorId: string;
  changes: Record<string, unknown>;
}) {
  const trade = await prisma.trade.findUniqueOrThrow({ where: { id: params.tradeId } });

  const events: Array<{ eventType: TradeEventType; metadata: Record<string, unknown> }> = [];

  for (const field of IMMUTABLE_FIELDS) {
    if (field in params.changes && params.changes[field] !== (trade as any)[field]) {
      const oldValue = (trade as any)[field];
      const newValue = params.changes[field];
      if (field === "stopPrice") {
        events.push({ eventType: "SL_UPDATED", metadata: { field, oldValue, newValue } });
      } else if (field.startsWith("tp")) {
        events.push({ eventType: "TP_UPDATED", metadata: { field, oldValue, newValue } });
      } else {
        events.push({ eventType: "POSITION_UPDATED", metadata: { field, oldValue, newValue } });
      }
    }
  }

  const updated = await prisma.trade.update({
    where: { id: params.tradeId },
    data: params.changes as any,
  });

  for (const ev of events) {
    await recordEvent({
      tradeId: params.tradeId,
      eventType: ev.eventType,
      metadata: ev.metadata,
      actor: params.actorId,
      source: "admin",
    });
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: `ADMIN_UPDATED_${ev.metadata.field}`.toUpperCase(),
        tradeId: params.tradeId,
        oldValue: ev.metadata.oldValue as any,
        newValue: ev.metadata.newValue as any,
      },
    });
  }

  return updated;
}

export async function publishCall(tradeId: string, actorId: string) {
  const trade = await prisma.trade.update({
    where: { id: tradeId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await recordEvent({ tradeId, eventType: "CALL_PUBLISHED", actor: actorId, source: "admin" });
  await prisma.auditLog.create({
    data: { actorId, action: "ADMIN_CREATED_CALL", tradeId, newValue: { status: "PUBLISHED" } },
  });
  return trade;
}

export async function closeTrade(params: {
  tradeId: string;
  exitPrice: number;
  exitReason: string;
  realizedPnlUsd: number;
  actorId?: string;
}) {
  const trade = await prisma.trade.update({
    where: { id: params.tradeId },
    data: {
      status: "CLOSED",
      exitPrice: params.exitPrice,
      exitReason: params.exitReason,
      realizedPnlUsd: params.realizedPnlUsd,
      unrealizedPnlUsd: 0,
      closedAt: new Date(),
    },
  });
  await recordEvent({
    tradeId: params.tradeId,
    eventType: "TRADE_CLOSED",
    metadata: { exitPrice: params.exitPrice, exitReason: params.exitReason },
    actor: params.actorId ?? "monitoring-engine",
    source: params.actorId ? "admin" : "monitoring-engine",
  });
  if (params.actorId) {
    await prisma.auditLog.create({
      data: { actorId: params.actorId, action: "ADMIN_CLOSED_TRADE", tradeId: params.tradeId },
    });
  }
  return trade;
}

export async function cancelTrade(tradeId: string, actorId: string) {
  const trade = await prisma.trade.update({
    where: { id: tradeId },
    data: { status: "CANCELLED", closedAt: new Date() },
  });
  await recordEvent({ tradeId, eventType: "TRADE_CANCELLED", actor: actorId, source: "admin" });
  await prisma.auditLog.create({
    data: { actorId, action: "ADMIN_CANCELLED_CALL", tradeId },
  });
  return trade;
}
