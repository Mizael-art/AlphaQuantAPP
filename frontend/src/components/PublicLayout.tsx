import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Zap, TrendingUp, Clock, BarChart2,
  FileText, Info, Shield, ChevronLeft, ChevronRight, Search, Bell, Menu, X, Sun, Moon
} from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/calls", icon: Zap, label: "Live Calls" },
  { to: "/open-trades", icon: TrendingUp, label: "Open Trades" },
  { to: "/history", icon: Clock, label: "Trade History" },
  { to: "/performance", icon: BarChart2, label: "Performance" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/about", icon: Info, label: "About" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();

  const handleAdminGate = () => {
    setMobileOpen(false);
    const answer = window.prompt("Enter access password:");
    if (answer === null) return; // user cancelled
    if (answer === "VIP") {
      navigate("/admin/login");
    } else {
      window.alert("Incorrect password.");
    }
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      style={{
        width: mobile ? 240 : collapsed ? 60 : 220,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 0.2s ease",
        flexShrink: 0,
        zIndex: mobile ? 50 : undefined,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1a1a1a" }}>
        {(!collapsed || mobile) ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, background: "linear-gradient(135deg, var(--accent), #9B7A18)",
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "var(--bg-app)"
              }}>AQ</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", color: "var(--text-bright)" }}>
                  ALPHAQUANT <span style={{ color: "var(--accent)" }}>X</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", marginTop: 4, paddingLeft: 36 }}>
              QUANTITATIVE TRADING INTELLIGENCE
            </div>
          </div>
        ) : (
          <div style={{
            width: 28, height: 28, background: "linear-gradient(135deg, var(--accent), #9B7A18)",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "var(--bg-app)"
          }}>AQ</div>
        )}
      </div>

      {/* Live status */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #1a1a1a" }}>
        {(!collapsed || mobile) ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="pulse-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--profit)", display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "var(--profit)", fontWeight: 600, letterSpacing: "0.1em" }}>LIVE</span>
            <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 4 }}>12:42:18</span>
          </div>
        ) : (
          <span className="pulse-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--profit)", display: "block", margin: "4px auto" }} />
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                color: active ? "var(--accent)" : "var(--text-muted)",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.04em",
                background: active ? "#1a1600" : "transparent",
                borderRight: active ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              {(!collapsed || mobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      <div style={{ borderTop: "1px solid #1a1a1a", padding: "8px 0" }}>
        <button
          onClick={handleAdminGate}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 16px", color: "var(--text-muted)", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            textAlign: "left", fontSize: 12, letterSpacing: "0.04em",
            fontFamily: "inherit",
          }}
        >
          <Shield size={15} style={{ flexShrink: 0 }} />
          {(!collapsed || mobile) && <span>Admin Login</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      {!mobile && (
        <div style={{ borderTop: "1px solid #1a1a1a", padding: 8, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-app)", overflow: "hidden" }}>
      {/* Desktop sidebar */}
      <div className="hidden-mobile">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          height: 48, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0
        }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
          >
            <Menu size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <span className="pulse-live" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--profit)", display: "inline-block" }} />
            <span style={{ color: "var(--profit)", fontWeight: 600, letterSpacing: "0.08em" }}>SYSTEM ONLINE</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>LAST UPDATE: 12:42:18</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ color: "var(--accent)" }}>ACTIVE CALLS: 5</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>CLOSED TODAY: 4</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{
              background: "#1a1400", color: "#C9A227", border: "1px solid #C9A22730",
              padding: "2px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em"
            }}>PAPER / SIMULATION</span>
          </div>

          <div style={{ flex: 1 }} />

          <button style={{
            background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text-muted)", padding: "5px 10px", display: "flex", alignItems: "center",
            gap: 6, cursor: "pointer", fontSize: 11
          }}>
            <Search size={12} />
            <span>Search...</span>
          </button>

          <button
            onClick={toggleMode}
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer", padding: 6, display: "flex" }}
          >
            {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <Bell size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
