/**
 * P&L ENGINE
 *
 * Implements spec sections 26-36 exactly. Every formula here maps 1:1 to a
 * numbered section in the spec so reviewers can trace behaviour back to the
 * source document. Do not "optimize" these formulas without updating the
 * spec reference comment — this file is the single place P&L math lives.
 */

export type Direction = "LONG" | "SHORT";

export interface PnlInput {
  direction: Direction;
  entryPrice: number;
  exitPrice: number; // for unrealized P&L, pass currentPrice here
  margin: number;
  leverage: number;
  /** Account equity immediately BEFORE this trade was opened (section 32/34) */
  accountEquityBefore: number;
  /** Optional costs, only applied when explicitly configured (section 30) */
  entryFee?: number;
  exitFee?: number;
  funding?: number;
  slippage?: number;
  /** Distance from entry to stop, used for R multiple (section 104) */
  stopPrice?: number;
}

export interface PnlResult {
  notional: number;
  priceReturnPct: number; // section 27/28, expressed as a fraction (0.02 = 2%)
  pnlUsdGross: number; // section 30, before costs
  totalCosts: number;
  pnlUsdNet: number;
  tradeRoiPct: number; // section 31
  accountImpactPct: number; // section 32
  rMultiple: number | null; // section 104 — null if stop not defined
}

/** Section 29: notional = margin * leverage (only for margin*leverage sizing model) */
export function calcNotional(margin: number, leverage: number): number {
  return margin * leverage;
}

/** Section 27: LONG price_return = (exit - entry) / entry */
function longPriceReturn(entry: number, exit: number): number {
  return (exit - entry) / entry;
}

/** Section 28: SHORT price_return = (entry - exit) / entry */
function shortPriceReturn(entry: number, exit: number): number {
  return (entry - exit) / entry;
}

export function priceReturn(direction: Direction, entry: number, exit: number): number {
  return direction === "LONG" ? longPriceReturn(entry, exit) : shortPriceReturn(entry, exit);
}

/**
 * Section 104: R multiple = realized/unrealized P&L expressed in units of
 * initial risk (entry-to-stop distance, translated into $ risk on the
 * position). Returns null when there isn't enough information to compute
 * risk — we do not invent an R value (spec: "Não inventar R se não houver
 * risco suficiente").
 */
export function calcRMultiple(
  direction: Direction,
  entry: number,
  stop: number | undefined,
  notional: number,
  pnlUsd: number,
): number | null {
  if (stop === undefined || stop === null || entry === stop) return null;
  const riskPerUnit = direction === "LONG" ? entry - stop : stop - entry;
  if (riskPerUnit <= 0) return null;
  const riskAmountUsd = (riskPerUnit / entry) * notional;
  if (riskAmountUsd <= 0) return null;
  return pnlUsd / riskAmountUsd;
}

export function calcPnl(input: PnlInput): PnlResult {
  const notional = calcNotional(input.margin, input.leverage);
  const ret = priceReturn(input.direction, input.entryPrice, input.exitPrice);

  // Section 30: pnl_usd = notional * price_return, before costs
  const pnlUsdGross = notional * ret;

  const totalCosts =
    (input.entryFee ?? 0) + (input.exitFee ?? 0) + (input.funding ?? 0) + (input.slippage ?? 0);
  const pnlUsdNet = pnlUsdGross - totalCosts;

  // Section 31: trade_roi_pct = pnl_usd / margin * 100
  const tradeRoiPct = input.margin !== 0 ? (pnlUsdNet / input.margin) * 100 : 0;

  // Section 32: account_impact_pct = pnl_usd / account_equity_before_trade * 100
  const accountImpactPct =
    input.accountEquityBefore !== 0 ? (pnlUsdNet / input.accountEquityBefore) * 100 : 0;

  const rMultiple = calcRMultiple(
    input.direction,
    input.entryPrice,
    input.stopPrice,
    notional,
    pnlUsdNet,
  );

  return {
    notional,
    priceReturnPct: ret * 100,
    pnlUsdGross,
    totalCosts,
    pnlUsdNet,
    tradeRoiPct,
    accountImpactPct,
    rMultiple,
  };
}

/**
 * Section 33: risk-based position sizing.
 * risk_amount = account_equity * risk_per_trade_pct
 * Then derive position size / margin / notional from stop distance.
 * risk_amount is NEVER treated as margin (explicit spec rule, section 33).
 */
export function calcPositionFromRisk(params: {
  accountEquity: number;
  riskPerTradePct: number; // e.g. 1 for 1%
  entryPrice: number;
  stopPrice: number;
  leverage: number;
}): { riskAmount: number; positionSize: number; margin: number; notional: number } {
  const riskAmount = params.accountEquity * (params.riskPerTradePct / 100);
  const stopDistance = Math.abs(params.entryPrice - params.stopPrice);
  if (stopDistance === 0) {
    throw new Error("Stop distance cannot be zero when sizing from risk");
  }
  const positionSize = riskAmount / stopDistance; // units of the asset
  const notional = positionSize * params.entryPrice;
  const margin = notional / params.leverage;
  return { riskAmount, positionSize, margin, notional };
}

/** Section 35: equity_after_trade = equity_before_trade + realized_pnl (never includes unrealized) */
export function applyRealizedPnlToEquity(equityBefore: number, realizedPnl: number): number {
  return equityBefore + realizedPnl;
}
