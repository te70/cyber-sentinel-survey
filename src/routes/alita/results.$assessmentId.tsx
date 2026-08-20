import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DomainRadarChart } from "@/components/alita/DomainRadarChart";
import { AlitaMark } from "@/components/alita/Logo";
import { PATTERN_IDS } from "@/components/alita/patterns";
import { SmePageHeader } from "@/components/alita/SmePageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import { levelColor, levelTextIsLight } from "@/lib/alita/level-color";
import { createAssessment, getAssessment, getAssessmentResult } from "@/lib/alita/alita.functions";
import { getRemediationReport, setRemediationProgress } from "@/lib/alita/remediation.functions";
import { generateAssessmentPdf } from "@/lib/alita/pdf.functions";

// TanStack Router parses numeric-looking search params as numbers, so a bare `?print=1` in the
// URL arrives as the number 1, not the string "1".
const SearchSchema = z.object({ print: z.literal(1).optional() });

export const Route = createFileRoute("/alita/results/$assessmentId")({
  validateSearch: (search) => SearchSchema.parse(search),
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
  smeTier: "A" | "B" | "C";
}

function downloadBase64Pdf(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ResultsScreen() {
  const { assessmentId } = Route.useParams();
  const { print: isPrint } = Route.useSearch();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionPlanReady, setActionPlanReady] = useState(false);
  const [creatingTarget, setCreatingTarget] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  function load() {
    setLoadError(false);
    setData(null);
    Promise.all([
      getAssessmentResult({ data: { assessmentId } }),
      getAssessment({ data: { assessmentId } }),
    ])
      .then(([result, { assessment }]) => {
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
          smeTier: assessment.sme.tier,
        });
      })
      .catch(() => setLoadError(true));
  }

  useEffect(load, [assessmentId]);

  async function handleSetTarget() {
    if (!data) return;
    setCreatingTarget(true);
    const { assessment } = await createAssessment({
      data: { smeId: data.smeId, type: "target_profile" },
    });
    navigate({ to: "/alita/assessment/$assessmentId", params: { assessmentId: assessment.id } });
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const { base64 } = await generateAssessmentPdf({ data: { assessmentId } });
      downloadBase64Pdf(base64, `alita-report-${assessmentId.slice(0, 8)}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load your results. Please check your connection and try again.
          </p>
          <Button className="mt-4 w-full" onClick={load}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-8 w-64" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
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
      {/* Puppeteer/Playwright PDF generation waits on this marker once all data (including the
          Action Plan, loaded asynchronously below) has actually rendered. */}
      {actionPlanReady && <div data-report-ready="true" className="hidden" />}

      <div className="mx-auto max-w-2xl">
        <div
          className="mb-6 flex items-center gap-2 border-b-4 border-transparent pb-3"
          style={{
            borderImage: `repeating-linear-gradient(90deg, var(--kitenge-terracotta) 0 14px, var(--kitenge-marigold) 14px 28px, var(--kitenge-indigo) 28px 42px, var(--kitenge-emerald) 42px 56px) 4`,
          }}
        >
          <AlitaMark size={26} />
          <span className="font-bold text-foreground">Alita — Maturity Assessment Report</span>
        </div>

        {!isPrint && <SmePageHeader smeId={data.smeId} name={data.smeName} tier={data.smeTier} />}

        <p className="text-sm text-muted-foreground">{data.smeName}'s results</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Overall maturity: <span className="text-primary">{data.bandLabel}</span>
        </h1>

        {!isPrint && (
          <Card className="mt-4 bg-secondary/30 p-3.5 text-sm text-foreground">
            There's no login — this link is the only way back to your{" "}
            <Link
              to="/alita/dashboard/$smeId"
              params={{ smeId: data.smeId }}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              dashboard
            </Link>
            . Bookmark it, or treat it like any private document.
          </Card>
        )}

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

        <ActionPlanSection
          assessmentId={assessmentId}
          smeId={data.smeId}
          isPrint={!!isPrint}
          onLoaded={() => setActionPlanReady(true)}
        />

        {!isPrint && (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={handleSetTarget} disabled={creatingTarget}>
                {creatingTarget ? "Starting…" : "Set a target for where I want to be"}
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
              </Button>
              <Button variant="ghost" asChild className="flex-1">
                <Link to="/alita/settings/$smeId" params={{ smeId: data.smeId }}>
                  Privacy & consent settings
                </Link>
              </Button>
            </div>
          </>
        )}

        <svg
          className="mx-auto mt-10 block h-3 max-w-xs"
          width="100%"
          height="12"
          aria-hidden="true"
        >
          <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.teeth})`} opacity="0.7" />
        </svg>

        <p className="mt-3 text-center text-xs text-muted-foreground">
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

function ActionPlanSection({
  assessmentId,
  smeId,
  isPrint,
  onLoaded,
}: {
  assessmentId: string;
  smeId: string;
  isPrint: boolean;
  onLoaded: () => void;
}) {
  const [entries, setEntries] = useState<ReportEntry[] | null>(null);
  const [expanded, setExpanded] = useState<Set<DomainId>>(new Set());

  useEffect(() => {
    getRemediationReport({ data: { assessmentId } }).then((res) => {
      setEntries(res.entries as ReportEntry[]);
      onLoaded();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

              {!isPrint && entry.tools.length > 0 && (
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

              {!isPrint && (
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
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
