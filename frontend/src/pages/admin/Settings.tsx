import { Settings as SettingsIcon, Save, Sun, Moon, Check } from "lucide-react";
import { useState } from "react";
import { useTheme, type AccentColor } from "../../theme/ThemeContext";

const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: "gold", label: "Gold", swatch: "#D4AF37" },
  { id: "blue", label: "Blue", swatch: "#4A90D9" },
  { id: "green", label: "Green", swatch: "#3FAE72" },
  { id: "purple", label: "Purple", swatch: "#9B6FD9" },
  { id: "rose", label: "Rose", swatch: "#D96F9B" },
];

const INPUT = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: 6, color: "var(--text-bright)", fontSize: 12,
  outline: "none", fontFamily: "inherit",
  boxSizing: "border-box" as const
};
const LABEL = { fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block" as const, marginBottom: 5 };

export default function Settings() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [capital, setCapital] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [projectName, setProjectName] = useState("AlphaQuant X");

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Appearance */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>APPEARANCE</div>

          <div style={{ marginBottom: 18 }}>
            <label style={LABEL}>THEME</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "dark" as const, label: "Dark", icon: Moon }, { id: "light" as const, label: "Light", icon: Sun }].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px 0", borderRadius: 6, cursor: "pointer",
                    background: mode === opt.id ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "var(--bg-secondary)",
                    border: mode === opt.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                    color: mode === opt.id ? "var(--accent)" : "var(--text-muted)",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={LABEL}>ACCENT COLOR</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ACCENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  title={a.label}
                  style={{
                    width: 40, height: 40, borderRadius: "50%", background: a.swatch,
                    border: accent === a.id ? "2px solid var(--text-bright)" : "2px solid transparent",
                    outline: accent === a.id ? `2px solid ${a.swatch}` : "none",
                    outlineOffset: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {accent === a.id && <Check size={16} color="#080808" strokeWidth={3} />}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10 }}>
              Saved in this browser only — each visitor can pick their own theme from the toggle in the public site header.
            </p>
          </div>
        </div>

        {/* Account */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>ACCOUNT CONFIGURATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={LABEL}>PROJECT NAME</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} style={INPUT}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={LABEL}>PROJECT START DATE</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>STARTING CAPITAL ($)</label>
              <input value={capital} onChange={e => setCapital(e.target.value)} style={INPUT}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={LABEL}>DEFAULT RISK PER TRADE (%)</label>
              <input value={riskPct} onChange={e => setRiskPct(e.target.value)} style={INPUT}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
          </div>
        </div>

        {/* Display */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>DISPLAY & DATA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Show DEMO DATA banner", defaultOn: true },
              { label: "Show disclaimer on public pages", defaultOn: true },
              { label: "Show verification badges", defaultOn: true },
              { label: "Display unrealized P&L in overview", defaultOn: true },
              { label: "Public call notifications", defaultOn: false },
            ].map(s => {
              const [on, setOn] = useState(s.defaultOn);
              return (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{s.label}</span>
                  <button onClick={() => setOn(!on)} style={{
                    width: 36, height: 20, borderRadius: 10,
                    background: on ? "var(--accent)" : "var(--border)",
                    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s"
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", background: "var(--text-bright)",
                      position: "absolute", top: 3, left: on ? 19 : 3, transition: "left 0.2s"
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>SECURITY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={LABEL}>CHANGE PASSWORD</label>
              <input type="password" placeholder="New password" style={INPUT}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={LABEL}>CONFIRM PASSWORD</label>
              <input type="password" placeholder="Confirm new password" style={INPUT}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ ...LABEL, marginBottom: 8 }}>2FA STATUS</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Two-factor authentication:</span>
              <span style={{ fontSize: 11, color: "#C9A227", fontWeight: 600 }}>DISABLED</span>
              <button style={{
                background: "#1a1600", border: "1px solid #D4AF3730", color: "var(--accent)",
                padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer"
              }}>ENABLE 2FA</button>
            </div>
          </div>
        </div>

        <button style={{
          alignSelf: "flex-end", background: "var(--accent)", color: "var(--bg-app)",
          border: "none", borderRadius: 6, padding: "10px 20px",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6
        }}>
          <Save size={13} /> SAVE SETTINGS
        </button>
      </div>
    </div>
  );
}
