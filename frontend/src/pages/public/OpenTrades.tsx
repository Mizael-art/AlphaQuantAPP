import { Link } from "react-router";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge } from "../../components/StatusBadge";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrades } from "../../lib/mapTrade";

export default function OpenTrades() {
  const { data, loading, error } = useApi(() => publicApi.openTrades());

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading positions…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>MARKET DATA UNAVAILABLE — {error}</div>;

  const openTrades = mapApiTrades(data ?? []);
  const unrealized = openTrades.reduce((s, t) => s + (t.unrealizedPnl || 0), 0);


  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>OPEN TRADES</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Live Positions</h1>
      </div>

      {/* Top stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>OPEN TRADES</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", fontFamily: "JetBrains Mono" }}>{openTrades.length}</div>
        </div>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>UNREALIZED P&L</div>
          <PnlValue value={unrealized} size="lg" />
        </div>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>UNREALIZED ROI</div>
          <RoiValue value={(unrealized / 10000) * 100} size="lg" />
        </div>
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>OPEN EXPOSURE</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>
            ${openTrades.reduce((s, t) => s + t.notional, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {["ASSET", "DIR", "ENTRY", "CURRENT", "STOP", "TP1", "TP2", "LVG", "MARGIN", "NOTIONAL", "ROI", "P&L", "R", "IMPACT", "STATUS", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: ["ROI", "P&L", "R", "IMPACT", ""].includes(h) ? "right" : "left",
                    fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", whiteSpace: "nowrap"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openTrades.map((trade, i) => (
                <tr key={trade.id}
                  style={{ borderBottom: i < openTrades.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 12px", fontSize: 12, fontWeight: 700 }}>{trade.asset}</td>
                  <td style={{ padding: "12px 12px" }}><DirectionBadge direction={trade.direction} /></td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.entry.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="pulse-live" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--profit)", display: "block", flexShrink: 0 }} />
                      <span style={{ color: "var(--accent)" }}>{trade.currentPrice.toLocaleString()}</span>
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--loss)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.stop.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.tp1.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.tp2 ? trade.tp2.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "12px 12px" }}><LeverageBadge leverage={trade.leverage} /></td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    ${trade.margin.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    ${trade.notional.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <RoiValue value={trade.tradeRoi} size="sm" />
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <PnlValue value={trade.pnl} size="sm" />
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>
                    +{trade.rMultiple.toFixed(2)}R
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>
                    {trade.accountImpact > 0 ? "+" : ""}{trade.accountImpact.toFixed(2)}%
                  </td>
                  <td style={{ padding: "12px 12px" }}><StatusBadge status={trade.status} /></td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <Link to={`/trade/${trade.id}`} style={{
                      fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600
                    }}>VIEW →</Link>
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
