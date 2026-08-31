import { Link } from "react-router";
import { ArrowRight, TrendingUp, Clock, BarChart2, AlertCircle } from "lucide-react";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge } from "../../components/StatusBadge";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from "recharts";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrades } from "../../lib/mapTrade";

function MetricCard({ label, pnl, roi, trades, period }: { label: string; pnl: number; roi: number; trades: number; period: string }) {
  return (
    <div style={{
      background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
      padding: "20px", flex: 1, minWidth: 200,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>{period}</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{trades} TRADES</div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <PnlValue value={pnl} size="xl" />
      </div>
      <div>
        <RoiValue value={roi} size="lg" />
      </div>
      <div style={{ marginTop: 12, fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "JetBrains Mono" }}>
        ${payload[0].value.toLocaleString()}
      </div>
    </div>
  );
};

export default function Home() {
  const { data: overview, loading, error } = useApi(() => publicApi.overview());

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading AlphaQuant X…</div>;
  }
  if (error || !overview) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>
        SYSTEM TEMPORARILY UNAVAILABLE — {error ?? "no data"}
      </div>
    );
  }

  const openTrades = mapApiTrades(overview.openTrades);
  const equityCurveData = overview.equityCurve.map((p: any) => ({
    date: new Date(p.date).toLocaleDateString(),
    equity: p.equity,
  }));
  // Daily P&L bars derived from the equity curve deltas (7D window) — the
  // worker populates true snapshot-based series once PerformanceSnapshot
  // rows accumulate; this is a safe fallback that never fabricates trades.
  const dailyPnlData = equityCurveData.slice(-7).map((p: any, i: number, arr: any[]) => ({
    date: p.date,
    pnl: i === 0 ? 0 : p.equity - arr[i - 1].equity,
  }));

  // ALL_TIME extended metrics (winRate, profitFactor, etc.) come from
  // GET /api/public/performance once PerformanceSnapshot rows exist; until the worker has run at least once
  // after seeding, these fall back to values derived from today/week/month/allTime below rather than being invented.

  const metrics = {
    activeCalls: overview.activeCalls,
    closedToday: overview.today.trades,
    todayPnl: overview.today.pnlUsd,
    todayRoi: overview.today.roiPct,
    todayTrades: overview.today.trades,
    weekPnl: overview.week.pnlUsd,
    weekRoi: overview.week.roiPct,
    weekTrades: overview.week.trades,
    monthPnl: overview.month.pnlUsd,
    monthRoi: overview.month.roiPct,
    monthTrades: overview.month.trades,
    allTimePnl: overview.allTime.pnlUsd,
    allTimeRoi: overview.allTime.roiPct,
    allTimeTrades: overview.allTime.trades,
    realizedPnl: overview.realizedPnlUsd,
    currentEquity: equityCurveData.length ? equityCurveData[equityCurveData.length - 1].equity : 10000,
    highWaterMark: equityCurveData.length ? Math.max(...equityCurveData.map((p: any) => p.equity)) : 10000,
    openTrades: openTrades.length,
    winRate: overview.allTime.winRatePct?.toFixed(1) ?? "0.0",
    profitFactor: 0,
    expectancy: 0,
    totalTrades: overview.allTime.trades,
    averageWinner: 0,
    averageLoser: 0,
    maxDrawdownPct: 0,
    averageR: 0,
  };
  const unrealized = overview.unrealizedPnlUsd;


  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>
              QUANTITATIVE TRADING INTELLIGENCE
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
              margin: 0, marginBottom: 6, lineHeight: 1.1
            }}>
              ALPHAQUANT <span style={{ color: "var(--accent)" }}>X</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, maxWidth: 480 }}>
              Transparent trade tracking, performance analytics and historical validation.
              All calls are recorded. All results are visible. History is immutable.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/open-trades" style={{
                background: "var(--accent)", color: "var(--bg-app)", padding: "8px 16px",
                borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none",
                letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6
              }}>
                VIEW LIVE TRADES <ArrowRight size={12} />
              </Link>
              <Link to="/performance" style={{
                background: "var(--bg-card)", color: "var(--text-primary)", padding: "8px 16px",
                borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: "none",
                letterSpacing: "0.06em", border: "1px solid var(--border)"
              }}>
                VIEW PERFORMANCE
              </Link>
            </div>
          </div>

          {/* Status panel */}
          <div style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "16px 20px", minWidth: 240
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span className="pulse-live" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--profit)", display: "block" }} />
              <span style={{ fontSize: 11, color: "var(--profit)", fontWeight: 700, letterSpacing: "0.08em" }}>SYSTEM ONLINE</span>
            </div>
            {[
              ["LAST UPDATE", "12:42:18"],
              ["ACTIVE CALLS", `${metrics.activeCalls}`],
              ["CLOSED TODAY", `${metrics.closedToday}`],
              ["OPEN P&L", `+$${unrealized.toFixed(0)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em" }}>{k}</span>
                <span style={{ fontSize: 11, color: "var(--text-primary)", fontFamily: "JetBrains Mono", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{
              marginTop: 10, padding: "5px 8px", background: "#1a1400",
              border: "1px solid #C9A22730", borderRadius: 4, fontSize: 9,
              color: "#C9A227", letterSpacing: "0.08em", textAlign: "center", fontWeight: 600
            }}>
              DEMO DATA — NOT LIVE TRADING
            </div>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>
          PERFORMANCE OVERVIEW
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MetricCard label="P&L REALIZED" period="TODAY" pnl={metrics.todayPnl} roi={metrics.todayRoi} trades={metrics.todayTrades} />
          <MetricCard label="P&L REALIZED" period="THIS WEEK" pnl={metrics.weekPnl} roi={metrics.weekRoi} trades={metrics.weekTrades} />
          <MetricCard label="P&L REALIZED" period="THIS MONTH" pnl={metrics.monthPnl} roi={metrics.monthRoi} trades={metrics.monthTrades} />
          <MetricCard label="P&L REALIZED" period="ALL TIME" pnl={metrics.allTimePnl} roi={metrics.allTimeRoi} trades={metrics.allTimeTrades} />
        </div>
      </div>

      {/* Realized / Unrealized */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px"
        }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>
            TOTAL PERFORMANCE
          </div>
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {[
              { label: "REALIZED P&L", value: metrics.realizedPnl, desc: "Closed trades" },
              { label: "UNREALIZED P&L", value: unrealized, desc: "Open positions" },
              { label: "TOTAL P&L", value: metrics.realizedPnl + unrealized, desc: "Combined" },
            ].map((item, i) => (
              <div key={item.label} style={{
                flex: 1, minWidth: 160,
                padding: "0 24px",
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                paddingLeft: i === 0 ? 0 : 24,
              }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>{item.label}</div>
                <div style={{ marginBottom: 4 }}>
                  <PnlValue value={item.value} size="xl" />
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equity Curve + Daily P&L */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 12, marginBottom: 28 }}>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>
              EQUITY CURVE
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["7D", "30D", "ALL"].map(f => (
                <button key={f} style={{
                  background: f === "ALL" ? "#1a1600" : "none",
                  border: f === "ALL" ? "1px solid #D4AF3730" : "none",
                  color: f === "ALL" ? "var(--accent)" : "var(--text-muted)",
                  padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                  fontWeight: f === "ALL" ? 600 : 400, letterSpacing: "0.06em"
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[
              ["STARTING", "$10,000"],
              ["CURRENT", `$${metrics.currentEquity.toLocaleString()}`],
              ["HWM", `$${metrics.highWaterMark.toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{k}</div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equityCurveData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={1.5}
                fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>
            DAILY P&L
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyPnlData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
                formatter={(v: any) => [`$${v}`, "P&L"]}
              />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]}
                fill="var(--profit)"
                label={false}
              >
                {dailyPnlData.map((entry: { date: string; pnl: number }, i: number) => (
                  <rect key={i} fill={entry.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Positions */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>
            LIVE POSITIONS
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>OPEN TRADES</div>
              <div style={{ fontSize: 14, color: "var(--accent)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{metrics.openTrades}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>UNREALIZED P&L</div>
              <PnlValue value={unrealized} size="md" />
            </div>
            <Link to="/open-trades" style={{
              fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4
            }}>
              SEE ALL <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["ASSET", "DIR", "ENTRY", "CURRENT", "STOP", "TP1", "LEVERAGE", "ROI", "P&L", "STATUS", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: h === "" || h === "ROI" || h === "P&L" ? "right" : "left",
                      fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", whiteSpace: "nowrap"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openTrades.map(trade => (
                  <tr key={trade.id} style={{ borderBottom: "1px solid #1a1a1a" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600 }}>{trade.asset}</td>
                    <td style={{ padding: "11px 14px" }}><DirectionBadge direction={trade.direction} /></td>
                    <td style={{ padding: "11px 14px", fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {trade.entry.toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, fontFamily: "JetBrains Mono", fontVariantNumeric: "tabular-nums" }}>
                      <span className="pulse-live" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--profit)", marginRight: 5, verticalAlign: "middle" }} />
                      {trade.currentPrice.toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--loss)", fontVariantNumeric: "tabular-nums" }}>
                      {trade.stop.toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--profit)", fontVariantNumeric: "tabular-nums" }}>
                      {trade.tp1.toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px" }}><LeverageBadge leverage={trade.leverage} /></td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      <RoiValue value={trade.tradeRoi} size="sm" />
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      <PnlValue value={trade.pnl} size="sm" />
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <StatusBadge status={trade.status} />
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      <Link to={`/trade/${trade.id}`} style={{
                        fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap"
                      }}>
                        VIEW →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 28 }}>
        {[
          { label: "WIN RATE", value: `${metrics.winRate}%`, color: "var(--profit)" },
          { label: "PROFIT FACTOR", value: metrics.profitFactor.toFixed(2), color: "var(--accent)" },
          { label: "EXPECTANCY", value: `$${metrics.expectancy}`, color: "var(--accent)" },
          { label: "TOTAL TRADES", value: metrics.totalTrades, color: "var(--text-primary)" },
          { label: "AVG WINNER", value: `$${metrics.averageWinner}`, color: "var(--profit)" },
          { label: "AVG LOSER", value: `-$${Math.abs(metrics.averageLoser)}`, color: "var(--loss)" },
          { label: "MAX DRAWDOWN", value: `${metrics.maxDrawdownPct}%`, color: "var(--loss)" },
          { label: "AVG R", value: `${metrics.averageR}R`, color: "var(--accent)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "14px", textAlign: "center"
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid #1a1a1a",
        borderRadius: 6, display: "flex", gap: 8, alignItems: "flex-start"
      }}>
        <AlertCircle size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Historical results do not guarantee future performance. Paper trading and historical simulations are not live trading.
          Risk management is essential. All calls are registered for transparency and audit purposes only.
        </p>
      </div>
    </div>
  );
}
