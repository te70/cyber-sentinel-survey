import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlitaMark } from "@/components/alita/Logo";
import { PATTERN_IDS } from "@/components/alita/patterns";
import { SmePageHeader } from "@/components/alita/SmePageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createAssessment } from "@/lib/alita/alita.functions";
import { getSmeDashboard } from "@/lib/alita/dashboard.functions";

export const Route = createFileRoute("/alita/dashboard/$smeId")({
  component: DashboardScreen,
});

interface AssessmentSummary {
  id: string;
  type: "current_profile" | "target_profile";
  status: "in_progress" | "complete";
  createdAt: Date;
  confirmedDomains: number;
  totalDomains: number;
  composite: { bandLabel: string; gatedComposite: number } | null;
}

interface DashboardData {
  sme: { id: string; name: string; tier: "A" | "B" | "C"; tierOverridden: boolean };
  assessments: AssessmentSummary[];
  training: { completedCount: number; totalCount: number; percent: number };
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-px w-full" />
        <Skeleton className="mt-8 h-8 w-40" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const { smeId } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [creatingTarget, setCreatingTarget] = useState(false);

  function load() {
    setError(false);
    setData(null);
    getSmeDashboard({ data: { smeId } })
      .then((res) => setData(res as DashboardData))
      .catch(() => setError(true));
  }

  useEffect(load, [smeId]);

  async function handleSetTarget() {
    setCreatingTarget(true);
    try {
      const { assessment } = await createAssessment({ data: { smeId, type: "target_profile" } });
      navigate({ to: "/alita/assessment/$assessmentId", params: { assessmentId: assessment.id } });
    } finally {
      setCreatingTarget(false);
    }
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load your dashboard. Please check your connection and try again.
          </p>
          <Button className="mt-4 w-full" onClick={load}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const latestCurrent = data.assessments.find((a) => a.type === "current_profile") ?? null;
  const latestTarget = data.assessments.find((a) => a.type === "target_profile") ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative flex items-center gap-3 overflow-hidden bg-kitenge-indigo px-5 py-5">
        <svg className="absolute inset-0" width="100%" height="100%" aria-hidden="true">
          <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.dots})`} opacity="0.22" />
        </svg>
        <AlitaMark size={30} className="relative" />
        <span className="relative font-bold text-white">Alita</span>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-10">
        <SmePageHeader smeId={smeId} name={data.sme.name} tier={data.sme.tier} />

        <h1 className="text-2xl font-bold text-foreground">Your dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page is only reachable from your saved link — bookmark it to come back anytime.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Current assessment
          </h2>
          <Card className="mt-2 p-5">
            {!latestCurrent ? (
              <p className="text-sm text-muted-foreground">
                You haven't started an assessment yet.
              </p>
            ) : latestCurrent.status === "complete" ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {latestCurrent.composite?.bandLabel ?? "—"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Completed {new Date(latestCurrent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link
                    to="/alita/results/$assessmentId"
                    params={{ assessmentId: latestCurrent.id }}
                  >
                    View report
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    Domain {latestCurrent.confirmedDomains} of {latestCurrent.totalDomains} answered
                  </p>
                  <Badge variant="secondary" className="mt-1.5">
                    In progress
                  </Badge>
                </div>
                <Button asChild>
                  <Link
                    to="/alita/assessment/$assessmentId"
                    params={{ assessmentId: latestCurrent.id }}
                  >
                    Continue
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Target
          </h2>
          <Card className="mt-2 p-5">
            {!latestTarget ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg width="32" height="32" className="shrink-0 rounded-lg" aria-hidden="true">
                    <rect
                      width="100%"
                      height="100%"
                      fill={`url(#${PATTERN_IDS.dots})`}
                      opacity="0.5"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    Decide where you want your business to be, and get a plan to close the gap.
                  </p>
                </div>
                <Button onClick={handleSetTarget} disabled={creatingTarget || !latestCurrent}>
                  {creatingTarget ? "Starting…" : "Set a target"}
                </Button>
              </div>
            ) : latestTarget.status === "complete" ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-foreground">Target set</p>
                <Button variant="outline" asChild>
                  <Link to="/alita/gaps/$smeId" params={{ smeId }}>
                    See gaps
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    Domain {latestTarget.confirmedDomains} of {latestTarget.totalDomains} set
                  </p>
                  <Badge variant="secondary" className="mt-1.5">
                    In progress
                  </Badge>
                </div>
                <Button asChild>
                  <Link
                    to="/alita/assessment/$assessmentId"
                    params={{ assessmentId: latestTarget.id }}
                  >
                    Continue
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Training
          </h2>
          <Card className="mt-2 p-5">
            {data.training.completedCount === 0 ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg width="32" height="32" className="shrink-0 rounded-lg" aria-hidden="true">
                    <rect
                      width="100%"
                      height="100%"
                      fill={`url(#${PATTERN_IDS.dots})`}
                      opacity="0.5"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    You haven't started any lessons yet — a few minutes each.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/training" search={{ smeId }}>
                    Start training
                  </Link>
                </Button>
              </div>
            ) : data.training.percent >= 100 ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-kitenge-emerald">All training complete</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {data.training.completedCount} of {data.training.totalCount} lessons
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/training" search={{ smeId }}>
                    Review lessons
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{data.training.percent}% complete</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {data.training.completedCount} of {data.training.totalCount} lessons
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/training" search={{ smeId }}>
                    Continue training
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
