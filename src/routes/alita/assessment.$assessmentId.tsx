import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AssessmentShell } from "@/components/alita/AssessmentShell";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import {
  completeAssessment,
  getAssessment,
  getDescriptors,
  logAssessmentEvent,
  updateAssessmentScores,
} from "@/lib/alita/alita.functions";
import {
  computeDomainLevel,
  getAssessmentItems,
  submitItemResponses,
  confirmDomainLevel,
} from "@/lib/alita/item-assessment.functions";

export const Route = createFileRoute("/alita/assessment/$assessmentId")({
  component: AssessmentRoute,
});

type AssessmentType = "current_profile" | "target_profile";

function AssessmentRoute() {
  const { assessmentId } = Route.useParams();
  const [type, setType] = useState<AssessmentType | null>(null);

  useEffect(() => {
    getAssessment({ data: { assessmentId } }).then(({ assessment }) => {
      setType(assessment.type as AssessmentType);
    });
  }, [assessmentId]);

  if (!type) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your assessment…
      </div>
    );
  }

  // Target Profile ("where do you want to be") keeps the original single-pick descriptor flow —
  // psychometric rigor from the item battery doesn't apply to an aspirational target, and this
  // avoids maintaining a third assessment mode. Current Profile gets the full item battery.
  return type === "current_profile" ? (
    <CurrentProfileFlow assessmentId={assessmentId} />
  ) : (
    <TargetProfileFlow assessmentId={assessmentId} />
  );
}

// ── Target Profile: unchanged single-pick descriptor flow ─────────────────────────────────────

interface DescriptorOption {
  level: number;
  text: string;
}

function TargetProfileFlow({ assessmentId }: { assessmentId: string }) {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [smeTier, setSmeTier] = useState<"A" | "B" | "C" | null>(null);
  const [smeId, setSmeId] = useState<string | null>(null);
  const [levels, setLevels] = useState<Partial<Record<DomainId, number>>>({});
  const [options, setOptions] = useState<DescriptorOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const domain = DOMAINS[stepIndex];

  useEffect(() => {
    getAssessment({ data: { assessmentId } }).then(({ assessment }) => {
      setSmeTier(assessment.sme.tier);
      setSmeId(assessment.smeId);
      const existing: Partial<Record<DomainId, number>> = {};
      for (const s of assessment.scores) existing[s.domainId as DomainId] = s.level;
      setLevels(existing);
      setLoaded(true);
    });
  }, [assessmentId]);

  useEffect(() => {
    if (!smeTier) return;
    setOptions(null);
    getDescriptors({ data: { domainId: domain.id, tier: smeTier } }).then(({ descriptors }) => {
      setOptions(
        descriptors
          .map((d) => ({ level: d.level, text: d.text }))
          .sort((a, b) => a.level - b.level),
      );
    });
    logAssessmentEvent({ data: { assessmentId, eventType: "domain_viewed", domainId: domain.id } });
  }, [domain.id, smeTier, assessmentId]);

  async function saveCurrentDomain() {
    const level = levels[domain.id];
    if (level === undefined) return false;
    await updateAssessmentScores({ data: { assessmentId, scores: { [domain.id]: level } } });
    await logAssessmentEvent({
      data: { assessmentId, eventType: "domain_scored", domainId: domain.id },
    });
    setSaved(true);
    return true;
  }

  async function handleNext() {
    setBusy(true);
    setError(null);
    try {
      const ok = await saveCurrentDomain();
      if (!ok) return;

      if (stepIndex < DOMAINS.length - 1) {
        setStepIndex((i) => i + 1);
        return;
      }

      const result = await completeAssessment({ data: { assessmentId } });
      if (!result.ok) {
        setError(result.error ?? "Couldn't finish the assessment.");
        return;
      }
      if (smeId) {
        navigate({ to: "/alita/gaps/$smeId", params: { smeId } });
      }
    } catch {
      setError("Something went wrong saving your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  if (!loaded || !smeTier) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your assessment…
      </div>
    );
  }

  return (
    <AssessmentShell
      stepName={domain.label}
      stepIndex={stepIndex + 1}
      totalSteps={DOMAINS.length}
      onBack={stepIndex > 0 ? handleBack : undefined}
      onNext={handleNext}
      nextLabel={stepIndex === DOMAINS.length - 1 ? "Finish" : "Next"}
      nextDisabled={levels[domain.id] === undefined}
      busy={busy}
      saved={saved}
      smeId={smeId ?? undefined}
    >
      <h1 className="text-xl font-bold text-foreground">{domain.label}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Where would you like this area to be?</p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {!options ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading options…</p>
      ) : (
        <RadioGroup
          className="mt-6 space-y-3"
          value={levels[domain.id]?.toString() ?? ""}
          onValueChange={(v) => {
            setSaved(false);
            setLevels((prev) => ({ ...prev, [domain.id]: Number(v) }));
          }}
        >
          {options.map((opt) => (
            <label
              key={opt.level}
              data-testid={`level-option-${opt.level}`}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
            >
              <RadioGroupItem value={opt.level.toString()} className="mt-0.5" />
              <span className="text-sm text-foreground">{opt.text}</span>
            </label>
          ))}
        </RadioGroup>
      )}
    </AssessmentShell>
  );
}

// ── Current Profile: multi-item battery + compute-then-confirm ────────────────────────────────

interface AssessmentItemView {
  id: string;
  level: number;
  statementText: string;
}

const AGREE_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Not sure" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

type ItemSaveStatus = "saving" | "saved" | "error";

function CurrentProfileFlow({ assessmentId }: { assessmentId: string }) {
  const navigate = useNavigate();

  const [smeId, setSmeId] = useState<string | null>(null);
  const [smeTier, setSmeTier] = useState<"A" | "B" | "C" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [domainIndex, setDomainIndex] = useState(0);
  const [phase, setPhase] = useState<"items" | "confirm">("items");
  const [items, setItems] = useState<AssessmentItemView[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [itemSaveStatus, setItemSaveStatus] = useState<Record<string, ItemSaveStatus>>({});
  // Prior responses already in the DB — used to pre-fill `answers` once each domain's items load,
  // so returning to an in-progress domain shows your earlier selections instead of blank radios.
  const [savedItemResponses, setSavedItemResponses] = useState<Record<string, number>>({});
  const [computed, setComputed] = useState<{
    computedLevel: number;
    answeredCount: number;
    totalCount: number;
  } | null>(null);
  const [descriptorOptions, setDescriptorOptions] = useState<DescriptorOption[] | null>(null);
  const [confirmedLevel, setConfirmedLevel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domain = DOMAINS[domainIndex];

  useEffect(() => {
    getAssessment({ data: { assessmentId } }).then(({ assessment }) => {
      setSmeId(assessment.smeId);
      setSmeTier(assessment.sme.tier);
      setSavedItemResponses(
        Object.fromEntries(assessment.itemResponses.map((r) => [r.itemId, r.responseValue])),
      );

      // Resume at the first domain without a confirmed score, rather than always domain 1 —
      // earlier domains' `AssessmentScore` rows are the source of truth for what's done.
      const confirmedDomainIds = new Set(assessment.scores.map((s) => s.domainId));
      const resumeIndex = DOMAINS.findIndex((d) => !confirmedDomainIds.has(d.id));
      setDomainIndex(resumeIndex === -1 ? DOMAINS.length - 1 : resumeIndex);
      setLoaded(true);
    });
  }, [assessmentId]);

  // Load this domain's item battery whenever the domain changes, pre-filling any answers already
  // saved for it (naturally a no-op for a domain you haven't reached yet — no saved rows match).
  useEffect(() => {
    if (!smeTier) return;
    setItems(null);
    setAnswers({});
    setItemSaveStatus({});
    setPhase("items");
    setComputed(null);
    getAssessmentItems({ data: { domainId: domain.id, tier: smeTier } }).then(({ items: rows }) => {
      const typedItems = rows as AssessmentItemView[];
      setItems(typedItems);
      const prefilled: Record<string, number> = {};
      for (const item of typedItems) {
        if (savedItemResponses[item.id] !== undefined)
          prefilled[item.id] = savedItemResponses[item.id];
      }
      setAnswers(prefilled);
    });
    logAssessmentEvent({ data: { assessmentId, eventType: "domain_viewed", domainId: domain.id } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.id, smeTier, assessmentId]);

  async function saveItemResponse(itemId: string, responseValue: number) {
    setItemSaveStatus((prev) => ({ ...prev, [itemId]: "saving" }));
    try {
      await submitItemResponses({ data: { assessmentId, responses: [{ itemId, responseValue }] } });
      setItemSaveStatus((prev) => ({ ...prev, [itemId]: "saved" }));
    } catch {
      setItemSaveStatus((prev) => ({ ...prev, [itemId]: "error" }));
    }
  }

  async function finishItemsPhase() {
    if (!items) return;
    setBusy(true);
    setError(null);
    try {
      await submitItemResponses({
        data: {
          assessmentId,
          responses: items.map((item) => ({ itemId: item.id, responseValue: answers[item.id] })),
        },
      });
      const result = await computeDomainLevel({
        data: { assessmentId, domainId: domain.id, tier: smeTier! },
      });
      setComputed(result);
      setConfirmedLevel(result.computedLevel);

      const { descriptors } = await getDescriptors({
        data: { domainId: domain.id, tier: smeTier! },
      });
      setDescriptorOptions(
        descriptors
          .map((d) => ({ level: d.level, text: d.text }))
          .sort((a, b) => a.level - b.level),
      );
      setPhase("confirm");
    } catch {
      setError("Something went wrong saving your answers. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleNext() {
    if (phase === "items") {
      if (items!.some((item) => answers[item.id] === undefined)) return;
      if (items!.some((item) => itemSaveStatus[item.id] === "error")) return;
      await finishItemsPhase();
      return;
    }

    // Confirm phase
    if (confirmedLevel === null || !computed) return;
    setBusy(true);
    setError(null);
    try {
      await confirmDomainLevel({
        data: {
          assessmentId,
          domainId: domain.id,
          computedLevel: computed.computedLevel,
          confirmedLevel,
        },
      });
      await logAssessmentEvent({
        data: { assessmentId, eventType: "domain_scored", domainId: domain.id },
      });
      setSaved(true);

      if (domainIndex < DOMAINS.length - 1) {
        setDomainIndex((i) => i + 1);
        return;
      }

      const result = await completeAssessment({ data: { assessmentId } });
      if (!result.ok) {
        setError(result.error ?? "Couldn't finish the assessment.");
        return;
      }
      navigate({ to: "/alita/results/$assessmentId", params: { assessmentId } });
    } catch {
      setError("Something went wrong saving your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    if (phase === "confirm") {
      setPhase("items");
    }
  }

  if (!loaded || !smeTier || !smeId || !items) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your assessment…
      </div>
    );
  }

  const isLastDomain = domainIndex === DOMAINS.length - 1;
  const hasSaveErrors =
    phase === "items" && items.some((item) => itemSaveStatus[item.id] === "error");

  return (
    <AssessmentShell
      stepName={domain.label}
      stepIndex={domainIndex + 1}
      totalSteps={DOMAINS.length}
      onBack={phase === "confirm" ? handleBack : undefined}
      onNext={handleNext}
      nextLabel={phase === "items" ? "Continue" : isLastDomain ? "Finish" : "Confirm & continue"}
      nextDisabled={
        phase === "items"
          ? items.some((item) => answers[item.id] === undefined) || hasSaveErrors
          : confirmedLevel === null
      }
      nextDisabledHint={hasSaveErrors ? "Retry the answers that couldn't save below." : undefined}
      busy={busy}
      saved={saved}
      smeId={smeId}
    >
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {phase === "items" ? (
        <>
          <h1 className="text-xl font-bold text-foreground">{domain.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For each statement, choose how much you agree.
          </p>

          <div className="mt-6 space-y-6">
            {items.map((item) => {
              const status = itemSaveStatus[item.id];
              return (
                <div key={item.id} data-testid={`assessment-item-${item.level}`}>
                  <p className="text-base text-foreground">{item.statementText}</p>
                  <RadioGroup
                    className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-2"
                    value={answers[item.id]?.toString() ?? ""}
                    onValueChange={(v) => {
                      const responseValue = Number(v);
                      setAnswers((prev) => ({ ...prev, [item.id]: responseValue }));
                      saveItemResponse(item.id, responseValue);
                    }}
                  >
                    {AGREE_SCALE.map((point) => (
                      <label
                        key={point.value}
                        data-testid={`agree-scale-${item.level}-${point.value}`}
                        className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                      >
                        <RadioGroupItem value={point.value.toString()} />
                        <span className="text-xs text-muted-foreground">{point.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  {status === "saving" && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Saving…</p>
                  )}
                  {status === "saved" && <p className="mt-1.5 text-xs text-success">Saved</p>}
                  {status === "error" && (
                    <button
                      type="button"
                      data-testid={`retry-save-${item.level}`}
                      onClick={() => saveItemResponse(item.id, answers[item.id])}
                      className="mt-1.5 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                    >
                      Couldn't save — tap to retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-foreground">{domain.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on your answers, this is where you land. Confirm it, or pick a different level
            below if it doesn't feel right.
          </p>

          {descriptorOptions && (
            <RadioGroup
              className="mt-6 space-y-3"
              value={confirmedLevel?.toString() ?? ""}
              onValueChange={(v) => setConfirmedLevel(Number(v))}
            >
              {descriptorOptions.map((opt) => (
                <label
                  key={opt.level}
                  data-testid={`confirm-level-option-${opt.level}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                >
                  <RadioGroupItem value={opt.level.toString()} className="mt-0.5" />
                  <span className="flex flex-1 flex-col items-start gap-1.5">
                    <span className="text-sm text-foreground">{opt.text}</span>
                    {computed && opt.level === computed.computedLevel && (
                      <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Based on your answers
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        </>
      )}
    </AssessmentShell>
  );
}
