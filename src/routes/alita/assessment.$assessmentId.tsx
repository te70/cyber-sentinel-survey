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

export const Route = createFileRoute("/alita/assessment/$assessmentId")({
  component: AssessmentFlow,
});

interface DescriptorOption {
  level: number;
  text: string;
}

function AssessmentFlow() {
  const { assessmentId } = Route.useParams();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [smeTier, setSmeTier] = useState<"A" | "B" | "C" | null>(null);
  const [assessmentType, setAssessmentType] = useState<"current_profile" | "target_profile" | null>(
    null,
  );
  const [smeId, setSmeId] = useState<string | null>(null);
  const [levels, setLevels] = useState<Partial<Record<DomainId, number>>>({});
  const [options, setOptions] = useState<DescriptorOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const domain = DOMAINS[stepIndex];

  // Load the assessment + SME once.
  useEffect(() => {
    getAssessment({ data: { assessmentId } }).then(({ assessment }) => {
      setSmeTier(assessment.sme.tier);
      setAssessmentType(assessment.type);
      setSmeId(assessment.smeId);
      const existing: Partial<Record<DomainId, number>> = {};
      for (const s of assessment.scores) existing[s.domainId as DomainId] = s.level;
      setLevels(existing);
      setLoaded(true);
    });
  }, [assessmentId]);

  // Load this step's descriptor options whenever the domain or tier changes.
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
      if (assessmentType === "target_profile" && smeId) {
        navigate({ to: "/alita/gaps/$smeId", params: { smeId } });
      } else {
        navigate({ to: "/alita/results/$assessmentId", params: { assessmentId } });
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

  const question =
    assessmentType === "target_profile"
      ? "Where would you like this area to be?"
      : "Which of these best describes your business today?";

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
    >
      <h1 className="text-xl font-bold text-foreground">{domain.label}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{question}</p>

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
