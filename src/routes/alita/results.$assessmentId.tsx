import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DomainRadarChart } from "@/components/alita/DomainRadarChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import { levelColor, levelTextIsLight } from "@/lib/alita/level-color";
import { createAssessment, getAssessment, getAssessmentResult } from "@/lib/alita/alita.functions";
import { getRemediationReport, setRemediationProgress } from "@/lib/alita/remediation.functions";

export const Route = createFileRoute("/alita/results/$assessmentId")({
  component: ResultsScreen,
});

interface ResultData {
  bandLabel: string;
  rawComposite: number;
  gatedComposite: number;
  gateApplied: boolean;
  scores: Partial<Record<DomainId, number>>;
  smeId: string;
  smeName: string;
}

function ResultsScreen() {
  const { assessmentId } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultData | null>(null);
  const [creatingTarget, setCreatingTarget] = useState(false);

  useEffect(() => {
    Promise.all([
      getAssessmentResult({ data: { assessmentId } }),
      getAssessment({ data: { assessmentId } }),
    ]).then(([result, { assessment }]) => {
      const scores: Partial<Record<DomainId, number>> = {};
      for (const s of result.scores) scores[s.domainId as DomainId] = s.level;
      setData({
        bandLabel: result.composite?.bandLabel ?? "—",
        rawComposite: result.composite?.rawComposite ?? 0,
        gatedComposite: result.composite?.gatedComposite ?? 0,
        gateApplied: result.composite?.gateApplied ?? false,
        scores,
        smeId: assessment.smeId,
        smeName: assessment.sme.name,
      });
    });
  }, [assessmentId]);

  async function handleSetTarget() {
    if (!data) return;
    setCreatingTarget(true);
    const { assessment } = await createAssessment({
      data: { smeId: data.smeId, type: "target_profile" },
    });
    navigate({ to: "/alita/assessment/$assessmentId", params: { assessmentId: assessment.id } });
  }

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your results…
      </div>
    );
  }

  const radarPoints = DOMAINS.map((d) => ({
    domainId: d.id,
    label: d.label,
    level: data.scores[d.id] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">{data.smeName}'s results</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Overall maturity: <span className="text-primary">{data.bandLabel}</span>
        </h1>

        {data.gateApplied && (
          <Card className="mt-4 border-attention/40 bg-attention/10 p-4">
            <p className="text-sm text-foreground">
              Your Awareness &amp; Training score is below Level 2, so your overall band is capped
              at "Initial" — even though the raw weighted score from your six areas would have been{" "}
              {data.rawComposite.toFixed(2)}. This is deliberate: strong technical controls don't
              protect a business whose people aren't prepared for social engineering. Your six areas
              below are shown exactly as scored, nothing is hidden.
            </p>
          </Card>
        )}

        <div className="mt-6">
          <DomainRadarChart points={radarPoints} />
        </div>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {DOMAINS.map((d) => {
            const level = data.scores[d.id] ?? 0;
            return (
              <Card key={d.id} className="flex items-center justify-between p-3.5">
                <span className="text-sm font-medium text-foreground">{d.label}</span>
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: levelColor(level),
                    color: levelTextIsLight(level) ? "white" : "var(--foreground)",
                  }}
                >
                  {level}
                </span>
              </Card>
            );
          })}
        </div>

        <ActionPlanSection assessmentId={assessmentId} smeId={data.smeId} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={handleSetTarget} disabled={creatingTarget}>
            {creatingTarget ? "Starting…" : "Set a target for where I want to be"}
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link to="/">Back to home</Link>
          </Button>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Alita is a research tool built at USIU-A, grounded in the NIST Cybersecurity Framework and
          Kenya's Data Protection Act, 2019.
        </p>
      </div>
    </div>
  );
}

// ── Action Plan ──────────────────────────────────────────────────────────────────────────────

interface ReportEntry {
  domainId: DomainId;
  currentLevel: number;
  effectiveTarget: number;
  priority: "High" | "Medium" | "Low";
  gatePinned: boolean;
  chainGuidance: ({
    fromLevel: number;
    toLevel: number;
    whatsWrong: string;
    howToImprove: string;
  } | null)[];
  tools: { name: string; url: string; setupComplexity: "none" | "low" | "moderate" }[];
  lessonId: string | null;
  progressStatus: "in_progress" | "done" | null;
}

const SETUP_LABEL: Record<string, string> = {
  none: "No setup",
  low: "Quick setup",
  moderate: "Some setup",
};

function ActionPlanSection({ assessmentId, smeId }: { assessmentId: string; smeId: string }) {
  const [entries, setEntries] = useState<ReportEntry[] | null>(null);
  const [expanded, setExpanded] = useState<Set<DomainId>>(new Set());

  useEffect(() => {
    getRemediationReport({ data: { assessmentId } }).then((res) => {
      setEntries(res.entries as ReportEntry[]);
    });
  }, [assessmentId]);

  async function handleProgress(domainId: DomainId, status: "in_progress" | "done") {
    setEntries((prev) =>
      prev
        ? prev.map((e) => (e.domainId === domainId ? { ...e, progressStatus: status } : e))
        : prev,
    );
    await setRemediationProgress({ data: { smeId, domainId, status } });
  }

  if (!entries) {
    return <p className="mt-10 text-sm text-muted-foreground">Loading your action plan…</p>;
  }

  if (entries.length === 0) {
    return (
      <Card className="mt-10 p-5 text-sm text-muted-foreground">
        You're already at or above the "Defined" level in every area — nice work. Set a target to
        get a tailored plan for going further.
      </Card>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-foreground">Your Action Plan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ranked by what will help most — starting with the area holding back the rest of your score.
      </p>

      <div className="mt-4 space-y-4">
        {entries.map((entry) => {
          const domain = DOMAINS.find((d) => d.id === entry.domainId)!;
          const isExpanded = expanded.has(entry.domainId);
          const firstStep = entry.chainGuidance[0];
          const restSteps = entry.chainGuidance.slice(1);

          return (
            <Card
              key={entry.domainId}
              data-testid={`action-plan-${entry.domainId}`}
              className={entry.gatePinned ? "border-attention p-5" : "p-5"}
            >
              {entry.gatePinned && (
                <div className="mb-3 rounded-lg bg-attention/15 px-3 py-2 text-xs font-medium text-foreground">
                  This is capping your overall score — fixing it first raises your band the most.
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{domain.label}</h3>
                <span className="text-xs text-muted-foreground">
                  Level {entry.currentLevel} → {entry.effectiveTarget}
                </span>
              </div>

              {firstStep && (
                <>
                  <p className="mt-2 text-sm text-foreground">{firstStep.whatsWrong}</p>
                  <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {firstStep.howToImprove}
                  </div>
                </>
              )}

              {restSteps.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(entry.domainId)) next.delete(entry.domainId);
                        else next.add(entry.domainId);
                        return next;
                      })
                    }
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {isExpanded ? "Hide the rest of the path" : "See full path to target"}
                  </button>
                  {isExpanded && (
                    <div className="mt-3 space-y-3 border-l-2 border-border pl-3">
                      {restSteps.map(
                        (step) =>
                          step && (
                            <div key={`${step.fromLevel}-${step.toLevel}`}>
                              <p className="text-xs font-semibold text-muted-foreground">
                                Level {step.fromLevel} → {step.toLevel}
                              </p>
                              <p className="mt-1 text-sm text-foreground">{step.whatsWrong}</p>
                              <div className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                                {step.howToImprove}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {entry.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tools.map((tool) => (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      {tool.name}
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        {SETUP_LABEL[tool.setupComplexity]}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={entry.progressStatus === "in_progress" ? "default" : "outline"}
                  onClick={() => handleProgress(entry.domainId, "in_progress")}
                >
                  In progress
                </Button>
                <Button
                  size="sm"
                  variant={entry.progressStatus === "done" ? "default" : "outline"}
                  onClick={() => handleProgress(entry.domainId, "done")}
                >
                  Done
                </Button>
                {entry.lessonId && (
                  <Button size="sm" variant="ghost" asChild>
                    <Link
                      to="/training/$lessonId"
                      params={{ lessonId: entry.lessonId }}
                      search={{ smeId }}
                    >
                      Learn more →
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
