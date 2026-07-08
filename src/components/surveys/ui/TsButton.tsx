import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface TsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--ts-teal)] min-h-[44px] min-w-[44px] px-5 cursor-pointer " +
  "disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--ts-teal)] text-[var(--ts-text-inverse)] hover:bg-[var(--ts-teal-dim)] " +
    "disabled:bg-[var(--ts-border)] disabled:text-[var(--ts-text-disabled)]",
  secondary:
    "bg-white border border-[var(--ts-teal)] text-[var(--ts-teal)] hover:bg-[var(--ts-teal-ghost)] " +
    "disabled:bg-[var(--ts-border)] disabled:border-[var(--ts-border)] disabled:text-[var(--ts-text-disabled)]",
  ghost:
    "bg-transparent text-[var(--ts-teal)] hover:underline " +
    "disabled:text-[var(--ts-text-disabled)]",
  danger:
    "bg-[var(--ts-error)] text-[var(--ts-text-inverse)] hover:opacity-90 " +
    "disabled:bg-[var(--ts-border)] disabled:text-[var(--ts-text-disabled)]",
};

export function TsButton({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: TsButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        children
      )}
      {loading && <span className="sr-only">Loading…</span>}
    </button>
  );
}
