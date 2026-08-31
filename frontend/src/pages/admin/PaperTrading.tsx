import { useState } from "react";
import { DirectionBadge, LeverageBadge, PnlValue, RoiValue } from "../../components/StatusBadge";
import { Beaker, Plus, X } from "lucide-react";

interface PaperPosition {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: number;
  current: number;
  margin: number;
  leverage: number;
  stop: number;
  tp: number;
  openedAt: string;
}

const mockPositions: PaperPosition[] = [
  { id: "P001", asset: "BTCUSDT", direction: "LONG", entry: 104200, current: 105180, margin: 500, leverage: 10, stop: 102800, tp: 106000, openedAt: "14:35" },
  { id: "P002", asset: "ETHUSDT", direction: "SHORT", entry: 3500, current: 3485, margin: 300, leverage: 5, stop: 3560, tp: 3420, openedAt: "12:10" },
];

const INPUT_STYLE = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: 6, color: "var(--text-bright)", fontSize: 12,
  outline: "none", fontFamily: "JetBrains Mono",
  boxSizing: "border-box" as const
};

export default function PaperTrading() {
  const [positions, setPositions] = useState<PaperPosition[]>(mockPositions);
  const [form, setForm] = useState({
    asset: "BTCUSDT", direction: "LONG" as "LONG" | "SHORT",
    orderType: "MARKET", entry: "", margin: "500", leverage: "10", stop: "", tp: ""
  });
  const [tab, setTab] = useState<"positions" | "orders" | "history">("positions");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const notional = parseFloat(form.margin || "0") * parseFloat(form.leverage || "1");

  const calcPnl = (pos: PaperPosition) => {
    const priceDiff = pos.direction === "LONG"
      ? pos.current - pos.entry
      : pos.entry - pos.current;
    return (priceDiff / pos.entry) * (pos.margin * pos.leverage);
  };

  const totalBalance = 10000;
  const usedMargin = positions.reduce((s, p) => s + p.margin, 0);
  const openPnl = positions.reduce((s, p) => {
    const notional = p.margin * p.leverage;
    const priceDiff = p.direction === "LONG" ? p.current - p.entry : p.entry - p.current;
    return s + (priceDiff / p.entry) * notional;
  }, 0);
  const equity = totalBalance + openPnl;

  const closePosition = (id: string) => {
    setPositions(ps => ps.filter(p => p.id !== id));
  };

  const LABEL = { fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", display: "block" as const, marginBottom: 5 };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Beaker size={16} style={{ color: "var(--accent)" }} />
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 4 }}>ADMIN</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Paper Trading</h1>
        </div>
        <div style={{
          marginLeft: 12, padding: "4px 10px", background: "#1a1400",
          border: "1px solid #D4AF3730", borderRadius: 4,
          fontSize: 9, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em"
        }}>SIMULATION — NO REAL FUNDS</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left: account + positions */}
        <div>
          {/* Account overview */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "BALANCE", value: `$${totalBalance.toLocaleString()}`, color: "var(--text-primary)" },
              { label: "EQUITY", value: `$${equity.toFixed(2)}`, color: openPnl >= 0 ? "var(--profit)" : "var(--loss)" },
              { label: "USED MARGIN", value: `$${usedMargin.toLocaleString()}`, color: "#C9A227" },
              { label: "OPEN P&L", value: `${openPnl >= 0 ? "+" : ""}$${openPnl.toFixed(2)}`, color: openPnl >= 0 ? "var(--profit)" : "var(--loss)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid var(--border)" }}>
            {(["positions", "orders", "history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--accent)" : "var(--text-muted)",
                padding: "8px 16px", fontSize: 11, fontWeight: tab === t ? 600 : 400,
                cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase"
              }}>{t}</button>
            ))}
          </div>

          {tab === "positions" && (
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              {positions.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Beaker size={24} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <div style={{ fontSize: 12 }}>No open paper positions</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Use the order panel to open a simulated trade</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1a1a1a", background: "var(--bg-secondary)" }}>
                        {["ASSET", "DIR", "ENTRY", "CURRENT", "MARGIN", "LVG", "STOP", "TP", "ROI", "P&L", ""].map(h => (
                          <th key={h} style={{ padding: "9px 12px", textAlign: ["ROI", "P&L"].includes(h) ? "right" : "left", fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, i) => {
                        const notional = pos.margin * pos.leverage;
                        const priceDiff = pos.direction === "LONG" ? pos.current - pos.entry : pos.entry - pos.current;
                        const pnl = (priceDiff / pos.entry) * notional;
                        const roi = (priceDiff / pos.entry) * pos.leverage * 100;
                        return (
                          <tr key={pos.id}
                            style={{ borderBottom: i < positions.length - 1 ? "1px solid #1a1a1a" : "none" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700 }}>{pos.asset}</td>
                            <td style={{ padding: "10px 12px" }}><DirectionBadge direction={pos.direction} /></td>
                            <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>{pos.entry.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent)" }}>{pos.current.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-primary)" }}>${pos.margin}</td>
                            <td style={{ padding: "10px 12px" }}><LeverageBadge leverage={pos.leverage} /></td>
                            <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--loss)" }}>{pos.stop.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--profit)" }}>{pos.tp.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}><RoiValue value={roi} size="sm" /></td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}><PnlValue value={pnl} size="sm" /></td>
                            <td style={{ padding: "10px 12px" }}>
                              <button onClick={() => closePosition(pos.id)} style={{
                                background: "#1a0000", border: "1px solid #EF535030",
                                color: "var(--loss)", padding: "4px 8px", borderRadius: 4,
                                fontSize: 10, cursor: "pointer", fontWeight: 600
                              }}>CLOSE</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab !== "positions" && (
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 12 }}>No {tab}</div>
            </div>
          )}
        </div>

        {/* Order panel */}
        <div style={{ position: "sticky", top: 16 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>ORDER PANEL</div>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL}>ASSET</label>
                <select value={form.asset} onChange={e => set("asset", e.target.value)} style={{ ...INPUT_STYLE, fontFamily: "Inter" }}>
                  {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              {/* Direction */}
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL}>DIRECTION</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["LONG", "SHORT"] as const).map(d => (
                    <button key={d} onClick={() => set("direction", d)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 5,
                      background: form.direction === d ? (d === "LONG" ? "#001a18" : "#1a0000") : "var(--bg-secondary)",
                      border: form.direction === d
                        ? `1px solid ${d === "LONG" ? "#26A69A40" : "#EF535040"}`
                        : "1px solid var(--border)",
                      color: form.direction === d ? (d === "LONG" ? "var(--profit)" : "var(--loss)") : "var(--text-muted)",
                      cursor: "pointer", fontSize: 11, fontWeight: 700
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Order type */}
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL}>ORDER TYPE</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {["MARKET", "LIMIT", "STOP"].map(t => (
                    <button key={t} onClick={() => set("orderType", t)} style={{
                      flex: 1, padding: "6px 0", borderRadius: 4,
                      background: form.orderType === t ? "#1a1600" : "var(--bg-secondary)",
                      border: form.orderType === t ? "1px solid #D4AF3730" : "1px solid var(--border)",
                      color: form.orderType === t ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em"
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {form.orderType !== "MARKET" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={LABEL}>ENTRY PRICE</label>
                  <input value={form.entry} onChange={e => set("entry", e.target.value)} placeholder="104200" style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>MARGIN ($)</label>
                  <input value={form.margin} onChange={e => set("margin", e.target.value)} style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label style={LABEL}>LEVERAGE</label>
                  <input value={form.leverage} onChange={e => set("leverage", e.target.value)} style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label style={LABEL}>STOP LOSS</label>
                  <input value={form.stop} onChange={e => set("stop", e.target.value)} placeholder="SL price" style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = "#EF535060")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label style={LABEL}>TAKE PROFIT</label>
                  <input value={form.tp} onChange={e => set("tp", e.target.value)} placeholder="TP price" style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = "#26A69A60")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                </div>
              </div>

              {notional > 0 && (
                <div style={{ marginBottom: 12, padding: "10px", background: "var(--bg-secondary)", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Notional</span>
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-primary)" }}>${notional.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Available</span>
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-primary)" }}>${(totalBalance - usedMargin).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button onClick={() => {}} style={{
                width: "100%", padding: "11px",
                background: form.direction === "LONG" ? "#001a18" : "#1a0000",
                border: `1px solid ${form.direction === "LONG" ? "#26A69A40" : "#EF535040"}`,
                borderRadius: 6, color: form.direction === "LONG" ? "var(--profit)" : "var(--loss)",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                cursor: "pointer"
              }}>
                OPEN {form.direction} (PAPER)
              </button>

              <div style={{ marginTop: 10, fontSize: 9, color: "var(--text-muted)", textAlign: "center" }}>
                Simulated trade. No real funds involved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
