import { useState } from "react";
import { useNavigate } from "react-router";
import { DirectionBadge, LeverageBadge, StatusBadge } from "../../components/StatusBadge";
import { Save, Send, Eye } from "lucide-react";
import { adminApi } from "../../lib/api";
import { ApiError } from "../../lib/api";

const INPUT_STYLE = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: 6, color: "var(--text-bright)", fontSize: 12,
  outline: "none", fontFamily: "JetBrains Mono",
  fontVariantNumeric: "tabular-nums",
  boxSizing: "border-box" as const
};

const LABEL_STYLE = { fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block" as const, marginBottom: 5 };

function Field({
  label, value, onChange, type = "text", placeholder = "",
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={INPUT_STYLE}
        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

export default function PublishCall() {
  const [form, setForm] = useState({
    asset: "BTCUSDT", direction: "LONG" as "LONG" | "SHORT",
    entry: "", stop: "", tp1: "", tp2: "", tp3: "", tp4: "",
    leverage: "10", margin: "1000", risk: "1",
    timeframe: "1H", strategy: "Trend Continuation", playbook: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().substring(0, 5),
    notes: ""
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const notional = parseFloat(form.margin || "0") * parseFloat(form.leverage || "1");
  const riskPct = parseFloat(form.risk || "0");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tpCount, setTpCount] = useState(1); // TP1 is always required; TP2-4 are opt-in via "+ Add TP"

  const buildPayload = () => ({
    asset: form.asset,
    symbol: form.asset,
    direction: form.direction,
    entryPrice: parseFloat(form.entry),
    stopPrice: parseFloat(form.stop),
    tp1: parseFloat(form.tp1),
    tp2: form.tp2 ? parseFloat(form.tp2) : undefined,
    tp3: form.tp3 ? parseFloat(form.tp3) : undefined,
    tp4: form.tp4 ? parseFloat(form.tp4) : undefined,
    margin: parseFloat(form.margin),
    leverage: parseFloat(form.leverage),
    riskPct: riskPct || undefined,
    timeframe: form.timeframe,
    strategyName: form.strategy,
    playbook: form.playbook || undefined,
    notes: form.notes || undefined,
  });

  const submit = async (publish: boolean) => {
    if (!form.entry || !form.stop || !form.tp1) {
      setSubmitError("Entry, stop and TP1 are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.createCall({ ...buildPayload(), publish });
      navigate("/admin/open-trades");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="aq-page-padding" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Publish New Call</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>TRADE SETUP</div>
            <div className="aq-form-grid-2">
              <div>
                <label style={LABEL_STYLE}>ASSET (any Bybit pair)</label>
                <input
                  type="text"
                  value={form.asset}
                  onChange={e => set("asset", e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="BTCUSDT"
                  style={{ ...INPUT_STYLE, fontFamily: "Inter", textTransform: "uppercase" as const }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>DIRECTION</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["LONG", "SHORT"] as const).map(d => (
                    <button key={d} onClick={() => set("direction", d)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 6,
                      background: form.direction === d ? (d === "LONG" ? "#1a1600" : "var(--bg-card)") : "var(--bg-secondary)",
                      border: form.direction === d ? `1px solid ${d === "LONG" ? "#D4AF3750" : "#42424250"}` : "1px solid var(--border)",
                      color: form.direction === d ? (d === "LONG" ? "var(--accent)" : "var(--text-muted)") : "var(--text-muted)",
                      cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em"
                    }}>{d}</button>
                  ))}
                </div>
              </div>
              <Field label="ENTRY PRICE" value={form.entry} onChange={v => set("entry", v)} placeholder="104200" />
              <Field label="STOP LOSS" value={form.stop} onChange={v => set("stop", v)} placeholder="102800" />
              <Field label="TP1" value={form.tp1} onChange={v => set("tp1", v)} placeholder="106000" />
              {tpCount >= 2 && <Field label="TP2" value={form.tp2} onChange={v => set("tp2", v)} placeholder="107500" />}
              {tpCount >= 3 && <Field label="TP3" value={form.tp3} onChange={v => set("tp3", v)} placeholder="110000" />}
              {tpCount >= 4 && <Field label="TP4" value={form.tp4} onChange={v => set("tp4", v)} placeholder="112000" />}
            </div>
            {tpCount < 4 && (
              <button
                onClick={() => setTpCount(c => Math.min(4, c + 1))}
                style={{
                  marginTop: 10, background: "none", border: "1px dashed #3a3a3a", color: "var(--text-muted)",
                  borderRadius: 6, padding: "7px 12px", fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.04em", cursor: "pointer",
                }}
              >
                + ADD TP{tpCount + 1}
              </button>
            )}
          </div>

          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>POSITION</div>
            <div className="aq-form-grid-3">
              <Field label="LEVERAGE" value={form.leverage} onChange={v => set("leverage", v)} placeholder="10" />
              <Field label="MARGIN ($)" value={form.margin} onChange={v => set("margin", v)} placeholder="1000" />
              <Field label="RISK (%)" value={form.risk} onChange={v => set("risk", v)} placeholder="1" />
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Notional: <span style={{ color: "var(--accent)", fontFamily: "JetBrains Mono" }}>${notional.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Account Risk: <span style={{ color: "#C9A227", fontFamily: "JetBrains Mono" }}>{riskPct}%</span>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>ANALYSIS</div>
            <div className="aq-form-grid-2">
              <div>
                <label style={LABEL_STYLE}>TIMEFRAME</label>
                <select value={form.timeframe} onChange={e => set("timeframe", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                  {["15M", "1H", "4H", "1D"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>STRATEGY</label>
                <select value={form.strategy} onChange={e => set("strategy", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                  {["Trend Continuation", "Support Bounce", "Resistance Rejection", "Breakout Retest", "Reversal", "Accumulation Zone"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Field label="PLAYBOOK / SETUP NAME" value={form.playbook} onChange={v => set("playbook", v)} placeholder="Optional" />
              <div>
                <label style={LABEL_STYLE}>DATE</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ ...INPUT_STYLE }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>TIME</label>
                <input type="time" value={form.time} onChange={e => set("time", e.target.value)} style={{ ...INPUT_STYLE }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={LABEL_STYLE}>NOTES</label>
              <textarea
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Trade rationale, context, key levels..."
                rows={4}
                style={{ ...INPUT_STYLE, fontFamily: "Inter", resize: "vertical" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* Actions */}
          {submitError && (
            <div style={{
              padding: "10px 14px", background: "#1a0000", border: "1px solid #EF535030",
              borderRadius: 6, fontSize: 11, color: "var(--loss)"
            }}>
              {submitError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={submitting}
              onClick={() => submit(false)}
              style={{
                flex: 1, padding: "11px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderRadius: 6,
                color: "var(--text-muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
              <Save size={13} /> SAVE DRAFT
            </button>
            <button
              disabled={submitting}
              onClick={() => submit(true)}
              style={{
                flex: 2, padding: "11px", background: "var(--accent)",
                border: "none", borderRadius: 6,
                color: "var(--bg-app)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
              <Send size={13} /> {submitting ? "PUBLISHING..." : "PUBLISH CALL"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ position: "sticky", top: 16 }}>
          <div style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            overflow: "hidden"
          }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>CALL PREVIEW</span>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{form.asset || "ASSET"}</span>
                <DirectionBadge direction={form.direction} />
                <LeverageBadge leverage={parseInt(form.leverage) || 0} />
                <StatusBadge status="PUBLISHED" />
              </div>
              {[
                { label: "ENTRY", value: form.entry || "—", color: "var(--text-primary)" },
                { label: "STOP", value: form.stop || "—", color: "var(--loss)" },
                { label: "TP1", value: form.tp1 || "—", color: "var(--profit)" },
                { label: "TP2", value: form.tp2 || "—", color: "var(--profit)" },
                { label: "TP3", value: form.tp3 || "—", color: "var(--profit)" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "JetBrains Mono", color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10, marginTop: 4 }}>
                {[
                  { label: "Leverage", value: `${form.leverage || "—"}x` },
                  { label: "Margin", value: form.margin ? `$${form.margin}` : "—" },
                  { label: "Notional", value: notional > 0 ? `$${notional.toLocaleString()}` : "—" },
                  { label: "Strategy", value: form.strategy },
                  { label: "Timeframe", value: form.timeframe },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
