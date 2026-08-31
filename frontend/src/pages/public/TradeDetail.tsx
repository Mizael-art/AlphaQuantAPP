import { useParams, Link } from "react-router";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge, VerificationBadge } from "../../components/StatusBadge";
import { ArrowLeft, CheckCircle, Circle, AlertTriangle } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrade } from "../../lib/mapTrade";

const timelineColors: Record<string, string> = {
  published: "var(--accent)",
  entry: "var(--text-primary)",
  tp1: "var(--profit)",
  tp2: "var(--profit)",
  tp3: "var(--profit)",
  stop: "var(--loss)",
  closed: "var(--text-muted)",
  update: "#C9A227",
};

export default function TradeDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApi(() => publicApi.trade(id as string), [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading trade…</div>;

  const trade = data ? mapApiTrade(data) : undefined;

  if (error || !trade) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>Trade not found</div>
        <Link to="/history" style={{ color: "var(--accent)", textDecoration: "none" }}>← Back to History</Link>
      </div>
    );
  }

  const isOpen = ["OPEN", "WAITING", "TP1_HIT", "TP2_HIT"].includes(trade.status);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Back */}
      <Link to="/history" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20
      }}>
        <ArrowLeft size={12} /> Back to History
      </Link>

      {/* Header */}
      <div style={{
        background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
        padding: "20px 24px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{trade.asset}</h1>
            <DirectionBadge direction={trade.direction} />
            <LeverageBadge leverage={trade.leverage} />
            <StatusBadge status={trade.status} size="md" />
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>#{trade.id}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Strategy: {trade.strategy}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Timeframe: {trade.timeframe}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{isOpen ? "UNREALIZED P&L" : "REALIZED P&L"}</div>
          <PnlValue value={trade.pnl} size="xl" />
          <div style={{ marginTop: 4 }}>
            <RoiValue value={trade.tradeRoi} size="lg" />
            <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "JetBrains Mono", marginLeft: 10 }}>
              {trade.rMultiple > 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div>
          {/* Trade Plan */}
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>TRADE PLAN</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 14 }}>
              {[
                { label: "ENTRY", value: trade.entry.toLocaleString(), color: "var(--text-primary)" },
                { label: "STOP", value: trade.stop.toLocaleString(), color: "var(--loss)" },
                { label: "TP1", value: trade.tp1.toLocaleString(), color: "var(--profit)", hit: trade.tp1Hit },
                trade.tp2 && { label: "TP2", value: trade.tp2.toLocaleString(), color: "var(--profit)", hit: trade.tp2Hit },
                trade.tp3 && { label: "TP3", value: trade.tp3.toLocaleString(), color: "var(--profit)" },
                trade.exit && { label: "EXIT", value: trade.exit.toLocaleString(), color: "var(--text-primary)" },
              ].filter(Boolean).map(item => item && (
                <div key={item.label} style={{
                  padding: "12px", background: "var(--bg-secondary)",
                  borderRadius: 6, border: "1px solid #1a1a1a"
                }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    {item.label}
                    {item.hit && <span style={{ color: "var(--profit)", fontSize: 9 }}>✓ HIT</span>}
                  </div>
                  <div style={{ fontSize: 14, fontFamily: "JetBrains Mono", color: item.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Position Details */}
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>POSITION</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "MARGIN", value: `$${trade.margin.toLocaleString()}` },
                { label: "LEVERAGE", value: `${trade.leverage}x` },
                { label: "NOTIONAL", value: `$${trade.notional.toLocaleString()}` },
                { label: "ACCOUNT IMPACT", value: `${trade.accountImpact > 0 ? "+" : ""}${trade.accountImpact.toFixed(2)}%` },
                { label: "PRICE CHANGE", value: `${trade.priceChangePct > 0 ? "+" : ""}${trade.priceChangePct.toFixed(2)}%` },
                { label: "TRADE ROI", value: `${trade.tradeRoi > 0 ? "+" : ""}${trade.tradeRoi.toFixed(2)}%` },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontSize: 13, fontFamily: "JetBrains Mono", color: "var(--text-primary)", fontWeight: 600 }}>{row.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 12, padding: "8px 10px", background: "var(--bg-secondary)",
              borderRadius: 5, fontSize: 9, color: "var(--text-muted)"
            }}>
              Trade ROI is calculated against margin used. Account Impact is calculated against account equity.
            </div>
          </div>

          {/* Market at time */}
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>MARKET</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>CURRENT PRICE</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {isOpen && <span className="pulse-live" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--profit)", display: "block" }} />}
                  <span style={{ fontSize: 14, fontFamily: "JetBrains Mono", color: "var(--accent)", fontWeight: 600 }}>
                    {trade.currentPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>TIMEFRAME</div>
                <div style={{ fontSize: 14, fontFamily: "JetBrains Mono", color: "var(--text-primary)", fontWeight: 600 }}>{trade.timeframe}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>STRATEGY</div>
                <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{trade.strategy}</div>
              </div>
            </div>
          </div>

          {/* Verification */}
          {trade.verificationStatus && (
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>VERIFICATION</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
                <VerificationBadge status={trade.verificationStatus} />
                {trade.verificationStatus === "AMBIGUOUS" && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— Intrabar order cannot be determined with certainty</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Historical price data found", ok: true },
                  { label: "Entry timestamp validated", ok: true },
                  { label: "Exit condition evaluated", ok: trade.verificationStatus !== "INSUFFICIENT_DATA" },
                  { label: "Result calculated", ok: trade.verificationStatus === "VERIFIED" || trade.verificationStatus === "PARTIALLY_VERIFIED" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    {row.ok
                      ? <CheckCircle size={13} style={{ color: "var(--profit)" }} />
                      : <Circle size={13} style={{ color: "var(--text-muted)" }} />
                    }
                    <span style={{ color: row.ok ? "var(--text-primary)" : "var(--text-muted)" }}>{row.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 9, color: "var(--text-muted)" }}>
                Historical result calculated using historical market data.
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 18 }}>TRADE TIMELINE</div>
            <div style={{ position: "relative" }}>
              {trade.timeline.map((event, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20, position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: timelineColors[event.type] || "var(--text-muted)",
                      border: `2px solid ${timelineColors[event.type] || "var(--text-muted)"}30`,
                      marginTop: 2,
                    }} />
                    {i < trade.timeline.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 24, background: "var(--border)", margin: "4px 0" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginBottom: 3 }}>
                      {event.timestamp}
                    </div>
                    <div style={{ fontSize: 11, color: timelineColors[event.type] || "var(--text-primary)", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {event.label}
                    </div>
                  </div>
                </div>
              ))}
              {isOpen && (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: "var(--accent)", border: "2px solid #D4AF3730"
                  }} className="pulse-live" />
                  <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>TRADE ACTIVE</span>
                </div>
              )}
            </div>

            {trade.exitReason && (
              <div style={{ marginTop: 16, padding: "10px", background: "var(--bg-secondary)", borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>EXIT REASON</div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{trade.exitReason}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
