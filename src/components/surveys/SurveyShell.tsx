import { type ReactNode, useEffect, useState } from "react";
import { TsButton } from "@/components/surveys/ui/TsButton";

interface SurveyShellProps {
  sectionName: string;
  sectionIndex: number;
  totalSections: number;
  onNext: () => Promise<void> | void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextDisabledHint?: string;
  busy?: boolean;
  saved?: boolean;
  children: ReactNode;
}

export function SurveyShell({
  sectionName,
  sectionIndex,
  totalSections,
  onNext,
  onBack,
  nextLabel = "Next →",
  nextDisabled = false,
  nextDisabledHint,
  busy = false,
  saved = false,
  children,
}: SurveyShellProps) {
  const pct = Math.round((sectionIndex / totalSections) * 100);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="min-h-screen bg-[var(--ts-surface)] pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--ts-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            {sectionName}
          </span>
          <span className="text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            Section {sectionIndex} of {totalSections}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-[var(--ts-border)]">
          <div
            className="h-full bg-[var(--ts-teal)] transition-all duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Page content */}
      <main className="mx-auto max-w-3xl px-6 pt-20">
        {children}
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--ts-border)] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {onBack ? (
            <TsButton variant="ghost" onClick={onBack} disabled={busy}>← Back</TsButton>
          ) : <span />}

          <div className="flex flex-col items-end gap-1">
            {nextDisabled && nextDisabledHint && (
              <p className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                {nextDisabledHint}
              </p>
            )}
            <TsButton variant="primary" onClick={onNext} disabled={nextDisabled} loading={busy} fullWidth={!onBack}>
              {nextLabel}
            </TsButton>
          </div>
        </div>
      </div>

      {/* Auto-save dot */}
      {showSaved && (
        <div
          className="fixed bottom-20 right-4 flex items-center gap-1.5 text-xs text-[var(--ts-text-secondary)]"
          style={{ fontFamily: "var(--ts-font-body)" }}
          aria-live="polite"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--ts-teal)]" aria-hidden="true" />
          Saved
        </div>
      )}
    </div>
  );
}
