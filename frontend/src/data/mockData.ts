export type Direction = "LONG" | "SHORT";
export type TradeStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "WAITING"
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

export interface TimelineEvent {
  timestamp: string;
  label: string;
  type: "published" | "entry" | "tp1" | "tp2" | "tp3" | "stop" | "closed" | "update";
}

export interface Trade {
  id: string;
  asset: string;
  direction: Direction;
  entry: number;
  exit?: number;
  stop: number;
  tp1: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  currentPrice: number;
  leverage: number;
  margin: number;
  notional: number;
  priceChangePct: number;
  tradeRoi: number;
  pnl: number;
  accountImpact: number;
  rMultiple: number;
  status: TradeStatus;
  strategy: string;
  playbook?: string;
  timeframe: string;
  exitReason?: string;
  verificationStatus?: VerificationStatus;
  notes?: string;
  createdAt: string;
  entryAt?: string;
  closedAt?: string;
  timeline: TimelineEvent[];
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  realizedPnl?: number;
  unrealizedPnl?: number;
}

export const openTrades: Trade[] = [
  {
    id: "T001",
    asset: "BTCUSDT",
    direction: "LONG",
    entry: 104200,
    stop: 102800,
    tp1: 106000,
    tp2: 107500,
    tp3: 110000,
    currentPrice: 105180,
    leverage: 10,
    margin: 1000,
    notional: 10000,
    priceChangePct: 0.94,
    tradeRoi: 9.4,
    pnl: 940,
    accountImpact: 0.94,
    rMultiple: 1.42,
    status: "OPEN",
    strategy: "Trend Continuation",
    timeframe: "1H",
    createdAt: "2026-08-23T14:32:00Z",
    entryAt: "2026-08-23T14:35:00Z",
    tp1Hit: false,
    realizedPnl: 0,
    unrealizedPnl: 940,
    timeline: [
      { timestamp: "14:32", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "14:35", label: "ENTRY REACHED", type: "entry" },
    ],
  },
  {
    id: "T002",
    asset: "ETHUSDT",
    direction: "LONG",
    entry: 3420,
    stop: 3350,
    tp1: 3520,
    tp2: 3640,
    currentPrice: 3485,
    leverage: 5,
    margin: 800,
    notional: 4000,
    priceChangePct: 1.9,
    tradeRoi: 9.5,
    pnl: 260,
    accountImpact: 0.26,
    rMultiple: 0.93,
    status: "OPEN",
    strategy: "Support Bounce",
    timeframe: "4H",
    createdAt: "2026-08-23T10:15:00Z",
    entryAt: "2026-08-23T10:22:00Z",
    realizedPnl: 0,
    unrealizedPnl: 260,
    timeline: [
      { timestamp: "10:15", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "10:22", label: "ENTRY REACHED", type: "entry" },
    ],
  },
  {
    id: "T003",
    asset: "SOLUSDT",
    direction: "SHORT",
    entry: 182.5,
    stop: 186.0,
    tp1: 178.0,
    tp2: 174.0,
    currentPrice: 179.8,
    leverage: 8,
    margin: 500,
    notional: 4000,
    priceChangePct: -1.48,
    tradeRoi: 11.84,
    pnl: 295,
    accountImpact: 0.3,
    rMultiple: 0.77,
    status: "TP1_HIT",
    strategy: "Resistance Rejection",
    timeframe: "1H",
    createdAt: "2026-08-23T08:00:00Z",
    entryAt: "2026-08-23T08:10:00Z",
    tp1Hit: true,
    realizedPnl: 180,
    unrealizedPnl: 115,
    timeline: [
      { timestamp: "08:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "08:10", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "09:45", label: "TP1 HIT", type: "tp1" },
    ],
  },
  {
    id: "T004",
    asset: "BNBUSDT",
    direction: "LONG",
    entry: 618,
    stop: 608,
    tp1: 632,
    tp2: 645,
    currentPrice: 624,
    leverage: 3,
    margin: 600,
    notional: 1800,
    priceChangePct: 0.97,
    tradeRoi: 2.91,
    pnl: 58,
    accountImpact: 0.06,
    rMultiple: 0.58,
    status: "OPEN",
    strategy: "Breakout Retest",
    timeframe: "4H",
    createdAt: "2026-08-22T16:00:00Z",
    entryAt: "2026-08-22T16:30:00Z",
    realizedPnl: 0,
    unrealizedPnl: 58,
    timeline: [
      { timestamp: "16:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "16:30", label: "ENTRY REACHED", type: "entry" },
    ],
  },
  {
    id: "T005",
    asset: "XRPUSDT",
    direction: "LONG",
    entry: 0.582,
    stop: 0.564,
    tp1: 0.612,
    tp2: 0.645,
    currentPrice: 0.597,
    leverage: 15,
    margin: 400,
    notional: 6000,
    priceChangePct: 2.58,
    tradeRoi: 38.7,
    pnl: 154,
    accountImpact: 0.15,
    rMultiple: 0.83,
    status: "OPEN",
    strategy: "Accumulation Zone",
    timeframe: "1H",
    createdAt: "2026-08-23T11:00:00Z",
    entryAt: "2026-08-23T11:15:00Z",
    realizedPnl: 0,
    unrealizedPnl: 154,
    timeline: [
      { timestamp: "11:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "11:15", label: "ENTRY REACHED", type: "entry" },
    ],
  },
];

export const closedTrades: Trade[] = [
  {
    id: "T006",
    asset: "BTCUSDT",
    direction: "LONG",
    entry: 100000,
    exit: 104000,
    stop: 98000,
    tp1: 103000,
    tp2: 105000,
    currentPrice: 104000,
    leverage: 10,
    margin: 1000,
    notional: 10000,
    priceChangePct: 4.0,
    tradeRoi: 40.0,
    pnl: 400,
    accountImpact: 4.0,
    rMultiple: 4.0,
    status: "CLOSED",
    strategy: "Trend Continuation",
    timeframe: "4H",
    exitReason: "TP2",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-22T09:00:00Z",
    entryAt: "2026-08-22T09:30:00Z",
    closedAt: "2026-08-22T18:00:00Z",
    timeline: [
      { timestamp: "09:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "09:30", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "12:00", label: "TP1 HIT", type: "tp1" },
      { timestamp: "18:00", label: "TP2 HIT — TRADE CLOSED", type: "tp2" },
    ],
  },
  {
    id: "T007",
    asset: "ETHUSDT",
    direction: "SHORT",
    entry: 3600,
    exit: 3520,
    stop: 3660,
    tp1: 3540,
    tp2: 3480,
    currentPrice: 3520,
    leverage: 5,
    margin: 800,
    notional: 4000,
    priceChangePct: -2.22,
    tradeRoi: 11.1,
    pnl: 88,
    accountImpact: 1.1,
    rMultiple: 1.33,
    status: "CLOSED",
    strategy: "Resistance Rejection",
    timeframe: "1H",
    exitReason: "TP1",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-22T07:00:00Z",
    entryAt: "2026-08-22T07:15:00Z",
    closedAt: "2026-08-22T11:20:00Z",
    timeline: [
      { timestamp: "07:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "07:15", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "11:20", label: "TP1 HIT — TRADE CLOSED", type: "tp1" },
    ],
  },
  {
    id: "T008",
    asset: "SOLUSDT",
    direction: "LONG",
    entry: 170,
    exit: 166,
    stop: 165,
    tp1: 178,
    tp2: 185,
    currentPrice: 166,
    leverage: 8,
    margin: 500,
    notional: 4000,
    priceChangePct: -2.35,
    tradeRoi: -18.8,
    pnl: -94,
    accountImpact: -0.94,
    rMultiple: -0.8,
    status: "STOP_HIT",
    strategy: "Breakout",
    timeframe: "4H",
    exitReason: "STOP",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-21T14:00:00Z",
    entryAt: "2026-08-21T14:45:00Z",
    closedAt: "2026-08-21T22:10:00Z",
    timeline: [
      { timestamp: "14:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "14:45", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "22:10", label: "STOP HIT — TRADE CLOSED", type: "stop" },
    ],
  },
  {
    id: "T009",
    asset: "BNBUSDT",
    direction: "LONG",
    entry: 600,
    exit: 625,
    stop: 590,
    tp1: 620,
    tp2: 640,
    currentPrice: 625,
    leverage: 5,
    margin: 600,
    notional: 3000,
    priceChangePct: 4.17,
    tradeRoi: 20.8,
    pnl: 125,
    accountImpact: 1.25,
    rMultiple: 2.5,
    status: "CLOSED",
    strategy: "Support Bounce",
    timeframe: "1H",
    exitReason: "TP1",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-21T10:00:00Z",
    entryAt: "2026-08-21T10:30:00Z",
    closedAt: "2026-08-21T16:00:00Z",
    timeline: [
      { timestamp: "10:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "10:30", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "16:00", label: "TP1 HIT — TRADE CLOSED", type: "tp1" },
    ],
  },
  {
    id: "T010",
    asset: "XRPUSDT",
    direction: "SHORT",
    entry: 0.62,
    exit: 0.61,
    stop: 0.638,
    tp1: 0.608,
    tp2: 0.595,
    currentPrice: 0.61,
    leverage: 10,
    margin: 400,
    notional: 4000,
    priceChangePct: -1.61,
    tradeRoi: 16.1,
    pnl: 64,
    accountImpact: 0.64,
    rMultiple: 0.56,
    status: "CLOSED",
    strategy: "Distribution Top",
    timeframe: "1H",
    exitReason: "TP1",
    verificationStatus: "PARTIALLY_VERIFIED",
    createdAt: "2026-08-20T13:00:00Z",
    entryAt: "2026-08-20T13:20:00Z",
    closedAt: "2026-08-20T19:30:00Z",
    timeline: [
      { timestamp: "13:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "13:20", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "19:30", label: "TP1 HIT — TRADE CLOSED", type: "tp1" },
    ],
  },
  {
    id: "T011",
    asset: "BTCUSDT",
    direction: "SHORT",
    entry: 106500,
    exit: 108200,
    stop: 107200,
    tp1: 105000,
    tp2: 103500,
    currentPrice: 108200,
    leverage: 5,
    margin: 1000,
    notional: 5000,
    priceChangePct: 1.6,
    tradeRoi: -8.0,
    pnl: -80,
    accountImpact: -0.8,
    rMultiple: -1.0,
    status: "STOP_HIT",
    strategy: "Reversal",
    timeframe: "4H",
    exitReason: "STOP",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-19T09:00:00Z",
    entryAt: "2026-08-19T09:30:00Z",
    closedAt: "2026-08-19T14:45:00Z",
    timeline: [
      { timestamp: "09:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "09:30", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "14:45", label: "STOP HIT — TRADE CLOSED", type: "stop" },
    ],
  },
  {
    id: "T012",
    asset: "AVAXUSDT",
    direction: "LONG",
    entry: 38.5,
    exit: 42.8,
    stop: 37.0,
    tp1: 41.0,
    tp2: 44.0,
    currentPrice: 42.8,
    leverage: 8,
    margin: 500,
    notional: 4000,
    priceChangePct: 11.17,
    tradeRoi: 89.4,
    pnl: 447,
    accountImpact: 4.47,
    rMultiple: 2.87,
    status: "CLOSED",
    strategy: "Breakout Retest",
    timeframe: "1D",
    exitReason: "TP2",
    verificationStatus: "VERIFIED",
    createdAt: "2026-08-18T10:00:00Z",
    entryAt: "2026-08-18T11:00:00Z",
    closedAt: "2026-08-19T16:00:00Z",
    timeline: [
      { timestamp: "10:00", label: "CALL PUBLISHED", type: "published" },
      { timestamp: "11:00", label: "ENTRY REACHED", type: "entry" },
      { timestamp: "Aug 19 08:30", label: "TP1 HIT", type: "tp1" },
      { timestamp: "Aug 19 16:00", label: "TP2 HIT — TRADE CLOSED", type: "tp2" },
    ],
  },
];

export const allTrades = [...openTrades, ...closedTrades];

export const equityCurveData = [
  { date: "Jan 1", equity: 10000, drawdown: 0 },
  { date: "Jan 8", equity: 10420, drawdown: 0 },
  { date: "Jan 15", equity: 10280, drawdown: -140 },
  { date: "Jan 22", equity: 10760, drawdown: 0 },
  { date: "Feb 1", equity: 11200, drawdown: 0 },
  { date: "Feb 8", equity: 10980, drawdown: -220 },
  { date: "Feb 15", equity: 11450, drawdown: 0 },
  { date: "Feb 22", equity: 12100, drawdown: 0 },
  { date: "Mar 1", equity: 12680, drawdown: 0 },
  { date: "Mar 8", equity: 12300, drawdown: -380 },
  { date: "Mar 15", equity: 13200, drawdown: 0 },
  { date: "Mar 22", equity: 13850, drawdown: 0 },
  { date: "Apr 1", equity: 14200, drawdown: 0 },
  { date: "Apr 8", equity: 13600, drawdown: -600 },
  { date: "Apr 15", equity: 14100, drawdown: -100 },
  { date: "Apr 22", equity: 15200, drawdown: 0 },
  { date: "May 1", equity: 15800, drawdown: 0 },
  { date: "May 8", equity: 16400, drawdown: 0 },
  { date: "May 15", equity: 15900, drawdown: -500 },
  { date: "May 22", equity: 16800, drawdown: 0 },
  { date: "Jun 1", equity: 17500, drawdown: 0 },
  { date: "Jun 8", equity: 18200, drawdown: 0 },
  { date: "Jun 15", equity: 17800, drawdown: -400 },
  { date: "Jun 22", equity: 18600, drawdown: 0 },
  { date: "Jul 1", equity: 19200, drawdown: 0 },
  { date: "Jul 8", equity: 19800, drawdown: 0 },
  { date: "Jul 15", equity: 20100, drawdown: 0 },
  { date: "Jul 22", equity: 20800, drawdown: 0 },
  { date: "Aug 1", equity: 21400, drawdown: 0 },
  { date: "Aug 8", equity: 22100, drawdown: 0 },
  { date: "Aug 15", equity: 22600, drawdown: 0 },
  { date: "Aug 23", equity: 23225, drawdown: 0 },
];

export const dailyPnlData = [
  { date: "Aug 1", pnl: 320 },
  { date: "Aug 4", pnl: -85 },
  { date: "Aug 5", pnl: 210 },
  { date: "Aug 6", pnl: 445 },
  { date: "Aug 7", pnl: -120 },
  { date: "Aug 8", pnl: 180 },
  { date: "Aug 11", pnl: 290 },
  { date: "Aug 12", pnl: -65 },
  { date: "Aug 13", pnl: 380 },
  { date: "Aug 14", pnl: 520 },
  { date: "Aug 15", pnl: 240 },
  { date: "Aug 18", pnl: 447 },
  { date: "Aug 19", pnl: -80 },
  { date: "Aug 20", pnl: 64 },
  { date: "Aug 21", pnl: 156 },
  { date: "Aug 22", pnl: 488 },
  { date: "Aug 23", pnl: 284 },
];

export const performanceByAsset = [
  { asset: "BTCUSDT", trades: 24, winRate: 71, pnl: 8420, roi: 84.2, profitFactor: 2.8, expectancy: 180, drawdown: -380 },
  { asset: "ETHUSDT", trades: 18, winRate: 67, pnl: 4280, roi: 42.8, profitFactor: 2.1, expectancy: 120, drawdown: -220 },
  { asset: "SOLUSDT", trades: 12, winRate: 58, pnl: 1840, roi: 18.4, profitFactor: 1.6, expectancy: 90, drawdown: -450 },
  { asset: "AVAXUSDT", trades: 8, winRate: 75, pnl: 2180, roi: 21.8, profitFactor: 3.1, expectancy: 210, drawdown: -180 },
  { asset: "BNBUSDT", trades: 10, winRate: 60, pnl: 880, roi: 8.8, profitFactor: 1.8, expectancy: 72, drawdown: -290 },
  { asset: "XRPUSDT", trades: 6, winRate: 50, pnl: 420, roi: 4.2, profitFactor: 1.4, expectancy: 48, drawdown: -160 },
];

export const performanceByStrategy = [
  { strategy: "Trend Continuation", trades: 22, winRate: 73, pnl: 7240, roi: 72.4, profitFactor: 2.9, expectancy: 195, avgR: 2.1, drawdown: -320 },
  { strategy: "Support Bounce", trades: 18, winRate: 67, pnl: 4820, roi: 48.2, profitFactor: 2.2, expectancy: 148, avgR: 1.8, drawdown: -280 },
  { strategy: "Resistance Rejection", trades: 14, winRate: 64, pnl: 3180, roi: 31.8, profitFactor: 1.9, expectancy: 118, avgR: 1.5, drawdown: -420 },
  { strategy: "Breakout Retest", trades: 12, winRate: 58, pnl: 2240, roi: 22.4, profitFactor: 1.7, expectancy: 95, avgR: 1.3, drawdown: -510 },
  { strategy: "Reversal", trades: 8, winRate: 50, pnl: 840, roi: 8.4, profitFactor: 1.4, expectancy: 68, avgR: 1.0, drawdown: -380 },
  { strategy: "Accumulation Zone", trades: 4, winRate: 75, pnl: 1100, roi: 11.0, profitFactor: 2.5, expectancy: 175, avgR: 2.3, drawdown: -120 },
];

export const metrics = {
  totalTrades: 78,
  winningTrades: 52,
  losingTrades: 26,
  winRate: 66.7,
  profitFactor: 2.42,
  payoff: 2.1,
  expectancy: 142,
  averageR: 1.68,
  averageWinner: 285,
  averageLoser: -112,
  maxDrawdown: -820,
  maxDrawdownPct: -8.2,
  largestWin: 847,
  largestLoss: -320,
  startingCapital: 10000,
  currentEquity: 28420.8,
  highWaterMark: 28420.8,
  realizedPnl: 13225,
  unrealizedPnl: 1595.8,
  totalPnl: 14820.8,
  todayPnl: 284.50,
  todayRoi: 2.84,
  todayTrades: 4,
  weekPnl: 1420.20,
  weekRoi: 14.20,
  weekTrades: 12,
  monthPnl: 3820.40,
  monthRoi: 38.20,
  monthTrades: 28,
  allTimePnl: 18420.80,
  allTimeRoi: 184.20,
  allTimeTrades: 78,
  projectStart: "2026-01-01",
  openTrades: 5,
  closedToday: 4,
  activeCalls: 5,
};
