import { Link } from "react-router";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge } from "../../components/StatusBadge";
import { Plus, AlertTriangle, TrendingUp } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrades } from "../../lib/mapTrade";

export default function AdminDashboard() {
  const { data: overview, loading, error } = useApi(() => publicApi.overview());

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard…</div>;
  if (error || !overview) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>SYSTEM TEMPORARILY UNAVAILABLE — {error}</div>;

  const openTrades = mapApiTrades(overview.openTrades);
  const unrealized = overview.unrealizedPnlUsd;
  const openRisk = openTrades.reduce((s, t) => s + t.margin, 0);
  const metrics = {
    activeCalls: overview.activeCalls,
    todayPnl: overview.today.pnlUsd,
    weekPnl: overview.week.pnlUsd,
    monthPnl: overview.month.pnlUsd,
    allTimePnl: overview.allTime.pnlUsd,
    realizedPnl: overview.realizedPnlUsd,
  };
  // Real, data-derived alerts (never fabricated): flag open trades trading
  // within 1% of their next unhit TP level, so admins know what to watch.
  const pendingActions = openTrades
    .map((t) => {
      const nextTp = !t.tp1Hit ? t.tp1 : !t.tp2Hit && t.tp2 ? t.tp2 : t.tp3;
      if (!nextTp) return null;
      const distPct = Math.abs((t.currentPrice - nextTp) / nextTp) * 100;
      if (distPct > 1) return null;
      return { text: `${t.asset} approaching next TP (${nextTp.toLocaleString()}).`, type: "info" as const };
    })
    .filter((x): x is { text: string; type: "info" } => x !== null);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN DASHBOARD</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Control Panel</h1>
        </div>
        <Link to="/admin/new-call" style={{
          background: "var(--accent)", color: "var(--bg-app)", padding: "9px 16px",
          borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none",
          letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={13} /> PUBLISH CALL
        </Link>
      </div>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "ACTIVE CALLS", value: metrics.activeCalls, color: "var(--accent)" },
          { label: "TODAY P&L", value: <PnlValue value={metrics.todayPnl} size="md" />, raw: true },
          { label: "WEEK P&L", value: <PnlValue value={metrics.weekPnl} size="md" />, raw: true },
          { label: "MONTH P&L", value: <PnlValue value={metrics.monthPnl} size="md" />, raw: true },
          { label: "ALL TIME P&L", value: <PnlValue value={metrics.allTimePnl} size="md" />, raw: true },
          { label: "OPEN RISK", value: `$${openRisk.toLocaleString()}`, color: "#C9A227" },
          { label: "REALIZED P&L", value: <PnlValue value={metrics.realizedPnl} size="md" />, raw: true },
          { label: "UNREALIZED P&L", value: <PnlValue value={unrealized} size="md" />, raw: true },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px"
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            {s.raw ? s.value : (
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color || "var(--text-primary)", fontFamily: "JetBrains Mono" }}>{s.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pending Actions */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <AlertTriangle size={14} style={{ color: "#C9A227" }} />
          <div style={{ fontSize: 10, color: "#C9A227", letterSpacing: "0.1em", fontWeight: 600 }}>PENDING ACTIONS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingActions.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "10px 12px" }}>No pending actions.</div>
          ) : (
            pendingActions.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid #1a1a1a"
              }}>
                <span style={{ fontSize: 9, color: "#C9A227" }}>○</span>
                <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{item.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Open trades quick view */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>OPEN POSITIONS</span>
          </div>
          <Link to="/admin/open-trades" style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none" }}>MANAGE ALL →</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1a", background: "var(--bg-secondary)" }}>
                {["ASSET", "DIR", "ENTRY", "CURRENT", "ROI", "P&L", "R", "IMPACT", "STATUS", ""].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: ["ROI", "P&L", "R", "IMPACT"].includes(h) ? "right" : "left", fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openTrades.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom: i < openTrades.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700 }}>{t.asset}</td>
                  <td style={{ padding: "10px 12px" }}><DirectionBadge direction={t.direction} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{t.entry.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{t.currentPrice.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}><RoiValue value={t.tradeRoi} size="sm" /></td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}><PnlValue value={t.pnl} size="sm" /></td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>+{t.rMultiple.toFixed(2)}R</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>{t.accountImpact > 0 ? "+" : ""}{t.accountImpact.toFixed(2)}%</td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={t.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <Link to={`/admin/edit/${t.id}`} style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>EDIT</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
