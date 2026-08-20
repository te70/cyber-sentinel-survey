import { type ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface AssessmentShellProps {
  stepName: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => Promise<void> | void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextDisabledHint?: string;
  busy?: boolean;
  saved?: boolean;
  // Renders a persistent "My dashboard" link in the top bar, so someone who closes the tab
  // mid-assessment still has a way back later — otherwise an abandoned session is unreachable.
  smeId?: string;
  children: ReactNode;
}

export function AssessmentShell({
  stepName,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Next",
  nextDisabled = false,
  nextDisabledHint,
  busy = false,
  saved = false,
  smeId,
  children,
}: AssessmentShellProps) {
  const pct = Math.round((stepIndex / totalSteps) * 100);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed top-0 right-0 left-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <span className="text-sm font-semibold text-foreground">{stepName}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Step {stepIndex} of {totalSteps}
            </span>
            {smeId && (
              <Link
                to="/alita/dashboard/$smeId"
                params={{ smeId }}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                My dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5 pt-20">{children}</main>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-card px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} disabled={busy}>
              Back
            </Button>
          ) : (
            <span />
          )}

          <div className="flex flex-col items-end gap-1">
            {nextDisabled && nextDisabledHint && (
              <p className="text-xs text-muted-foreground">{nextDisabledHint}</p>
            )}
            <Button
              onClick={onNext}
              disabled={nextDisabled || busy}
              className={onBack ? "" : "w-full"}
            >
              {busy ? "Saving…" : nextLabel}
            </Button>
          </div>
        </div>
      </div>

      {showSaved && (
        <div
          className="fixed right-4 bottom-24 flex items-center gap-1.5 text-xs text-muted-foreground"
          aria-live="polite"
        >
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          Saved
        </div>
      )}
    </div>
  );
}
