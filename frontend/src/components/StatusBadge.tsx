import type { TradeStatus, Direction, VerificationStatus } from "../data/mockData";

interface StatusBadgeProps {
  status: TradeStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const cfg: Record<TradeStatus, { label: string; color: string; bg: string }> = {
    DRAFT: { label: "DRAFT", color: "var(--text-muted)", bg: "#1a1a1a" },
    PUBLISHED: { label: "PUBLISHED", color: "var(--accent)", bg: "#1a1600" },
    WAITING: { label: "WAITING", color: "#C9A227", bg: "#1a1400" },
    WAITING_ENTRY: { label: "WAITING ENTRY", color: "#C9A227", bg: "#1a1400" },
    OPEN: { label: "OPEN", color: "var(--profit)", bg: "#001a18" },
    TP1_HIT: { label: "TP1 HIT", color: "var(--profit)", bg: "#001a18" },
    TP2_HIT: { label: "TP2 HIT", color: "var(--profit)", bg: "#001a18" },
    TP3_HIT: { label: "TP3 HIT", color: "var(--profit)", bg: "#001a18" },
    TP4_HIT: { label: "TP4 HIT", color: "var(--profit)", bg: "#001a18" },
    STOP_HIT: { label: "STOP HIT", color: "var(--loss)", bg: "#1a0000" },
    CLOSED: { label: "CLOSED", color: "var(--text-muted)", bg: "#1a1a1a" },
    EXPIRED: { label: "EXPIRED", color: "var(--text-muted)", bg: "#1a1a1a" },
    CANCELLED: { label: "CANCELLED", color: "var(--text-muted)", bg: "#1a1a1a" },
    AMBIGUOUS: { label: "AMBIGUOUS", color: "#C9A227", bg: "#1a1400" },
    INSUFFICIENT_DATA: { label: "NO DATA", color: "var(--text-muted)", bg: "#1a1a1a" },
  };
  const { label, color, bg } = cfg[status];
  const px = size === "sm" ? "4px 7px" : "5px 10px";
  const fs = size === "sm" ? "10px" : "11px";
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}30`,
        padding: px,
        borderRadius: 4,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.05em",
        fontFamily: "JetBrains Mono, monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

interface DirectionBadgeProps {
  direction: Direction;
}

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  const isLong = direction === "LONG";
  return (
    <span
      style={{
        background: isLong ? "#1a1600" : "#1a1a1a",
        color: isLong ? "var(--accent)" : "var(--text-muted)",
        border: `1px solid ${isLong ? "#D4AF3730" : "#27272750"}`,
        padding: "3px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {direction}
    </span>
  );
}

interface LeverageBadgeProps {
  leverage: number;
}

export function LeverageBadge({ leverage }: LeverageBadgeProps) {
  return (
    <span
      style={{
        background: "#1a1a1a",
        color: "var(--text-muted)",
        border: "1px solid #27272750",
        padding: "3px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {leverage}x
    </span>
  );
}

interface VerificationBadgeProps {
  status: VerificationStatus;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const cfg: Record<VerificationStatus, { label: string; color: string; icon: string }> = {
    VERIFIED: { label: "VERIFIED", color: "var(--profit)", icon: "✓" },
    PARTIALLY_VERIFIED: { label: "PARTIAL", color: "#C9A227", icon: "~" },
    AMBIGUOUS: { label: "AMBIGUOUS", color: "var(--text-muted)", icon: "?" },
    INSUFFICIENT_DATA: { label: "NO DATA", color: "var(--loss)", icon: "✗" },
  };
  const { label, color, icon } = cfg[status];
  return (
    <span
      style={{
        color,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        fontFamily: "JetBrains Mono, monospace",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

interface PnlValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function PnlValue({ value, prefix = "$", suffix = "", size = "md" }: PnlValueProps) {
  const color = value > 0 ? "var(--profit)" : value < 0 ? "var(--loss)" : "#A0A0A0";
  const sign = value > 0 ? "+" : "";
  const sizes = { xs: 11, sm: 12, md: 14, lg: 16, xl: 20 };
  return (
    <span
      style={{
        color,
        fontSize: sizes[size],
        fontWeight: 600,
        fontFamily: "JetBrains Mono, monospace",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {sign}{prefix}{Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
  );
}

interface RoiValueProps {
  value: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function RoiValue({ value, size = "md" }: RoiValueProps) {
  const color = value > 0 ? "var(--profit)" : value < 0 ? "var(--loss)" : "#A0A0A0";
  const sign = value > 0 ? "+" : "";
  const sizes = { xs: 10, sm: 11, md: 13, lg: 15, xl: 18 };
  return (
    <span
      style={{
        color,
        fontSize: sizes[size],
        fontWeight: 500,
        fontFamily: "JetBrains Mono, monospace",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {sign}{value.toFixed(2)}%
    </span>
  );
}
