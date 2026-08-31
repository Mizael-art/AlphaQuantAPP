import type { Trade as MockTrade, TimelineEvent } from "../data/mockData";

/**
 * The frontend pages/components (built from the Figma export) were written
 * against the field names in data/mockData.ts (entry, stop, tradeRoi, pnl,
 * accountImpact...). The real backend (shared/types.ts + Prisma) uses the
 * spec's own field names (entryPrice, stopPrice, tradeRoiPct, pnlUsd,
 * accountImpactPct...). Rather than rewrite every page's JSX, this adapter
 * translates one shape into the other at the API boundary — the UI layer
 * doesn't need to know the backend renamed anything.
 */
const EVENT_TYPE_MAP: Record<string, { type: TimelineEvent["type"]; label: string }> = {
  TRADE_CREATED: { type: "update", label: "Trade created" },
  CALL_PUBLISHED: { type: "published", label: "Call published" },
  ENTRY_REACHED: { type: "entry", label: "Entry reached" },
  TP1_HIT: { type: "tp1", label: "TP1 hit" },
  TP2_HIT: { type: "tp2", label: "TP2 hit" },
  TP3_HIT: { type: "tp3", label: "TP3 hit" },
  TP4_HIT: { type: "tp3", label: "TP4 hit" },
  STOP_HIT: { type: "stop", label: "Stop hit" },
  SL_UPDATED: { type: "update", label: "Stop updated" },
  TP_UPDATED: { type: "update", label: "Target updated" },
  POSITION_UPDATED: { type: "update", label: "Position updated" },
  TRADE_CLOSED: { type: "closed", label: "Trade closed" },
  TRADE_CANCELLED: { type: "update", label: "Trade cancelled" },
  TRADE_EXPIRED: { type: "update", label: "Trade expired" },
  TRADE_REOPENED: { type: "update", label: "Trade reopened" },
  HISTORICAL_VALIDATED: { type: "update", label: "Historical validation complete" },
  HISTORICAL_AMBIGUOUS: { type: "update", label: "Marked ambiguous" },
};

export function mapApiTrade(t: any): MockTrade {
  return {
    id: t.id,
    asset: t.asset,
    direction: t.direction,
    status: t.status,
    entry: t.entryPrice,
    exit: t.exitPrice ?? undefined,
    currentPrice: t.currentPrice ?? t.entryPrice,
    stop: t.stopPrice,
    tp1: t.tp1,
    tp2: t.tp2 ?? undefined,
    tp3: t.tp3 ?? undefined,
    tp4: t.tp4 ?? undefined,
    margin: t.margin,
    leverage: t.leverage,
    notional: t.notional,
    priceChangePct: t.priceChangePct ?? 0,
    tradeRoi: t.tradeRoiPct ?? 0,
    pnl: t.pnlUsd ?? 0,
    accountImpact: t.accountImpactPct ?? 0,
    rMultiple: t.rMultiple ?? 0,
    strategy: t.strategyName ?? t.strategy,
    playbook: t.playbook ?? undefined,
    timeframe: t.timeframe,
    exitReason: t.exitReason ?? undefined,
    verificationStatus: t.verificationStatus ?? undefined,
    notes: t.notes ?? undefined,
    createdAt: t.createdAt,
    entryAt: t.entryAt ?? undefined,
    closedAt: t.closedAt ?? undefined,
    tp1Hit: t.tp1Hit ?? false,
    tp2Hit: t.tp2Hit ?? false,
    realizedPnl: t.realizedPnlUsd ?? undefined,
    unrealizedPnl: t.unrealizedPnlUsd ?? undefined,
    timeline: (t.events ?? []).map((e: any): TimelineEvent => {
      const mapped = EVENT_TYPE_MAP[e.eventType] ?? { type: "update" as const, label: e.eventType };
      return { timestamp: e.timestamp, label: mapped.label, type: mapped.type };
    }),
  };
}

export function mapApiTrades(trades: any[]): MockTrade[] {
  return (trades ?? []).map(mapApiTrade);
}
