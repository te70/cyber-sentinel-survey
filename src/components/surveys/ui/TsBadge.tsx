type BadgeVariant = "verified" | "pending" | "rejected" | "pro" | "free";

interface TsBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const styles: Record<BadgeVariant, { bg: string; text: string; defaultLabel: string }> = {
  verified: { bg: "#DCFCE7", text: "#166534", defaultLabel: "VERIFIED" },
  pending:  { bg: "#FEF3C7", text: "#92400E", defaultLabel: "PENDING" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", defaultLabel: "REJECTED" },
  pro:      { bg: "var(--ts-navy)", text: "white",    defaultLabel: "PRO" },
  free:     { bg: "var(--ts-teal-ghost)", text: "var(--ts-text-teal)", defaultLabel: "FREE" },
};

export function TsBadge({ variant, label }: TsBadgeProps) {
  const { bg, text, defaultLabel } = styles[variant];
  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: "var(--ts-font-body)",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: "9999px",
        display: "inline-block",
        lineHeight: 1.4,
      }}
    >
      {label ?? defaultLabel}
    </span>
  );
}
