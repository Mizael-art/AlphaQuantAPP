import { Link } from "react-router";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge } from "../../components/StatusBadge";
import { ArrowRight, Clock, Target } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrades } from "../../lib/mapTrade";

export default function LiveCalls() {
  const { data, loading, error } = useApi(() => publicApi.openTrades());

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading open calls…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>MARKET DATA UNAVAILABLE — {error}</div>;

  const openTrades = mapApiTrades(data ?? []);
  if (openTrades.length === 0) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No open trades right now.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>LIVE CALLS</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
          Open Calls
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "6px 0 0" }}>
          All currently active calls. Published timestamps are immutable.
        </p>
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "OPEN CALLS", value: openTrades.length, color: "var(--accent)" },
          { label: "TOTAL UNREALIZED", value: `+$${openTrades.reduce((s, t) => s + (t.unrealizedPnl || 0), 0).toFixed(0)}`, color: "var(--profit)" },
          { label: "LONGS", value: openTrades.filter(t => t.direction === "LONG").length, color: "var(--accent)" },
          { label: "SHORTS", value: openTrades.filter(t => t.direction === "SHORT").length, color: "var(--text-muted)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "12px 18px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Call cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {openTrades.map(trade => (
          <div key={trade.id} style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            overflow: "hidden", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#D4AF3740")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            {/* Card header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{trade.asset}</span>
                <DirectionBadge direction={trade.direction} />
                <LeverageBadge leverage={trade.leverage} />
              </div>
              <StatusBadge status={trade.status} />
            </div>

            {/* P&L row */}
            <div style={{ padding: "14px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>UNREALIZED P&L</div>
                  <PnlValue value={trade.pnl} size="lg" />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>ROI</div>
                  <RoiValue value={trade.tradeRoi} size="lg" />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>R</div>
                  <span style={{ fontSize: 14, fontFamily: "JetBrains Mono", fontWeight: 600, color: "var(--accent)" }}>
                    +{trade.rMultiple.toFixed(2)}R
                  </span>
                </div>
              </div>
            </div>

            {/* Trade levels */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "ENTRY", value: trade.entry.toLocaleString(), color: "var(--text-primary)" },
                  { label: "CURRENT", value: trade.currentPrice.toLocaleString(), color: "var(--accent)", live: true },
                  { label: "STOP", value: trade.stop.toLocaleString(), color: "var(--loss)" },
                  { label: "TP1", value: trade.tp1.toLocaleString(), color: "var(--profit)", hit: trade.tp1Hit },
                  trade.tp2 ? { label: "TP2", value: trade.tp2.toLocaleString(), color: "var(--profit)" } : null,
                  trade.tp3 ? { label: "TP3", value: trade.tp3.toLocaleString(), color: "var(--profit)" } : null,
                ].filter(Boolean).map(item => item && (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>
                      {item.label}
                      {item.hit && <span style={{ color: "var(--profit)", marginLeft: 4 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: item.color, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 3 }}>
                      {item.live && <span className="pulse-live" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--profit)", display: "block", flexShrink: 0 }} />}
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { icon: Target, label: trade.strategy },
                  { icon: Clock, label: `${trade.timeframe} · Published ${trade.createdAt.split("T")[1].substring(0, 5)}` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-muted)" }}>
                    <Icon size={11} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Margin: <span style={{ color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>${trade.margin.toLocaleString()}</span>
                &nbsp;·&nbsp;
                Notional: <span style={{ color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>${trade.notional.toLocaleString()}</span>
              </div>
              <Link to={`/trade/${trade.id}`} style={{
                fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4
              }}>
                VIEW FULL TRADE <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
