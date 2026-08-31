import { describe, it, expect } from "vitest";
import { calcPnl, calcNotional, calcRMultiple } from "../src/engines/pnl-engine/index.js";

/**
 * These tests reproduce the SANITY TEST and SHORT SANITY TEST from the spec
 * (sections 74 and 75) verbatim. If these ever fail, the P&L engine has
 * regressed — do not change the expected values, fix the engine.
 */

describe("Section 74 — LONG sanity test", () => {
  // Capital $10,000, Margin $1,000, Entry 100, Exit 102, LONG, no costs
  const base = {
    direction: "LONG" as const,
    entryPrice: 100,
    exitPrice: 102,
    margin: 1000,
    accountEquityBefore: 10000,
  };

  it("1x: notional $1,000, P&L +$20, ROI +2%, impact +0.20%", () => {
    const r = calcPnl({ ...base, leverage: 1 });
    expect(r.notional).toBeCloseTo(1000, 6);
    expect(r.pnlUsdNet).toBeCloseTo(20, 6);
    expect(r.tradeRoiPct).toBeCloseTo(2, 6);
    expect(r.accountImpactPct).toBeCloseTo(0.2, 6);
  });

  it("5x: notional $5,000, P&L +$100, ROI +10%, impact +1%", () => {
    const r = calcPnl({ ...base, leverage: 5 });
    expect(r.notional).toBeCloseTo(5000, 6);
    expect(r.pnlUsdNet).toBeCloseTo(100, 6);
    expect(r.tradeRoiPct).toBeCloseTo(10, 6);
    expect(r.accountImpactPct).toBeCloseTo(1, 6);
  });

  it("10x: notional $10,000, P&L +$200, ROI +20%, impact +2%", () => {
    const r = calcPnl({ ...base, leverage: 10 });
    expect(r.notional).toBeCloseTo(10000, 6);
    expect(r.pnlUsdNet).toBeCloseTo(200, 6);
    expect(r.tradeRoiPct).toBeCloseTo(20, 6);
    expect(r.accountImpactPct).toBeCloseTo(2, 6);
  });

  it("50x: notional $50,000, P&L +$1,000, ROI +100%, impact +10%", () => {
    const r = calcPnl({ ...base, leverage: 50 });
    expect(r.notional).toBeCloseTo(50000, 6);
    expect(r.pnlUsdNet).toBeCloseTo(1000, 6);
    expect(r.tradeRoiPct).toBeCloseTo(100, 6);
    expect(r.accountImpactPct).toBeCloseTo(10, 6);
  });
});

describe("Section 75 — SHORT sanity test", () => {
  // Capital $10,000, Margin $1,000, Entry 100, Exit 98, SHORT
  const base = {
    direction: "SHORT" as const,
    entryPrice: 100,
    exitPrice: 98,
    margin: 1000,
    accountEquityBefore: 10000,
  };

  it("1x: P&L +$20", () => {
    const r = calcPnl({ ...base, leverage: 1 });
    expect(r.pnlUsdNet).toBeCloseTo(20, 6);
  });

  it("10x: P&L +$200", () => {
    const r = calcPnl({ ...base, leverage: 10 });
    expect(r.pnlUsdNet).toBeCloseTo(200, 6);
  });

  it("50x: P&L +$1,000", () => {
    const r = calcPnl({ ...base, leverage: 50 });
    expect(r.pnlUsdNet).toBeCloseTo(1000, 6);
  });
});

describe("calcNotional (section 29)", () => {
  it("multiplies margin by leverage", () => {
    expect(calcNotional(1000, 10)).toBe(10000);
  });
});

describe("calcRMultiple (section 104)", () => {
  it("returns null when stop is undefined (never invent R)", () => {
    expect(calcRMultiple("LONG", 100, undefined, 1000, 20)).toBeNull();
  });

  it("computes R multiple for a LONG trade", () => {
    // entry 100, stop 98 -> risk 2% of notional; pnl 20 on notional 1000
    // riskAmountUsd = (2/100)*1000 = 20 -> R = 20/20 = 1
    const r = calcRMultiple("LONG", 100, 98, 1000, 20);
    expect(r).toBeCloseTo(1, 6);
  });

  it("computes R multiple for a SHORT trade", () => {
    const r = calcRMultiple("SHORT", 100, 102, 1000, 20);
    expect(r).toBeCloseTo(1, 6);
  });
});

describe("Costs (section 30)", () => {
  it("subtracts configured costs from gross P&L", () => {
    const r = calcPnl({
      direction: "LONG",
      entryPrice: 100,
      exitPrice: 102,
      margin: 1000,
      leverage: 10,
      accountEquityBefore: 10000,
      entryFee: 2,
      exitFee: 2,
      slippage: 1,
    });
    expect(r.pnlUsdGross).toBeCloseTo(200, 6);
    expect(r.totalCosts).toBeCloseTo(5, 6);
    expect(r.pnlUsdNet).toBeCloseTo(195, 6);
  });
});
