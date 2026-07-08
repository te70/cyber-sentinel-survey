import { type ComponentType } from "react";
import { TsButton } from "./TsButton";

interface TsEmptyStateProps {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  headline: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}

export function TsEmptyState({ icon: Icon, headline, body, ctaLabel, ctaHref, onCta }: TsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Icon className="h-16 w-16 text-[var(--ts-teal)]" aria-hidden />
      <h3
        className="text-lg font-semibold text-[var(--ts-text-primary)]"
        style={{ fontFamily: "var(--ts-font-display)" }}
      >
        {headline}
      </h3>
      {body && (
        <p className="max-w-sm text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          {body}
        </p>
      )}
      {ctaLabel && (ctaHref || onCta) && (
        <div className="mt-2">
          {ctaHref ? (
            <a href={ctaHref}>
              <TsButton variant="primary">{ctaLabel}</TsButton>
            </a>
          ) : (
            <TsButton variant="primary" onClick={onCta}>{ctaLabel}</TsButton>
          )}
        </div>
      )}
    </div>
  );
}
