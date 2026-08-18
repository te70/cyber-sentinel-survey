import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CLASSIFICATION_QUESTIONS, type Tier } from "@/lib/alita/classification";
import { createAssessment, createSme, overrideSmeTier } from "@/lib/alita/alita.functions";

export const Route = createFileRoute("/alita/start")({
  component: StartScreen,
});

const TIER_NAMES: Record<Tier, string> = {
  A: "Tier A — Foundation",
  B: "Tier B — Managed",
  C: "Tier C — Advanced",
};

const TIER_BLURBS: Record<Tier, string> = {
  A: "Written for a solo operator or small team where social media apps ARE the business — plain language, no jargon.",
  B: "Written for a small team with outsourced or part-time IT — every technical term is explained inline.",
  C: "Written for a business with in-house IT/security capability — full technical language.",
};

type Answers = Record<"q1" | "q2" | "q3" | "q4" | "q5", Tier | undefined>;

function StartScreen() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    q1: undefined,
    q2: undefined,
    q3: undefined,
    q4: undefined,
    q5: undefined,
  });
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sme, setSme] = useState<{ id: string; tierSuggested: Tier } | null>(null);
  const [chosenTier, setChosenTier] = useState<Tier | null>(null);

  const allAnswered = Object.values(answers).every((v) => v !== undefined);
  const canSubmitProfile = businessName.trim().length > 0 && allAnswered && consented;

  async function handleSeeYourTier() {
    if (!canSubmitProfile) return;
    setSubmitting(true);
    setError(null);
    try {
      const { sme: created } = await createSme({
        data: {
          name: businessName.trim(),
          q1Answer: answers.q1!,
          q2Answer: answers.q2!,
          q3Answer: answers.q3!,
          q4Answer: answers.q4!,
          q5Answer: answers.q5!,
        },
      });
      setSme({ id: created.id, tierSuggested: created.tierSuggested });
      setChosenTier(created.tierSuggested);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartAssessment() {
    if (!sme || !chosenTier) return;
    setSubmitting(true);
    setError(null);
    try {
      if (chosenTier !== sme.tierSuggested) {
        await overrideSmeTier({ data: { smeId: sme.id, tier: chosenTier } });
      }
      const { assessment } = await createAssessment({
        data: { smeId: sme.id, type: "current_profile" },
      });
      navigate({ to: "/alita/assessment/$assessmentId", params: { assessmentId: assessment.id } });
    } catch {
      setError("Couldn't start your assessment. Please try again.");
      setSubmitting(false);
    }
  }

  if (sme && chosenTier) {
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-foreground">Your suggested starting point</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on your answers, we think this register fits your business best. You can change it
            — this decides the wording you'll read, not your final score.
          </p>

          <div className="mt-6 space-y-3">
            {(Object.keys(TIER_NAMES) as Tier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setChosenTier(tier)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  chosenTier === tier
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{TIER_NAMES[tier]}</span>
                  {tier === sme.tierSuggested && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Suggested
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{TIER_BLURBS[tier]}</p>
              </button>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleStartAssessment}
            disabled={submitting}
          >
            {submitting ? "Starting…" : "Start my assessment"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Tell us about your business</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A few quick questions so we can show you the right wording — no answer is "wrong."
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Jaza Designs"
          />
        </div>

        <div className="mt-8 space-y-6">
          {CLASSIFICATION_QUESTIONS.map((q) => (
            <Card key={q.id} className="p-4">
              <p className="font-medium text-foreground">{q.text}</p>
              <RadioGroup
                className="mt-3"
                value={answers[q.id] ?? ""}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v as Tier }))}
              >
                {q.options.map((opt) => (
                  <label
                    key={opt.label}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 hover:bg-secondary/50"
                  >
                    <RadioGroupItem
                      value={opt.tier}
                      id={`${q.id}-${opt.tier}`}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-4">
          <label className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              checked={consented}
              onCheckedChange={(v) => setConsented(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground">
              I understand Alita stores my business's answers to generate this assessment, and that
              this is a USIU-A research tool grounded in NIST CSF and Kenya's Data Protection Act,
              2019.
            </span>
          </label>
        </Card>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleSeeYourTier}
          disabled={!canSubmitProfile || submitting}
        >
          {submitting ? "Continuing…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
