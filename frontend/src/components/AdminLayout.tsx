import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard, Plus, TrendingUp, Clock, BarChart2,
  FlaskConical, BookOpen, Activity, Settings, Globe, ChevronLeft, ChevronRight,
  Terminal, Beaker, History, Menu, X
} from "lucide-react";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/new-call", icon: Plus, label: "Publish Call" },
  { to: "/admin/log-trade", icon: History, label: "Log Closed Trade" },
  { to: "/admin/open-trades", icon: TrendingUp, label: "Open Trades" },
  { to: "/admin/history", icon: Clock, label: "Trade History" },
  { to: "/admin/performance", icon: BarChart2, label: "Performance" },
  { to: "/admin/analytics", icon: Activity, label: "Analytics" },
  { to: "/admin/backtest", icon: FlaskConical, label: "Backtest" },
  { to: "/admin/strategies", icon: BookOpen, label: "Strategies" },
  { to: "/admin/paper-trading", icon: Beaker, label: "Paper Trading" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{
      width: mobile ? 240 : collapsed ? 60 : 220,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      transition: "width 0.2s ease",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {(!collapsed || mobile) ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: "linear-gradient(135deg, var(--accent), #9B7A18)",
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "var(--bg-app)"
            }}>AQ</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", color: "var(--text-bright)" }}>
                ALPHAQUANT <span style={{ color: "var(--accent)" }}>X</span>
              </div>
              <div style={{ fontSize: 8, color: "var(--loss)", letterSpacing: "0.1em", fontWeight: 600 }}>ADMIN TERMINAL</div>
            </div>
          </div>
        ) : (
          <div style={{
            width: 28, height: 28, background: "linear-gradient(135deg, var(--accent), #9B7A18)",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "var(--bg-app)"
          }}>AQ</div>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to || (to !== "/admin" && loc.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px",
                color: active ? "var(--accent)" : "var(--text-muted)",
                textDecoration: "none",
                fontSize: 12, fontWeight: active ? 600 : 400, letterSpacing: "0.04em",
                background: active ? "#1a1600" : "transparent",
                borderRight: active ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {(!collapsed || mobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Public link */}
      <div style={{ borderTop: "1px solid #1a1a1a", padding: "8px 0" }}>
        <Link to="/" onClick={() => setMobileOpen(false)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 16px", color: "var(--text-muted)", textDecoration: "none", fontSize: 12
        }}>
          <Globe size={14} style={{ flexShrink: 0 }} />
          {(!collapsed || mobile) && <span>Public View</span>}
        </Link>
      </div>

      {!mobile && (
        <div style={{ borderTop: "1px solid #1a1a1a", padding: 8, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-app)", overflow: "hidden" }}>
      {/* Desktop sidebar */}
      <div className="admin-hidden-mobile">
        <Sidebar />
      </div>

      {/* Mobile drawer + overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "#00000080" }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0 }}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 48, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0
        }}>
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
          >
            <Menu size={18} />
          </button>
          <Terminal size={14} style={{ color: "var(--accent)", flexShrink: 0 }} className="admin-hidden-mobile-inline" />
          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em" }}>ADMIN</span>
          <span style={{ color: "var(--border)" }} className="admin-hidden-mobile-inline">·</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="admin-hidden-mobile-inline">
            AlphaQuant X Control Panel
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="pulse-live" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--profit)", display: "block" }} />
            <span style={{ fontSize: 10, color: "var(--profit)", fontWeight: 600, whiteSpace: "nowrap" }}>SYSTEM ONLINE</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-hidden-mobile { display: flex !important; }
          .admin-hidden-mobile-inline { display: inline !important; }
          .admin-mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-hidden-mobile { display: none !important; }
          .admin-hidden-mobile-inline { display: none !important; }
          .admin-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
