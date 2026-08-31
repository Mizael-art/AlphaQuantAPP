/**
 * ALPHAQUANT X — Shared domain types.
 *
 * This is the single source of truth for the Trade domain model.
 * It extends (does not replace) the shape already used by the Figma-exported
 * frontend in frontend/src/data/mockData.ts. Field names were kept backward
 * compatible where possible; new fields required by the spec are additive.
 */

export type Direction = "LONG" | "SHORT";

export type TradeStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "WAITING_ENTRY"
  | "OPEN"
  | "TP1_HIT"
  | "TP2_HIT"
  | "TP3_HIT"
  | "TP4_HIT"
  | "STOP_HIT"
  | "CLOSED"
  | "EXPIRED"
  | "CANCELLED"
  | "AMBIGUOUS"
  | "INSUFFICIENT_DATA";

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "AMBIGUOUS"
  | "INSUFFICIENT_DATA";

export type TradeSource = "LIVE" | "HISTORICAL" | "PAPER";

export type TradeEventType =
  | "TRADE_CREATED"
  | "CALL_PUBLISHED"
  | "ENTRY_REACHED"
  | "TP1_HIT"
  | "TP2_HIT"
  | "TP3_HIT"
  | "TP4_HIT"
  | "STOP_HIT"
  | "SL_UPDATED"
  | "TP_UPDATED"
  | "POSITION_UPDATED"
  | "TRADE_CLOSED"
  | "TRADE_CANCELLED"
  | "TRADE_EXPIRED"
  | "TRADE_REOPENED"
  | "HISTORICAL_VALIDATED"
  | "HISTORICAL_AMBIGUOUS";

export interface TradeEvent {
  id: string;
  tradeId: string;
  eventType: TradeEventType;
  timestamp: string; // ISO UTC
  metadata?: Record<string, unknown>;
  actor?: string; // admin user id, "system", "monitoring-engine"
  source?: string;
}

export interface Trade {
  id: string;
  asset: string;
  symbol: string; // exchange symbol, e.g. BTCUSDT
  direction: Direction;
  status: TradeStatus;
  source: TradeSource;

  entryPrice: number;
  exitPrice?: number | null;
  currentPrice?: number | null;
  stopPrice: number;
  tp1: number;
  tp2?: number | null;
  tp3?: number | null;
  tp4?: number | null;

  margin: number;
  leverage: number;
  notional: number;
  riskAmount?: number | null;
  riskPct?: number | null;

  priceChangePct?: number | null;
  tradeRoiPct?: number | null;
  pnlUsd?: number | null;
  accountImpactPct?: number | null;
  rMultiple?: number | null;

  realizedPnlUsd?: number | null;
  unrealizedPnlUsd?: number | null;

  strategy: string;
  playbook?: string | null;
  timeframe: string;
  score?: number | null;
  confidence?: number | null;
  reason?: string | null;
  invalidation?: string | null;

  createdAt: string;
  publishedAt?: string | null;
  entryAt?: string | null;
  closedAt?: string | null;

  exitReason?: string | null;
  verificationStatus?: VerificationStatus | null;
  notes?: string | null;

  tp1Hit?: boolean;
  tp2Hit?: boolean;
  tp3Hit?: boolean;
  tp4Hit?: boolean;

  events?: TradeEvent[];
}

export interface PeriodStats {
  pnlUsd: number;
  roiPct: number;
  trades: number;
  wins: number;
  losses: number;
  winRatePct: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
}

export interface OverviewResponse {
  systemStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastUpdate: string;
  activeCalls: number;
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  allTime: PeriodStats;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalPnlUsd: number;
  openTrades: Trade[];
  equityCurve: { date: string; equity: number }[];
  recentCalls: Trade[];
}

export interface PerformanceSnapshot {
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
  periodStart: string;
  periodEnd: string;
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

export interface SystemHealth {
  api: "ONLINE" | "DEGRADED" | "OFFLINE";
  database: "ONLINE" | "DEGRADED" | "OFFLINE";
  marketData: "ONLINE" | "DEGRADED" | "OFFLINE";
  monitoring: "ONLINE" | "DEGRADED" | "OFFLINE";
  worker: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastSuccessfulUpdate: string | null;
  lastError: string | null;
}
