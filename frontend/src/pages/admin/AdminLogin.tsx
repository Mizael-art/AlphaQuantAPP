import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { adminApi } from "../../lib/api";
import { ApiError } from "../../lib/api";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await adminApi.login(user, pass);
      // Session cookie is httpOnly (set by the backend); we also keep the
      // token in memory-safe sessionStorage as a fallback for API clients
      // that can't rely on cross-origin cookies during local dev.
      sessionStorage.setItem("aq_admin_token", token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid credentials." : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-app)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, background: "linear-gradient(135deg, var(--accent), #9B7A18)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "var(--bg-app)", margin: "0 auto 16px"
          }}>AQ</div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>
            ALPHAQUANT <span style={{ color: "var(--accent)" }}>X</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--loss)", fontWeight: 600, letterSpacing: "0.15em" }}>
            ADMIN TERMINAL
          </div>
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "28px 28px 24px" }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                marginBottom: 16, padding: "8px 10px", background: "#1a0000",
                border: "1px solid #EF535030", borderRadius: 5, fontSize: 11, color: "var(--loss)"
              }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="admin@alphaquant.local"
                type="email"
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  borderRadius: 6, color: "var(--text-bright)", fontSize: 13,
                  outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 40px 10px 12px",
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: 6, color: "var(--text-bright)", fontSize: 13,
                    outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button type="button" onClick={() => setShow(!show)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2
                }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                2FA CODE (OPTIONAL)
              </label>
              <input
                placeholder="000000"
                maxLength={6}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  borderRadius: 6, color: "var(--text-bright)", fontSize: 13,
                  outline: "none", fontFamily: "JetBrains Mono",
                  letterSpacing: "0.2em", boxSizing: "border-box"
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="remember" style={{ accentColor: "var(--accent)" }} />
              <label htmlFor="remember" style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>
                Remember session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading ? "#9B7A18" : "var(--accent)",
                color: "var(--bg-app)", border: "none", borderRadius: 6,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
            >
              <Lock size={13} />
              {loading ? "AUTHENTICATING..." : "LOGIN"}
            </button>
          </form>

          <div style={{ marginTop: 16, padding: "8px 10px", background: "var(--bg-secondary)", borderRadius: 5, fontSize: 9, color: "var(--text-muted)", textAlign: "center" }}>
            Restricted access. Unauthorized attempts are logged.
          </div>
        </div>
      </div>
    </div>
  );
}
