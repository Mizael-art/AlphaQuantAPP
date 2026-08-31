import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Cell
} from "recharts";
import { publicApi } from "../../lib/api";
import { PnlValue, RoiValue } from "../../components/StatusBadge";

type Period = "DAY" | "WEEK" | "MONTH" | "ALL";
const PERIODS: Period[] = ["DAY", "WEEK", "MONTH", "ALL"];
const PERIOD_KEY: Record<Period, "today" | "week" | "month" | "allTime"> = {
  DAY: "today", WEEK: "week", MONTH: "month", ALL: "allTime",
};

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth < 820);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

export default function Performance() {
  const [period, setPeriod] = useState<Period>("ALL");
  const [equityFilter, setEquityFilter] = useState("ALL");
  const [overview, setOverview] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([publicApi.overview(), publicApi.performance()])
      .then(([ov, pf]) => {
        if (cancelled) return;
        setOverview(ov);
        setPerf(pf);
        setError(null);
      })
      .catch(() => !cancelled && setError("Could not load performance data."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 13 }}>Loading performance…</div>;
  }
  if (error || !overview) {
    return <div style={{ padding: 24, color: "var(--loss)", fontSize: 13 }}>{error ?? "No data available."}</div>;
  }

  const stat = overview[PERIOD_KEY[period]] ?? {};
  const allTimeStat = overview.allTime ?? {};

  const equityCurveRaw: { date: string; equity: number }[] = overview.equityCurve ?? [];
  const equityDays = { "7D": 7, "30D": 30, "90D": 90, "6M": 180, "1Y": 365, ALL: Infinity }[equityFilter] ?? Infinity;
  const equityCurveData = equityCurveRaw
    .slice(Math.max(0, equityCurveRaw.length - equityDays))
    .map(p => ({ date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), equity: p.equity }));

  const startingCapital = equityCurveData[0]?.equity ?? 10000;
  const currentEquity = equityCurveData[equityCurveData.length - 1]?.equity ?? startingCapital;
  const hwm = equityCurveData.reduce((m, p) => Math.max(m, p.equity), startingCapital);
  const maxDD = equityCurveData.reduce((min, p) => Math.min(min, p.equity - hwm), 0);

  const dailyPnlData = equityCurveData.slice(1).map((p, i) => ({
    date: p.date,
    pnl: Math.round((p.equity - equityCurveData[i].equity) * 100) / 100,
  }));

  const byAsset = (perf?.byAsset ?? []).slice().sort((a: any, b: any) => b.totalPnlUsd - a.totalPnlUsd);
  const byStrategy = perf?.byStrategy ?? [];

  const gridCols = mobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))";

  return (
    <div style={{ padding: mobile ? 14 : 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>PERFORMANCE</div>
          <h1 style={{ fontSize: mobile ? 18 : 22, fontWeight: 700, margin: 0 }}>AlphaQuant Performance</h1>
          <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              All Time ROI: <span style={{ color: allTimeStat.roiPct >= 0 ? "var(--profit)" : "var(--loss)" }}>
                {allTimeStat.roiPct >= 0 ? "+" : ""}{(allTimeStat.roiPct ?? 0).toFixed(1)}%
              </span>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-panel)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              background: period === p ? "#1a1600" : "none",
              border: period === p ? "1px solid #D4AF3730" : "1px solid transparent",
              color: period === p ? "var(--accent)" : "var(--text-muted)",
              padding: "6px 12px", borderRadius: 5, fontSize: 10, cursor: "pointer",
              fontWeight: period === p ? 600 : 400, letterSpacing: "0.06em"
            }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 10, marginBottom: 20 }}>
        {[
          { label: "P&L", value: <PnlValue value={stat.pnlUsd ?? 0} size="lg" />, sub: "Realized" },
          { label: "ROI", value: <RoiValue value={stat.roiPct ?? 0} size="lg" />, sub: "On capital" },
          { label: "TRADES", value: <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>{stat.trades ?? 0}</span>, sub: "Total" },
          { label: "WIN RATE", value: <span style={{ fontSize: 20, fontWeight: 700, color: "var(--profit)", fontFamily: "JetBrains Mono" }}>{(stat.winRatePct ?? 0).toFixed(1)}%</span>, sub: `${stat.wins ?? 0}W / ${stat.losses ?? 0}L` },
          { label: "DRAWDOWN", value: <span style={{ fontSize: 18, fontWeight: 700, color: "var(--loss)", fontFamily: "JetBrains Mono" }}>{((maxDD / (hwm || 1)) * 100).toFixed(1)}%</span>, sub: "Max" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 12 : 16 }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
            <div>{s.value}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center", marginBottom: 16, flexDirection: mobile ? "column" : "row", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>EQUITY CURVE</div>
            <div style={{ display: "flex", gap: mobile ? 12 : 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>STARTING</div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>${startingCapital.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>CURRENT</div>
                <div style={{ fontSize: 12, color: "var(--profit)", fontFamily: "JetBrains Mono" }}>${currentEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>HWM</div>
                <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "JetBrains Mono" }}>${hwm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>MAX DD</div>
                <div style={{ fontSize: 12, color: "var(--loss)", fontFamily: "JetBrains Mono" }}>${maxDD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["7D", "30D", "90D", "6M", "1Y", "ALL"].map(f => (
              <button key={f} onClick={() => setEquityFilter(f)} style={{
                background: equityFilter === f ? "#1a1600" : "none",
                border: equityFilter === f ? "1px solid #D4AF3730" : "1px solid transparent",
                color: equityFilter === f ? "var(--accent)" : "var(--text-muted)",
                padding: "4px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                fontWeight: equityFilter === f ? 600 : 400
              }}>{f}</button>
            ))}
          </div>
        </div>
        {equityCurveData.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            No closed trades yet — the equity curve fills in once trades close.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={mobile ? 160 : 200}>
            <AreaChart data={equityCurveData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="eqGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={mobile ? Math.ceil(equityCurveData.length / 4) : Math.ceil(equityCurveData.length / 8)} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={mobile ? 32 : 40} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
              <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={1.5} fill="url(#eqGold)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 340px", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>DAILY P&L</div>
          {dailyPnlData.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={mobile ? 140 : 180}>
              <BarChart data={dailyPnlData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={Math.ceil(dailyPnlData.length / (mobile ? 4 : 8))} />
                <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={mobile ? 28 : 36} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6 }} formatter={(v: any) => [`$${v}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                  {dailyPnlData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>KEY METRICS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Total Trades", value: allTimeStat.trades ?? 0 },
              { label: "Winning Trades", value: allTimeStat.wins ?? 0, color: "var(--profit)" },
              { label: "Losing Trades", value: allTimeStat.losses ?? 0, color: "var(--loss)" },
              { label: "Win Rate", value: `${(allTimeStat.winRatePct ?? 0).toFixed(1)}%`, color: "var(--profit)" },
              { label: "Realized P&L", value: `$${(allTimeStat.realizedPnlUsd ?? 0).toLocaleString()}`, color: "var(--profit)" },
              { label: "Unrealized P&L", value: `$${(allTimeStat.unrealizedPnlUsd ?? 0).toLocaleString()}`, color: "var(--accent)" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.label}</span>
                <span style={{ fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: 600, color: (row as any).color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>PERFORMANCE BY ASSET</div>
        {byAsset.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No closed trades yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 560 : undefined }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["ASSET", "TRADES", "WIN RATE", "P&L", "ROI", "PROFIT FACTOR"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: h === "ASSET" || h === "TRADES" ? "left" : "right", fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byAsset.map((row: any, i: number) => (
                  <tr key={row.key} style={{ borderBottom: i < byAsset.length - 1 ? "1px solid var(--bg-secondary)" : "none" }}>
                    <td style={{ padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>{row.key}</td>
                    <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.totalTrades}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--profit)", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.winRatePct.toFixed(1)}%</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}><PnlValue value={row.totalPnlUsd} size="xs" /></td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}><RoiValue value={row.totalReturnPct} size="xs" /></td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--accent)", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.profitFactor !== null ? row.profitFactor.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>PERFORMANCE BY STRATEGY</div>
        {byStrategy.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No closed trades yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 560 : undefined }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["STRATEGY", "TRADES", "WIN RATE", "P&L", "ROI", "PROFIT FACTOR"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: h === "STRATEGY" || h === "TRADES" ? "left" : "right", fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStrategy.map((row: any, i: number) => (
                  <tr key={row.key} style={{ borderBottom: i < byStrategy.length - 1 ? "1px solid var(--bg-secondary)" : "none" }}>
                    <td style={{ padding: "9px 10px", fontSize: 11, color: "var(--text-primary)" }}>{row.key}</td>
                    <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.totalTrades}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--profit)", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.winRatePct.toFixed(1)}%</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}><PnlValue value={row.totalPnlUsd} size="xs" /></td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}><RoiValue value={row.totalReturnPct} size="xs" /></td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--accent)", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.profitFactor !== null ? row.profitFactor.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
