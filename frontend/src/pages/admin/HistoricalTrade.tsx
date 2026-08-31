import { useRef, useState } from "react";
import { adminApi, ApiError } from "../../lib/api";
import { parseTradeCardText } from "../../lib/parseTradeCard";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "9px 11px", color: "var(--text-bright)", fontSize: 13, fontFamily: "JetBrains Mono",
  outline: "none",
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

const today = new Date().toISOString().slice(0, 10);

export default function HistoricalTrade() {
  const [form, setForm] = useState({
    asset: "", direction: "LONG" as "LONG" | "SHORT",
    entry: "", exit: "", stop: "", tp1: "",
    resultPct: "",
    date: today, time: "12:00",
    strategy: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotUpload = async (file: File) => {
    setOcrState("reading");
    setOcrSummary(null);
    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "eng");
      const parsed = parseTradeCardText(data.text);

      setForm(f => ({
        ...f,
        asset: parsed.asset ?? f.asset,
        direction: parsed.direction ?? f.direction,
        entry: parsed.entry !== null ? String(parsed.entry) : f.entry,
        exit: parsed.exit !== null ? String(parsed.exit) : f.exit,
        resultPct: parsed.resultPct !== null ? String(parsed.resultPct) : f.resultPct,
        // "the day the screenshot was sent" = today, since that's when it's being logged.
        date: today,
      }));

      const found = [
        parsed.asset && "asset",
        parsed.direction && "direction",
        parsed.leverage !== null && "leverage",
        parsed.resultPct !== null && "ROI%",
        parsed.entry !== null && "entry",
        parsed.exit !== null && "exit",
      ].filter(Boolean);

      if (parsed.confidence === "low") {
        setOcrState("error");
        setOcrSummary("Could only read a little from this image — fill in the rest by hand, or try a clearer screenshot.");
      } else {
        setOcrState("done");
        setOcrSummary(
          `Read from screenshot: ${found.join(", ")}${parsed.leverage !== null ? ` (${parsed.leverage}x leverage — not stored, but confirms the card was read correctly)` : ""}. Please double-check before saving.`
        );
      }
    } catch {
      setOcrState("error");
      setOcrSummary("Couldn't process that image. Try a clearer screenshot or fill in the fields manually.");
    }
  };

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  // Two ways to fill this in: type the result % directly (e.g. "we made 20%"),
  // or give entry+exit prices and let the price move become the % automatically.
  // Whichever the admin touches last wins — this is a % of bankroll model, not
  // a fixed dollar amount, since every viewer trades with a different account size.
  const entryNum = parseFloat(form.entry);
  const exitNum = parseFloat(form.exit);
  const priceDerivedPct = (() => {
    if (isNaN(entryNum) || isNaN(exitNum) || entryNum === 0) return null;
    const ret = form.direction === "LONG" ? (exitNum - entryNum) / entryNum : (entryNum - exitNum) / entryNum;
    return ret * 100;
  })();
  const typedPct = form.resultPct !== "" ? parseFloat(form.resultPct) : null;
  const finalPct = typedPct !== null && !isNaN(typedPct) ? typedPct : priceDerivedPct;

  const handleResultPctChange = (v: string) => set("resultPct", v);
  // If the admin edits entry/exit after already typing a %, keep the price fields
  // authoritative for the *next* auto-calc but never silently overwrite a value
  // they typed by hand — the preview always shows finalPct, computed above.

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!form.asset || finalPct === null || isNaN(finalPct)) {
      setError("Asset and a result % (either typed directly or via entry+exit price) are required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.registerHistoricalTrade({
        asset: form.asset,
        symbol: form.asset,
        direction: form.direction,
        entry: form.entry ? parseFloat(form.entry) : undefined,
        exit: form.exit ? parseFloat(form.exit) : undefined,
        stop: form.stop ? parseFloat(form.stop) : undefined,
        tp1: form.tp1 ? parseFloat(form.tp1) : undefined,
        resultPct: finalPct,
        date: form.date,
        time: form.time,
        strategy: form.strategy || undefined,
        notes: form.notes || undefined,
        isPublic: true,
      });
      setSuccess(`Trade saved: ${form.asset} ${form.direction}, ${finalPct >= 0 ? "+" : ""}${finalPct.toFixed(2)}%.`);
      setForm(f => ({ ...f, asset: "", entry: "", exit: "", stop: "", tp1: "", resultPct: "", notes: "" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aq-page-padding" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Log a Closed Trade</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          For trades that already happened. Enter the numbers yourself — nothing is fetched from Bybit.
        </p>
      </div>

      {/* Screenshot upload — reads symbol, direction, ROI%, entry/exit price
          straight from a Bybit result card using on-device OCR (no AI API,
          no cost, nothing leaves the browser). Always double-check the
          filled-in values before saving. */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleScreenshotUpload(file);
        }}
        style={{
          background: "var(--bg-panel)", border: "1px dashed var(--border)", borderRadius: 8,
          padding: 20, marginBottom: 14, cursor: "pointer", textAlign: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleScreenshotUpload(file);
            e.target.value = "";
          }}
        />
        {ocrState === "reading" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
            <Loader2 size={16} className="pulse-live" /> Reading screenshot…
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
            <Upload size={16} />
            Upload or drop a Bybit result screenshot — asset, direction, ROI% and prices fill in automatically
          </div>
        )}
        {ocrSummary && (
          <div style={{
            marginTop: 12, textAlign: "left", display: "flex", gap: 8, alignItems: "flex-start",
            fontSize: 11, color: ocrState === "error" ? "var(--loss)" : "var(--profit)",
            background: "var(--bg-secondary)", borderRadius: 6, padding: "8px 10px",
          }}>
            {ocrState === "error" ? <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
            <span>{ocrSummary}</span>
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          background: "#161200", border: "1px solid #3a2f00", borderRadius: 6, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...LABEL_STYLE, color: "var(--accent)", marginBottom: 3 }}>RESULT (% of account)</label>
            <input
              type="text"
              value={form.resultPct}
              onChange={e => handleResultPctChange(e.target.value)}
              placeholder={priceDerivedPct !== null ? priceDerivedPct.toFixed(2) : "20"}
              style={{ ...INPUT_STYLE, border: "1px solid #D4AF3750", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 220, lineHeight: 1.4 }}>
            Type the % gained/lost directly (e.g. 20 for +20%), or fill entry+exit prices below and it fills in for you.
          </div>
        </div>

        <div className="aq-form-grid-2">
          <div>
            <label style={LABEL_STYLE}>ASSET (any Bybit pair)</label>
            <input
              type="text"
              value={form.asset}
              onChange={e => set("asset", e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="BTCUSDT"
              style={INPUT_STYLE}
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
                  cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                }}>{d}</button>
              ))}
            </div>
          </div>
          <Field label="ENTRY PRICE (optional)" value={form.entry} onChange={v => set("entry", v)} placeholder="104200" />
          <Field label="EXIT PRICE (optional)" value={form.exit} onChange={v => set("exit", v)} placeholder="106500" />
          <Field label="STOP LOSS (optional)" value={form.stop} onChange={v => set("stop", v)} placeholder="102800" />
          <Field label="TP1 (optional)" value={form.tp1} onChange={v => set("tp1", v)} placeholder="106000" />
          <Field label="DATE" type="date" value={form.date} onChange={v => set("date", v)} />
          <Field label="TIME" type="time" value={form.time} onChange={v => set("time", v)} />
          <Field label="STRATEGY (optional)" value={form.strategy} onChange={v => set("strategy", v)} placeholder="Trend Continuation" />
        </div>

        <div>
          <label style={LABEL_STYLE}>NOTES (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            rows={3}
            style={{ ...INPUT_STYLE, resize: "vertical" as const, fontFamily: "Inter" }}
          />
        </div>

        {finalPct !== null && !isNaN(finalPct) && (
          <div style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px",
            display: "flex", justifyContent: "space-between", fontSize: 12,
          }}>
            <span style={{ color: "var(--text-muted)" }}>Will be saved as</span>
            <span style={{ fontWeight: 700, color: finalPct >= 0 ? "var(--profit)" : "var(--loss)" }}>
              {finalPct >= 0 ? "+" : ""}{finalPct.toFixed(2)}%
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: "#2a0d0d", border: "1px solid #5c1f1f", color: "var(--loss)", borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#0d1f14", border: "1px solid #1f5c33", color: "var(--profit)", borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: "var(--accent)", color: "var(--bg-app)", padding: "11px 0", borderRadius: 6,
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", border: "none",
            cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "SAVING…" : "SAVE CLOSED TRADE"}
        </button>
      </div>
    </div>
  );
}
