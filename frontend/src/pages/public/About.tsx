import { AlertCircle } from "lucide-react";

export default function About() {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>ABOUT</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
          About AlphaQuant <span style={{ color: "var(--accent)" }}>X</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, maxWidth: 600 }}>
          Quantitative Trading Intelligence
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "ANALYZE", desc: "Statistical evaluation of trade setups, strategies and market conditions with quantitative rigor." },
          { label: "VALIDATE", desc: "Historical verification of published calls against market data. Every result is traceable." },
          { label: "TRACK", desc: "Real-time monitoring of open positions. All states and price levels are continuously tracked." },
          { label: "MEASURE", desc: "Performance analytics across time periods, assets, strategies and timeframes." },
          { label: "LEARN", desc: "Systematic review of outcomes to improve consistency and risk-adjusted returns." },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px" }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>MISSION</div>
        <blockquote style={{ margin: 0, borderLeft: "2px solid var(--accent)", paddingLeft: 16 }}>
          <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, margin: 0 }}>
            "AlphaQuant is designed to prioritize data, risk management, execution quality and statistical evidence.
            The platform does not attempt to predict the future or promise returns. It measures what has happened,
            tracks what is happening, and maintains a complete and unalterable record."
          </p>
        </blockquote>
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>CORE PRINCIPLES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "TRANSPARENCY", desc: "Every call is public from the moment it is published. Nothing is hidden or removed." },
            { label: "DATA", desc: "Decisions and analysis are based on statistical evidence, not opinion." },
            { label: "AUDITABILITY", desc: "All results can be traced back to the original call with full timestamp history." },
            { label: "RISK", desc: "Risk management is treated as the primary constraint, not an afterthought." },
            { label: "CONSISTENCY", desc: "Process is measured over a statistically significant sample of trades, not individual results." },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--bg-secondary)" }}>
              <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.08em", minWidth: 100 }}>{p.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>WHAT THIS IS NOT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "A live trading account or brokerage",
            "A signal service with execution",
            "A guarantee of future results",
            "Financial advice or investment recommendation",
          ].map(item => (
            <div key={item} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--loss)", fontSize: 12 }}>✗</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 16px", background: "var(--bg-secondary)", border: "1px solid #1a1a1a", borderRadius: 6, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <AlertCircle size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Historical results do not guarantee future performance. Paper trading and historical simulations are not live trading.
          Risk management is essential. This platform tracks simulation results for analysis and educational purposes.
        </div>
      </div>
    </div>
  );
}
