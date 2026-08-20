import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DomainRadarChart } from "@/components/alita/DomainRadarChart";
import { ResearcherPageHeader } from "@/components/alita/ResearcherPageHeader";
import { SimpleBarChart } from "@/components/alita/SimpleBarChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getResearchDashboard } from "@/lib/alita/research-dashboard.functions";
import { getResearcherAuthStatus } from "@/lib/researcher-auth.functions";

// Unlisted researcher-only route — not linked from any SME-facing nav, gated by a real session
// cookie. The server function itself also checks the session (requireResearcherSession in
// research-dashboard.functions.ts), so there's no unguarded network path even if this UI were
// bypassed — same posture as /research/export.
export const Route = createFileRoute("/research/dashboard")({
  component: DashboardScreen,
});

type Dashboard = Awaited<ReturnType<typeof getResearchDashboard>>;

const REGISTRATION_LABEL: Record<string, string> = {
  registered_or_exempt_documented: "Registered or exemption documented",
  checked_not_registered: "Checked, not yet registered",
  not_checked: "Not checked",
};

const BREACH_LABEL: Record<string, string> = {
  confirmed_known_with_contact: "72-hour rule known, contact named",
  not_confirmed: "Not confirmed",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-6 w-64" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-8 h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

function DashboardScreen() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getResearcherAuthStatus().then((res) => setAuthenticated(res.authenticated));
  }, []);

  function load() {
    setLoadError(false);
    setData(null);
    getResearchDashboard()
      .then((res) => setData(res))
      .catch(() => setLoadError(true));
  }

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated]);

  if (authenticated === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">You need to sign in to view this page.</p>
          <Button className="mt-4 w-full" asChild>
            <Link to="/research/login">Go to login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load the dashboard. Please check your connection and try again.
          </p>
          <Button className="mt-4 w-full" onClick={load}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <ResearcherPageHeader />

        <h1 className="text-2xl font-bold text-foreground">Research dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate analysis of every SME with active research-participation consent — no business
          names or identifying details anywhere on this page.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Population
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <StatCard label="Consented SMEs" value={data.population.consentedCount} />
            <StatCard
              label="Tier A / B / C"
              value={`${data.population.tierDistribution.A} / ${data.population.tierDistribution.B} / ${data.population.tierDistribution.C}`}
            />
            <StatCard label="Revoked consent" value={data.population.revokedConsentCount} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Assessment funnel
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <StatCard label="Current Profile complete" value={data.funnel.currentComplete} />
            <StatCard label="Current Profile in progress" value={data.funnel.currentInProgress} />
            <StatCard label="Target Profile complete" value={data.funnel.targetComplete} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Maturity results
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on {data.maturity.totalComplete} complete Current Profile assessment
            {data.maturity.totalComplete === 1 ? "" : "s"}.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <StatCard label="Average composite" value={data.maturity.averageComposite.toFixed(2)} />
            <StatCard
              label="Awareness gate applied"
              value={`${data.maturity.gateAppliedCount} (${Math.round(data.maturity.gateAppliedRate * 100)}%)`}
            />
          </div>

          {data.maturity.totalComplete > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Average level per domain
                </p>
                <DomainRadarChart
                  points={data.maturity.domainAverages.map((d) => ({
                    domainId: d.domainId,
                    label: d.label,
                    level: d.average,
                  }))}
                />
              </Card>
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Band distribution
                </p>
                <SimpleBarChart
                  points={Object.entries(data.maturity.bandDistribution).map(([label, value]) => ({
                    label,
                    value,
                  }))}
                />
              </Card>
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Training engagement
          </h2>
          <div className="mt-2">
            <StatCard
              label="Average completion, per consented SME"
              value={`${data.training.averageCompletionPercent}%`}
            />
          </div>
          <Card className="mt-4 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completion rate by domain
            </p>
            <SimpleBarChart
              points={data.training.domainCompletionRates.map((d) => ({
                label: d.label,
                value: d.rate,
              }))}
              valueSuffix="%"
            />
          </Card>
        </section>

        <section className="mt-6 mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            DPA readiness
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on the same {data.maturity.totalComplete} complete Current Profile assessments.
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm font-semibold text-foreground">Registration / exemption</p>
              <div className="mt-2 space-y-1.5">
                {Object.entries(data.dpa.registrationExemption).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {REGISTRATION_LABEL[status] ?? status}
                    </span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-semibold text-foreground">72-hour breach notification</p>
              <div className="mt-2 space-y-1.5">
                {Object.entries(data.dpa.breachNotification).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{BREACH_LABEL[status] ?? status}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
