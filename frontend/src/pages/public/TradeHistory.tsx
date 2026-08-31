import { useState } from "react";
import { Link } from "react-router";
import { PnlValue, RoiValue, StatusBadge, DirectionBadge, LeverageBadge, VerificationBadge } from "../../components/StatusBadge";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../lib/api";
import { mapApiTrades } from "../../lib/mapTrade";

type FilterTab = "ALL" | "WIN" | "LOSS" | "OPEN" | "STOP";
const TABS: FilterTab[] = ["ALL", "WIN", "LOSS", "OPEN", "STOP"];

export default function TradeHistory() {
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, loading, error } = useApi(() => publicApi.calls());

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading trade history…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "var(--loss)" }}>SYSTEM TEMPORARILY UNAVAILABLE — {error}</div>;

  const allTrades = mapApiTrades(data ?? []);
  if (allTrades.length === 0) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No historical trades yet.</div>;
  }

  const filtered = allTrades.filter(t => {
    if (tab === "ALL") return true;
    if (tab === "WIN") return t.pnl > 0 && (t.status === "CLOSED" || t.status === "TP1_HIT" || t.status === "TP2_HIT");
    if (tab === "LOSS") return t.pnl < 0;
    if (tab === "OPEN") return ["OPEN", "WAITING", "TP1_HIT", "TP2_HIT"].includes(t.status);
    if (tab === "STOP") return t.status === "STOP_HIT";
    return true;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.2 }}>↕</span>;
    return sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  const wins = allTrades.filter(t => t.pnl > 0 && t.status === "CLOSED").length;
  const losses = allTrades.filter(t => t.pnl < 0).length;
  const closed = allTrades.filter(t => t.status === "CLOSED" || t.status === "STOP_HIT").length;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>TRADE HISTORY</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Complete Trade Log</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "4px 0 0" }}>
          All published calls. Immutable historical record.
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "TOTAL", value: allTrades.length, color: "var(--text-primary)" },
          { label: "CLOSED", value: closed, color: "var(--text-muted)" },
          { label: "WINS", value: wins, color: "var(--profit)" },
          { label: "LOSSES", value: losses, color: "var(--loss)" },
          { label: "OPEN", value: allTrades.filter(t => ["OPEN", "TP1_HIT"].includes(t.status)).length, color: "var(--accent)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "12px 18px"
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #1a1a1a", paddingBottom: 12 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "#1a1600" : "none",
            border: tab === t ? "1px solid #D4AF3730" : "1px solid transparent",
            color: tab === t ? "var(--accent)" : "var(--text-muted)",
            padding: "5px 12px", borderRadius: 5, fontSize: 10, cursor: "pointer",
            fontWeight: tab === t ? 600 : 400, letterSpacing: "0.06em"
          }}>{t}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{
          background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 6,
          color: "var(--text-muted)", padding: "5px 10px", display: "flex", alignItems: "center",
          gap: 5, cursor: "pointer", fontSize: 10
        }}>
          <Filter size={11} /> FILTER
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {[
                  { key: "id", label: "#" },
                  { key: "createdAt", label: "DATE" },
                  { key: "asset", label: "ASSET" },
                  { key: "direction", label: "DIR" },
                  { key: "entry", label: "ENTRY" },
                  { key: "exit", label: "EXIT" },
                  { key: "tradeRoi", label: "ROI" },
                  { key: "pnl", label: "P&L" },
                  { key: "rMultiple", label: "R" },
                  { key: "leverage", label: "LVG" },
                  { key: "status", label: "STATUS" },
                  { key: "exitReason", label: "EXIT REASON" },
                  { key: "verificationStatus", label: "VERIFY" },
                  { key: "", label: "" },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => col.key && handleSort(col.key)}
                    style={{
                      padding: "10px 12px",
                      textAlign: ["tradeRoi", "pnl", "rMultiple"].includes(col.key) ? "right" : "left",
                      fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em",
                      cursor: col.key ? "pointer" : "default", whiteSpace: "nowrap"
                    }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, i) => (
                <tr key={trade.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1a1a1a" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px", fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{trade.id}</td>
                  <td style={{ padding: "10px 12px", fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {trade.createdAt.split("T")[0]}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700 }}>{trade.asset}</td>
                  <td style={{ padding: "10px 12px" }}><DirectionBadge direction={trade.direction} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.entry.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {trade.exit ? trade.exit.toLocaleString() : <span style={{ color: "var(--text-muted)" }}>OPEN</span>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <RoiValue value={trade.tradeRoi} size="sm" />
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <PnlValue value={trade.pnl} size="sm" />
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>
                    {trade.rMultiple > 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                  </td>
                  <td style={{ padding: "10px 12px" }}><LeverageBadge leverage={trade.leverage} /></td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={trade.status} /></td>
                  <td style={{ padding: "10px 12px", fontSize: 10, color: "var(--text-muted)" }}>
                    {trade.exitReason || "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {trade.verificationStatus
                      ? <VerificationBadge status={trade.verificationStatus} />
                      : <span style={{ color: "var(--text-muted)", fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Link to={`/trade/${trade.id}`} style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>VIEW →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Track record note */}
      <div style={{
        marginTop: 16, padding: "10px 14px", background: "var(--bg-secondary)",
        border: "1px solid #1a1a1a", borderRadius: 6, fontSize: 10, color: "var(--text-muted)",
        display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{ color: "var(--profit)" }}>●</span>
        <span>All published calls remain in the historical record. No trades are deleted or modified retroactively.</span>
      </div>
    </div>
  );
}
