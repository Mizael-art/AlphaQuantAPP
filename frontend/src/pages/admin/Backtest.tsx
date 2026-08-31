import { useState } from "react";
import { FlaskConical, Play, AlertCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const mockResult = {
  trades: 42,
  winRate: 64.3,
  wins: 27,
  losses: 15,
  profitFactor: 2.1,
  expectancy: 148,
  totalReturn: 84.2,
  totalPnl: 8420,
  startingCapital: 10000,
  finalCapital: 18420,
  maxDrawdown: -1240,
  maxDrawdownPct: -12.4,
  averageR: 1.68,
  fees: 84,
  slippage: 42,
  avgWinner: 312,
  avgLoser: -148,
  equityCurve: [
    { trade: 1, equity: 10200 }, { trade: 4, equity: 10050 }, { trade: 8, equity: 11200 },
    { trade: 12, equity: 10960 }, { trade: 16, equity: 12400 }, { trade: 20, equity: 12100 },
    { trade: 24, equity: 14200 }, { trade: 28, equity: 13800 }, { trade: 32, equity: 15600 },
    { trade: 36, equity: 16800 }, { trade: 40, equity: 17900 }, { trade: 42, equity: 18420 },
  ],
  tradeResults: [-80, 320, -140, 280, 420, -200, 180, -60, 360, 280, -120, 480, -80, 200, 310,
    -150, 260, 390, -90, 180, -70, 440, 280, -160, 350, 420, -80, 310, 220, -140,
    390, -60, 280, 460, -100, 330, -80, 210, 380, -120, 290, 440]
};

const INPUT_STYLE = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: 6, color: "var(--text-bright)", fontSize: 12,
  outline: "none", fontFamily: "JetBrains Mono",
  boxSizing: "border-box" as const
};

const LABEL = { fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block" as const, marginBottom: 5 };

export default function Backtest() {
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({
    strategy: "Trend Continuation", asset: "BTCUSDT", timeframe: "1H",
    start: "2025-01-01", end: "2025-12-31",
    capital: "10000", risk: "1", leverage: "10",
    fees: "0.05", slippage: "0.02"
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const run = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 1500);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Strategy Backtest</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "4px 0 0" }}>
          Historical simulation. Results use mock data for demonstration.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: ran ? "320px 1fr" : "1fr", gap: 16 }}>
        {/* Config panel */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", alignSelf: "start" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>BACKTEST CONFIGURATION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={LABEL}>STRATEGY</label>
              <select value={form.strategy} onChange={e => set("strategy", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                {["Trend Continuation", "Support Bounce", "Resistance Rejection", "Breakout Retest"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={LABEL}>ASSET</label>
                <select value={form.asset} onChange={e => set("asset", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                  {["BTCUSDT", "ETHUSDT", "SOLUSDT"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>TIMEFRAME</label>
                <select value={form.timeframe} onChange={e => set("timeframe", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                  {["15M", "1H", "4H", "1D"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>START DATE</label>
                <input type="date" value={form.start} onChange={e => set("start", e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL}>END DATE</label>
                <input type="date" value={form.end} onChange={e => set("end", e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL}>CAPITAL ($)</label>
                <input value={form.capital} onChange={e => set("capital", e.target.value)} style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label style={LABEL}>RISK (%)</label>
                <input value={form.risk} onChange={e => set("risk", e.target.value)} style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label style={LABEL}>LEVERAGE</label>
                <input value={form.leverage} onChange={e => set("leverage", e.target.value)} style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label style={LABEL}>FEES (%)</label>
                <input value={form.fees} onChange={e => set("fees", e.target.value)} style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
              </div>
            </div>
          </div>

          <button onClick={run} disabled={running} style={{
            marginTop: 16, width: "100%", padding: "11px",
            background: running ? "#9B7A18" : "var(--accent)",
            border: "none", borderRadius: 6, color: "var(--bg-app)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            cursor: running ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>
            <Play size={13} /> {running ? "RUNNING..." : "RUN BACKTEST"}
          </button>

          <div style={{ marginTop: 10, padding: "8px", background: "var(--bg-secondary)", borderRadius: 5 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <AlertCircle size={11} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Historical simulations use mock data. Connect to a data provider for real results.</span>
            </div>
          </div>
        </div>

        {/* Results */}
        {ran && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {[
                { label: "TOTAL RETURN", value: `+${mockResult.totalReturn}%`, color: "var(--profit)" },
                { label: "TOTAL P&L", value: `+$${mockResult.totalPnl.toLocaleString()}`, color: "var(--profit)" },
                { label: "FINAL CAPITAL", value: `$${mockResult.finalCapital.toLocaleString()}`, color: "var(--accent)" },
                { label: "WIN RATE", value: `${mockResult.winRate}%`, color: "var(--profit)" },
                { label: "PROFIT FACTOR", value: mockResult.profitFactor.toFixed(1), color: "var(--accent)" },
                { label: "EXPECTANCY", value: `$${mockResult.expectancy}`, color: "var(--accent)" },
                { label: "TOTAL TRADES", value: mockResult.trades, color: "var(--text-primary)" },
                { label: "MAX DRAWDOWN", value: `${mockResult.maxDrawdownPct}%`, color: "var(--loss)" },
                { label: "AVG R", value: `${mockResult.averageR}R`, color: "var(--accent)" },
                { label: "FEES PAID", value: `$${mockResult.fees}`, color: "var(--text-muted)" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Equity curve */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>BACKTEST EQUITY CURVE</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={mockResult.equityCurve} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="trade" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} label={{ value: "Trade #", position: "insideBottom", fill: "var(--text-muted)", fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6 }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, "Equity"]} />
                  <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={1.5} fill="url(#btGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trade distribution */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>TRADE P&L DISTRIBUTION</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={mockResult.tradeResults.map((v, i) => ({ i: i + 1, pnl: v }))} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="i" tick={{ fontSize: 8, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6 }}
                    formatter={(v: any) => [`$${v}`, "P&L"]} />
                  <Bar dataKey="pnl" radius={[1, 1, 0, 0]}>
                    {mockResult.tradeResults.map((v, i) => <Cell key={i} fill={v >= 0 ? "var(--profit)" : "var(--loss)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
