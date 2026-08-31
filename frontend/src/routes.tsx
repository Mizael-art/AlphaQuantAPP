import { createBrowserRouter } from "react-router";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/public/Home";
import LiveCalls from "./pages/public/LiveCalls";
import OpenTrades from "./pages/public/OpenTrades";
import TradeHistory from "./pages/public/TradeHistory";
import TradeDetail from "./pages/public/TradeDetail";
import Performance from "./pages/public/Performance";
import Reports from "./pages/public/Reports";
import About from "./pages/public/About";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublishCall from "./pages/admin/PublishCall";
import HistoricalTrade from "./pages/admin/HistoricalTrade";
import Analytics from "./pages/admin/Analytics";
import Backtest from "./pages/admin/Backtest";
import Strategies from "./pages/admin/Strategies";
import PaperTrading from "./pages/admin/PaperTrading";
import Settings from "./pages/admin/Settings";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge } from "./components/StatusBadge";
import { Link } from "react-router";
import { useApi } from "./lib/useApi";
import { adminApi, publicApi } from "./lib/api";
import { mapApiTrades } from "./lib/mapTrade";

function AdminOpenTrades() {
  const { data: overview, loading, error } = useApi(() => publicApi.overview());
  const all = mapApiTrades(overview?.openTrades ?? []);

  const handleClose = async (id: string) => {
    if (!confirm("Close this trade at current market price?")) return;
    await adminApi.closeCall(id);
    window.location.reload();
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>SYSTEM TEMPORARILY UNAVAILABLE — {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Open Trades</h1>
      </div>
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {["ASSET", "DIR", "ENTRY", "CURRENT", "STOP", "TP", "LVG", "MARGIN", "NOTIONAL", "ROI", "P&L", "R", "IMPACT", "STATUS", ""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: ["ROI", "P&L", "R", "IMPACT"].includes(h) ? "right" : "left", fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom: i < all.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "11px 12px", fontSize: 12, fontWeight: 700 }}>{t.asset}</td>
                  <td style={{ padding: "11px 12px" }}><DirectionBadge direction={t.direction} /></td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>{t.entry.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>{t.currentPrice.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--loss)" }}>{t.stop.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)" }}>{t.tp1.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px" }}><LeverageBadge leverage={t.leverage} /></td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>${t.margin.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>${t.notional.toLocaleString()}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right" }}><RoiValue value={t.tradeRoi} size="sm" /></td>
                  <td style={{ padding: "11px 12px", textAlign: "right" }}><PnlValue value={t.pnl} size="sm" /></td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>+{t.rMultiple.toFixed(2)}R</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>{t.accountImpact > 0 ? "+" : ""}{t.accountImpact.toFixed(2)}%</td>
                  <td style={{ padding: "11px 12px" }}><StatusBadge status={t.status} /></td>
                  <td style={{ padding: "11px 12px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link to={`/trade/${t.id}`} style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>VIEW</Link>
                      <span style={{ color: "var(--border)" }}>|</span>
                      <button onClick={() => handleClose(t.id)} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>CLOSE</button>
                    </div>
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

function AdminHistory() {
  const { data, loading, error } = useApi(() => publicApi.calls());
  const all = mapApiTrades(data ?? []);
  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>SYSTEM TEMPORARILY UNAVAILABLE — {error}</div>;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Trade History (Admin)</h1>
      </div>
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {["#", "DATE", "ASSET", "DIR", "ENTRY", "EXIT", "MARGIN", "LVG", "ROI", "P&L", "R", "EXIT REASON", "IMPACT", "STATUS"].map(h => (
                  <th key={h} style={{ padding: "9px 10px", textAlign: ["ROI", "P&L", "R", "IMPACT"].includes(h) ? "right" : "left", fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom: i < all.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-muted)" }}>{t.id}</td>
                  <td style={{ padding: "9px 10px", fontSize: 10, color: "var(--text-muted)" }}>{t.createdAt.split("T")[0]}</td>
                  <td style={{ padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>{t.asset}</td>
                  <td style={{ padding: "9px 10px" }}><DirectionBadge direction={t.direction} /></td>
                  <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-primary)" }}>{t.entry.toLocaleString()}</td>
                  <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-primary)" }}>{t.exit ? t.exit.toLocaleString() : "—"}</td>
                  <td style={{ padding: "9px 10px", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-primary)" }}>${t.margin}</td>
                  <td style={{ padding: "9px 10px" }}><LeverageBadge leverage={t.leverage} /></td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}><RoiValue value={t.tradeRoi} size="xs" /></td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}><PnlValue value={t.pnl} size="xs" /></td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--accent)" }}>{t.rMultiple > 0 ? "+" : ""}{t.rMultiple.toFixed(2)}R</td>
                  <td style={{ padding: "9px 10px", fontSize: 10, color: "var(--text-muted)" }}>{t.exitReason || "—"}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-primary)" }}>{t.accountImpact > 0 ? "+" : ""}{t.accountImpact.toFixed(2)}%</td>
                  <td style={{ padding: "9px 10px" }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <PublicLayout><Home /></PublicLayout> },
  { path: "/dashboard", element: <PublicLayout><Home /></PublicLayout> },
  { path: "/calls", element: <PublicLayout><LiveCalls /></PublicLayout> },
  { path: "/open-trades", element: <PublicLayout><OpenTrades /></PublicLayout> },
  { path: "/history", element: <PublicLayout><TradeHistory /></PublicLayout> },
  { path: "/trade/:id", element: <PublicLayout><TradeDetail /></PublicLayout> },
  { path: "/performance", element: <PublicLayout><Performance /></PublicLayout> },
  { path: "/reports", element: <PublicLayout><Reports /></PublicLayout> },
  { path: "/about", element: <PublicLayout><About /></PublicLayout> },
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/admin", element: <AdminLayout><AdminDashboard /></AdminLayout> },
  { path: "/admin/new-call", element: <AdminLayout><PublishCall /></AdminLayout> },
  { path: "/admin/log-trade", element: <AdminLayout><HistoricalTrade /></AdminLayout> },
  { path: "/admin/open-trades", element: <AdminLayout><AdminOpenTrades /></AdminLayout> },
  { path: "/admin/history", element: <AdminLayout><AdminHistory /></AdminLayout> },
  { path: "/admin/performance", element: <AdminLayout><Performance /></AdminLayout> },
  { path: "/admin/analytics", element: <AdminLayout><Analytics /></AdminLayout> },
  { path: "/admin/backtest", element: <AdminLayout><Backtest /></AdminLayout> },
  { path: "/admin/strategies", element: <AdminLayout><Strategies /></AdminLayout> },
  { path: "/admin/paper-trading", element: <AdminLayout><PaperTrading /></AdminLayout> },
  { path: "/admin/settings", element: <AdminLayout><Settings /></AdminLayout> },
]);
