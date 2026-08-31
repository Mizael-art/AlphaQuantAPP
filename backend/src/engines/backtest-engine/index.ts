/**
 * BACKTEST ENGINE (v1)
 *
 * Runs a strategy's rule set against REAL historical klines from Bybit
 * (market-data-service). Never fabricates candles (spec section 41): if
 * Bybit has no data for the requested range/symbol, the backtest is marked
 * FAILED with an INSUFFICIENT_DATA error rather than producing a result.
 *
 * v1 SCOPE NOTE: the "strategy parser" that turns a Strategy.rulesJson into
 * arbitrary entry/exit conditions (spec section 70) is intentionally simple
 * here — it supports a single documented rule shape (breakout above/below a
 * rolling high/low with fixed R:R stop/target). This is enough to produce
 * real, non-invented backtest results end-to-end, but is NOT the full
 * strategy-research condition language implied by the spec. Extending the
 * parser is flagged as a Phase 12 follow-up in the final report — it should
 * not block having a working, honest v1.
 * No lookahead (spec section 100): only candles up to the current index are
 * used to decide entries/exits at that index.
 */

import { getKlines } from "../market-data-service/index.js";
import { calcPnl } from "../pnl-engine/index.js";

export interface BacktestParams {
  symbol: string;
  timeframe: "15" | "60" | "240" | "D";
  startMs: number;
  endMs: number;
  startingCapital: number;
  riskPct: number;
  leverage: number;
  feesPct?: number;
  slippagePct?: number;
  direction: "LONG" | "SHORT" | "BOTH";
  lookbackBars?: number; // rolling high/low window for breakout entries
  rrRatio?: number; // reward:risk for the fixed target
}

export interface BacktestTradeResult {
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  stopPrice: number;
  tp1: number;
  entryTime: number;
  exitTime: number;
  pnlUsd: number;
  roiPct: number;
  rMultiple: number | null;
  exitReason: "TP1_HIT" | "STOP_HIT" | "EOD";
}

export interface BacktestResult {
  status: "COMPLETE" | "FAILED";
  error?: string;
  trades: BacktestTradeResult[];
  finalCapital: number;
  totalPnlUsd: number;
  totalReturnPct: number;
  totalTrades: number;
  winRatePct: number;
  profitFactor: number | null;
  expectancy: number | null;
  avgR: number | null;
  maxDrawdownPct: number;
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  const lookback = params.lookbackBars ?? 20;
  const rr = params.rrRatio ?? 2;

  let klines;
  try {
    klines = await getKlines(params.symbol, params.timeframe, params.startMs, params.endMs);
  } catch (err) {
    return emptyFailedResult(`Market data fetch failed: ${(err as Error).message}`, params.startingCapital);
  }

  if (klines.length < lookback + 2) {
    return emptyFailedResult(
      `INSUFFICIENT_DATA: only ${klines.length} candles available for ${params.symbol} ${params.timeframe}, need at least ${lookback + 2}`,
      params.startingCapital,
    );
  }

  const trades: BacktestTradeResult[] = [];
  let equity = params.startingCapital;
  let peak = equity;
  let maxDrawdownPct = 0;
  let inPosition = false;
  let pos: {
    direction: "LONG" | "SHORT";
    entryPrice: number;
    stopPrice: number;
    tp1: number;
    entryTime: number;
    margin: number;
  } | null = null;

  for (let i = lookback; i < klines.length; i++) {
    const window = klines.slice(i - lookback, i); // strictly past candles — no lookahead
    const candle = klines[i];
    const rollingHigh = Math.max(...window.map((k) => k.high));
    const rollingLow = Math.min(...window.map((k) => k.low));

    if (!inPosition) {
      const wantsLong = params.direction !== "SHORT" && candle.close > rollingHigh;
      const wantsShort = params.direction !== "LONG" && candle.close < rollingLow;
      if (wantsLong || wantsShort) {
        const direction: "LONG" | "SHORT" = wantsLong ? "LONG" : "SHORT";
        const entryPrice = candle.close;
        const riskAmount = equity * (params.riskPct / 100);
        const stopDistanceGuess = entryPrice * 0.02; // 2% initial stop distance, documented assumption for v1
        const stopPrice = direction === "LONG" ? entryPrice - stopDistanceGuess : entryPrice + stopDistanceGuess;
        const tp1 = direction === "LONG" ? entryPrice + stopDistanceGuess * rr : entryPrice - stopDistanceGuess * rr;
        const margin = (riskAmount / stopDistanceGuess) * entryPrice / params.leverage;
        pos = { direction, entryPrice, stopPrice, tp1, entryTime: candle.openTime, margin };
        inPosition = true;
      }
      continue;
    }

    if (inPosition && pos) {
      const stopHit = pos.direction === "LONG" ? candle.low <= pos.stopPrice : candle.high >= pos.stopPrice;
      const tpHit = pos.direction === "LONG" ? candle.high >= pos.tp1 : candle.low <= pos.tp1;

      let exitPrice: number | null = null;
      let exitReason: BacktestTradeResult["exitReason"] | null = null;

      if (stopHit && tpHit) {
        // Same-candle ambiguity: conservative rule — assume stop hit first (spec 25: consistent, documented rule)
        exitPrice = pos.stopPrice;
        exitReason = "STOP_HIT";
      } else if (stopHit) {
        exitPrice = pos.stopPrice;
        exitReason = "STOP_HIT";
      } else if (tpHit) {
        exitPrice = pos.tp1;
        exitReason = "TP1_HIT";
      }

      const isLastCandle = i === klines.length - 1;
      if (!exitPrice && isLastCandle) {
        exitPrice = candle.close;
        exitReason = "EOD";
      }

      if (exitPrice && exitReason) {
        const pnl = calcPnl({
          direction: pos.direction,
          entryPrice: pos.entryPrice,
          exitPrice,
          margin: pos.margin,
          leverage: params.leverage,
          accountEquityBefore: equity,
          stopPrice: pos.stopPrice,
          entryFee: params.feesPct ? pos.margin * params.leverage * (params.feesPct / 100) : 0,
          exitFee: params.feesPct ? pos.margin * params.leverage * (params.feesPct / 100) : 0,
          slippage: params.slippagePct ? pos.margin * params.leverage * (params.slippagePct / 100) : 0,
        });
        equity += pnl.pnlUsdNet;
        peak = Math.max(peak, equity);
        maxDrawdownPct = Math.max(maxDrawdownPct, peak !== 0 ? ((peak - equity) / peak) * 100 : 0);

        trades.push({
          direction: pos.direction,
          entryPrice: pos.entryPrice,
          exitPrice,
          stopPrice: pos.stopPrice,
          tp1: pos.tp1,
          entryTime: pos.entryTime,
          exitTime: candle.openTime,
          pnlUsd: pnl.pnlUsdNet,
          roiPct: pnl.tradeRoiPct,
          rMultiple: pnl.rMultiple,
          exitReason,
        });

        inPosition = false;
        pos = null;
      }
    }
  }

  const wins = trades.filter((t) => t.pnlUsd > 0);
  const losses = trades.filter((t) => t.pnlUsd < 0);
  const grossProfit = wins.reduce((a, t) => a + t.pnlUsd, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const winRatePct = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWinner = wins.length ? grossProfit / wins.length : 0;
  const avgLoser = losses.length ? -grossLoss / losses.length : 0;
  const expectancy =
    trades.length > 0
      ? (wins.length / trades.length) * avgWinner - (losses.length / trades.length) * Math.abs(avgLoser)
      : null;
  const rValues = trades.map((t) => t.rMultiple).filter((r): r is number => r !== null);
  const avgR = rValues.length ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null;

  return {
    status: "COMPLETE",
    trades,
    finalCapital: equity,
    totalPnlUsd: equity - params.startingCapital,
    totalReturnPct: ((equity - params.startingCapital) / params.startingCapital) * 100,
    totalTrades: trades.length,
    winRatePct,
    profitFactor,
    expectancy,
    avgR,
    maxDrawdownPct,
  };
}

function emptyFailedResult(error: string, startingCapital: number): BacktestResult {
  return {
    status: "FAILED",
    error,
    trades: [],
    finalCapital: startingCapital,
    totalPnlUsd: 0,
    totalReturnPct: 0,
    totalTrades: 0,
    winRatePct: 0,
    profitFactor: null,
    expectancy: null,
    avgR: null,
    maxDrawdownPct: 0,
  };
}
