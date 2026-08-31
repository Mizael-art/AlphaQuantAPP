import { useEffect, useState } from "react";
import { publicApi } from "../../lib/api";
import { PnlValue, RoiValue } from "../../components/StatusBadge";

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth < 820);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function ReportBlock({ title, period, pnl, roi, trades, wins, losses, realized, unrealized, openCount, closed, mobile }: any) {
  const winRate = trades > 0 ? (wins / trades) * 100 : 0;
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.12em", marginBottom: 4 }}>ALPHAQUANT {period} REPORT</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{title}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>P&L</div>
          <PnlValue value={pnl} size={mobile ? "lg" : "xl"} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>ROI</div>
          <RoiValue value={roi} size={mobile ? "lg" : "xl"} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: "TRADES", value: trades },
          { label: "WINS", value: wins, color: "var(--profit)" },
          { label: "LOSSES", value: losses, color: "var(--loss)" },
          { label: "WIN RATE", value: `${winRate.toFixed(1)}%`, color: winRate > 60 ? "var(--profit)" : "var(--text-muted)" },
          { label: "REALIZED", value: `$${realized.toLocaleString()}` },
          { label: "UNREALIZED", value: `$${unrealized.toLocaleString()}` },
          { label: "OPEN", value: openCount },
          { label: "CLOSED", value: closed },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono", color: s.color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  const [overview, setOverview] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([publicApi.overview(), publicApi.calls()])
      .then(([ov, c]) => {
        if (cancelled) return;
        setOverview(ov);
        setCalls(c);
        setError(null);
      })
      .catch(() => !cancelled && setError("Could not load reports."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 13 }}>Loading reports…</div>;
  if (error || !overview) return <div style={{ padding: 24, color: "var(--loss)", fontSize: 13 }}>{error ?? "No data available."}</div>;

  const unrealizedPnlUsd = overview.unrealizedPnlUsd ?? 0;
  const openCount = (overview.openTrades ?? []).length;

  const closedCalls = calls.filter(c => c.status === "CLOSED");
  const verified = closedCalls.filter(c => c.verificationStatus === "VERIFIED").length;
  const partial = closedCalls.filter(c => c.verificationStatus === "PARTIALLY_VERIFIED").length;
  const ambiguous = closedCalls.filter(c => c.verificationStatus === "AMBIGUOUS").length;
  const missingData = closedCalls.filter(c => c.verificationStatus === "INSUFFICIENT_DATA").length;
  const verifiable = verified + partial + ambiguous + missingData;
  const verifyRate = verifiable > 0 ? (verified / verifiable) * 100 : 0;

  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ padding: mobile ? 14 : 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: 6 }}>REPORTS</div>
        <h1 style={{ fontSize: mobile ? 18 : 22, fontWeight: 700, margin: 0 }}>Performance Reports</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "4px 0 0" }}>
          Periodic summaries. Aggregated data from the live track record.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
        <ReportBlock
          mobile={mobile} title={todayStr} period="DAILY"
          pnl={overview.today.pnlUsd} roi={overview.today.roiPct} trades={overview.today.trades}
          wins={overview.today.wins} losses={overview.today.losses}
          realized={overview.today.pnlUsd} unrealized={unrealizedPnlUsd}
          openCount={openCount} closed={overview.today.trades - openCount > 0 ? overview.today.trades - openCount : overview.today.trades}
        />
        <ReportBlock
          mobile={mobile} title="Last 7 days" period="WEEKLY"
          pnl={overview.week.pnlUsd} roi={overview.week.roiPct} trades={overview.week.trades}
          wins={overview.week.wins} losses={overview.week.losses}
          realized={overview.week.pnlUsd} unrealized={unrealizedPnlUsd}
          openCount={openCount} closed={overview.week.trades}
        />
        <ReportBlock
          mobile={mobile} title="Last 30 days" period="MONTHLY"
          pnl={overview.month.pnlUsd} roi={overview.month.roiPct} trades={overview.month.trades}
          wins={overview.month.wins} losses={overview.month.losses}
          realized={overview.month.pnlUsd} unrealized={unrealizedPnlUsd}
          openCount={openCount} closed={overview.month.trades}
        />
        <ReportBlock
          mobile={mobile} title="Project to date" period="PROJECT"
          pnl={overview.allTime.pnlUsd} roi={overview.allTime.roiPct} trades={overview.allTime.trades}
          wins={overview.allTime.wins} losses={overview.allTime.losses}
          realized={overview.allTime.realizedPnlUsd} unrealized={unrealizedPnlUsd}
          openCount={openCount} closed={overview.allTime.trades - openCount}
        />
      </div>

      <div style={{ marginTop: 20, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, padding: mobile ? 14 : 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>TRACK RECORD</div>
        <div style={{ display: "flex", gap: mobile ? 10 : 20, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: "CALLS PUBLISHED", value: calls.length, color: "var(--text-primary)" },
            { label: "CLOSED TRADES", value: closedCalls.length, color: "var(--text-primary)" },
            { label: "OPEN TRADES", value: openCount, color: "var(--accent)" },
            { label: "VERIFIED", value: verified, color: "var(--profit)" },
            { label: "PARTIAL", value: partial, color: "#C9A227" },
            { label: "AMBIGUOUS", value: ambiguous, color: "var(--text-muted)" },
            { label: "MISSING DATA", value: missingData, color: "var(--loss)" },
            { label: "VERIFY RATE", value: `${verifyRate.toFixed(1)}%`, color: "var(--profit)" },
          ].map(s => (
            <div key={s.label} style={{ padding: mobile ? "8px 12px" : "10px 16px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: mobile ? 14 : 16, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#001a18", border: "1px solid #26A69A20", borderRadius: 6, flexWrap: "wrap" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--profit)", display: "block" }} className="pulse-live" />
          <span style={{ fontSize: 10, color: "var(--profit)", fontWeight: 600, letterSpacing: "0.06em" }}>LIVE TRACKING</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: mobile ? 0 : 8 }}>All published calls remain in the historical record.</span>
        </div>
      </div>
    </div>
  );
}
