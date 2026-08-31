import { metrics, performanceByAsset, performanceByStrategy } from "../../data/mockData";
import { PnlValue, RoiValue } from "../../components/StatusBadge";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const directionData = [
  { dir: "LONG", trades: 52, winRate: 69.2, pnl: 13840, roi: 138.4, profitFactor: 2.6, expectancy: 165 },
  { dir: "SHORT", trades: 26, winRate: 57.7, pnl: 4580, roi: 45.8, profitFactor: 1.9, expectancy: 102 },
];

const timeframeData = [
  { tf: "15M", trades: 8, winRate: 50, profitFactor: 1.2, expectancy: 45, avgR: 0.9, pnl: 360 },
  { tf: "1H", trades: 38, winRate: 68.4, profitFactor: 2.4, expectancy: 142, avgR: 1.7, pnl: 8420 },
  { tf: "4H", trades: 22, winRate: 63.6, profitFactor: 2.1, expectancy: 138, avgR: 1.6, pnl: 6180 },
  { tf: "1D", trades: 10, winRate: 70, profitFactor: 2.9, expectancy: 218, avgR: 2.4, pnl: 3460 },
];

const radarData = [
  { metric: "Win Rate", value: 66.7 },
  { metric: "Profit Factor", value: 80 },
  { metric: "Expectancy", value: 71 },
  { metric: "Consistency", value: 82 },
  { metric: "Risk Mgmt", value: 78 },
  { metric: "Drawdown Ctrl", value: 65 },
];

export default function Analytics() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Analytics</h1>
      </div>

      {/* Performance intelligence */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>
          PERFORMANCE INTELLIGENCE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {[
            { label: "BEST STRATEGY", value: "Trend Continuation", color: "var(--accent)" },
            { label: "BEST ASSET", value: "BTCUSDT", color: "var(--accent)" },
            { label: "BEST TIMEFRAME", value: "1D", color: "var(--accent)" },
            { label: "BEST DIRECTION", value: "LONG", color: "var(--accent)" },
            { label: "WORST STRATEGY", value: "Reversal", color: "var(--loss)" },
            { label: "WORST ASSET", value: "XRPUSDT", color: "var(--loss)" },
            { label: "WORST TIMEFRAME", value: "15M", color: "var(--loss)" },
            { label: "WORST DIRECTION", value: "SHORT", color: "var(--text-muted)" },
            { label: "LARGEST WIN", value: "+$847", color: "var(--profit)" },
            { label: "LARGEST LOSS", value: "-$320", color: "var(--loss)" },
            { label: "BEST R", value: "+4.0R", color: "var(--profit)" },
            { label: "WORST R", value: "-1.0R", color: "var(--loss)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--bg-secondary)", border: "1px solid #1a1a1a", borderRadius: 6, padding: "12px" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Direction + Risk overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>
            PERFORMANCE BY DIRECTION
          </div>
          {directionData.map(d => (
            <div key={d.dir} style={{ marginBottom: 16, padding: "14px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: d.dir === "LONG" ? "var(--accent)" : "var(--text-muted)",
                  padding: "3px 8px", background: d.dir === "LONG" ? "#1a1600" : "#1a1a1a",
                  borderRadius: 4, border: `1px solid ${d.dir === "LONG" ? "#D4AF3730" : "#27272750"}`
                }}>{d.dir}</span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-muted)" }}>{d.trades} trades</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "WIN RATE", value: `${d.winRate}%`, color: "var(--profit)" },
                  { label: "PROFIT FACTOR", value: d.profitFactor.toFixed(1), color: "var(--accent)" },
                  { label: "P&L", value: `+$${d.pnl.toLocaleString()}`, color: "var(--profit)" },
                  { label: "EXPECTANCY", value: `$${d.expectancy}`, color: "var(--text-primary)" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>
            RISK OVERVIEW
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "OPEN RISK", value: "$3,300", desc: "Total margin in open positions", color: "#C9A227" },
              { label: "LARGEST OPEN POSITION", value: "$10,000", desc: "BTCUSDT notional", color: "var(--text-primary)" },
              { label: "LARGEST DRAWDOWN", value: "-$820", desc: "Historical max drawdown", color: "var(--loss)" },
              { label: "AVERAGE RISK PER TRADE", value: "$660", desc: "Average margin per trade", color: "var(--text-primary)" },
              { label: "MAX RISK (ALL TIME)", value: "$1,000", desc: "Highest single trade margin", color: "var(--text-primary)" },
              { label: "LEVERAGE EXPOSURE", value: "59,800", desc: "Total notional in USD", color: "#C9A227" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "var(--bg-secondary)", borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", opacity: 0.6 }}>{s.desc}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Timeframe */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>
          PERFORMANCE BY TIMEFRAME
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {timeframeData.map(tf => (
            <div key={tf.tf} style={{ background: "var(--bg-secondary)", border: "1px solid #1a1a1a", borderRadius: 6, padding: "14px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", fontFamily: "JetBrains Mono", marginBottom: 10 }}>{tf.tf}</div>
              {[
                { label: "TRADES", value: tf.trades },
                { label: "WIN RATE", value: `${tf.winRate}%` },
                { label: "PROFIT FACTOR", value: tf.profitFactor.toFixed(1) },
                { label: "EXPECTANCY", value: `$${tf.expectancy}` },
                { label: "AVG R", value: `${tf.avgR}R` },
                { label: "P&L", value: `+$${tf.pnl.toLocaleString()}` },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-primary)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Radar */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>
          PERFORMANCE RADAR
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <ResponsiveContainer width={280} height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#1a1a1a" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
              <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {radarData.map(r => (
              <div key={r.metric} style={{ padding: "10px", background: "var(--bg-secondary)", borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{r.metric}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: "#1a1a1a", borderRadius: 2 }}>
                    <div style={{ width: `${r.value}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--accent)", minWidth: 28 }}>{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
