import { BookOpen, TrendingUp, Clock, Target } from "lucide-react";
import { performanceByStrategy } from "../../data/mockData";

const strategies = [
  {
    name: "Trend Continuation",
    category: "Momentum",
    timeframes: ["1H", "4H", "1D"],
    description: "Enter in the direction of the established trend after a pullback to key support/resistance zones.",
    conditions: ["Price above 200 EMA", "Higher highs and higher lows", "RSI not overbought", "Volume confirmation"],
    stop: "Below previous swing low",
    targets: "1.5R, 2.5R, 4R",
    assets: "BTC, ETH, SOL",
    status: "ACTIVE",
  },
  {
    name: "Support Bounce",
    category: "Structure",
    timeframes: ["1H", "4H"],
    description: "Enter long at clearly defined support zones after a rejection candle confirms the level.",
    conditions: ["Price at established support", "Rejection wick", "Volume spike", "Bullish candle close"],
    stop: "Below support level",
    targets: "1.5R, 3R",
    assets: "BTC, ETH, BNB",
    status: "ACTIVE",
  },
  {
    name: "Resistance Rejection",
    category: "Structure",
    timeframes: ["1H", "4H"],
    description: "Enter short at clearly defined resistance zones after bearish rejection confirmation.",
    conditions: ["Price at established resistance", "Bearish wick", "Volume spike", "Bearish candle close"],
    stop: "Above resistance level",
    targets: "1.5R, 3R",
    assets: "BTC, ETH, SOL",
    status: "ACTIVE",
  },
  {
    name: "Breakout Retest",
    category: "Breakout",
    timeframes: ["4H", "1D"],
    description: "Enter after a confirmed breakout of a key level when price retests that level as new support/resistance.",
    conditions: ["Confirmed breakout close", "Retest of broken level", "Volume drop on retest", "Bullish/bearish confirmation"],
    stop: "Back inside structure",
    targets: "2R, 4R, 6R",
    assets: "BTC, ETH, AVAX",
    status: "ACTIVE",
  },
];

export default function Strategies() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Strategy Research</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "4px 0 0" }}>
          Documented playbooks and statistical performance.
        </p>
      </div>

      {/* Performance summary */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 20, overflowX: "auto" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>STRATEGY PERFORMANCE SUMMARY</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
              {["STRATEGY", "TRADES", "WIN RATE", "P&L", "PROFIT FACTOR", "EXPECTANCY", "AVG R"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "STRATEGY" ? "left" : "right", fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performanceByStrategy.map((row, i) => (
              <tr key={row.strategy}
                style={{ borderBottom: i < performanceByStrategy.length - 1 ? "1px solid var(--bg-secondary)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-primary)" }}>{row.strategy}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.trades}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)" }}>{row.winRate}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)" }}>+${row.pnl.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>{row.profitFactor.toFixed(1)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>${row.expectancy}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>{row.avgR.toFixed(1)}R</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
        {strategies.map(s => (
          <div key={s.name} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4, border: "1px solid #1a1a1a" }}>
                    {s.category}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--accent)", background: "#1a1600", padding: "2px 6px", borderRadius: 4, border: "1px solid #D4AF3720" }}>
                    {s.timeframes.join(" / ")}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 9, color: "var(--profit)", background: "#001a18", padding: "3px 8px", borderRadius: 4, border: "1px solid #26A69A20", fontWeight: 600 }}>
                {s.status}
              </span>
            </div>

            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{s.description}</p>
            </div>

            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8 }}>CONDITIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {s.conditions.map(c => (
                  <div key={c} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "var(--accent)", fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>STOP</div>
                <div style={{ fontSize: 10, color: "var(--loss)" }}>{s.stop}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>TARGETS</div>
                <div style={{ fontSize: 10, color: "var(--profit)" }}>{s.targets}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>ASSETS</div>
                <div style={{ fontSize: 10, color: "var(--text-primary)" }}>{s.assets}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
