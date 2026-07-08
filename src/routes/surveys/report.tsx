import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { TsButton } from "@/components/surveys/ui/TsButton";
import { TsCard } from "@/components/surveys/ui/TsCard";
import { TsEmptyState } from "@/components/surveys/ui/TsEmptyState";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/surveys/report")({
  head: () => ({ meta: [{ title: "Maturity report — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: ReportPage,
});

type Tier = "Initial" | "Developing" | "Defined" | "Managed" | "Optimising";

const TIER_DESCRIPTIONS: Record<Tier, string> = {
  Initial:
    "Your business is in the early stages of cybersecurity maturity. Security controls are largely informal or absent, and incidents may occur without structured response procedures. Prioritising foundational policies and access controls will have the highest immediate impact.",
  Developing:
    "Some security practices are in place, but they are inconsistent or undocumented. Your business recognises cybersecurity as important but has not yet formalised processes across all domains. Building repeatable procedures and assigning clear ownership will accelerate progress.",
  Defined:
    "Your business has documented security policies and follows consistent procedures across most domains. Gaps remain in measurement, testing, and continuous improvement. Focusing on incident response drills and regular risk reviews will move you to the next tier.",
  Managed:
    "Security processes are measured and actively managed. Your business responds well to incidents and tracks performance against defined targets. Advancing to Optimising requires embedding security into strategic planning and supplier management.",
  Optimising:
    "Your business demonstrates leading cybersecurity practices — policies are current, controls are tested, and improvement is continuous. Maintain this by participating in threat intelligence sharing and conducting annual external assessments.",
};

const DOMAINS = [
  "Governance",
  "Risk Management",
  "Access Control",
  "Incident Response",
  "Recovery",
  "Awareness",
] as const;

function getTier(score: number): { tier: Tier; color: string } {
  if (score < 2)   return { tier: "Initial",    color: "var(--ts-error)" };
  if (score < 3)   return { tier: "Developing", color: "var(--ts-warning)" };
  if (score < 4)   return { tier: "Defined",    color: "var(--ts-info)" };
  if (score < 4.5) return { tier: "Managed",    color: "var(--ts-success)" };
  return            { tier: "Optimising",        color: "var(--ts-teal)" };
}

function SkeletonBlock({ h = "h-8" }: { h?: string }) {
  return <div className={`ts-skeleton w-full rounded ${h}`} />;
}

function ReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified] = useState(false);
  const [score] = useState<number | null>(null);
  const [isPaid] = useState(false);
  const [domainScores] = useState<number[]>([]);

  useEffect(() => {
    const hasSession = !!document.cookie.includes("survey_session");
    if (!hasSession) { navigate({ to: "/surveys/otp" }); return; }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <SkeletonBlock h="h-12" />
        <SkeletonBlock h="h-48" />
        <SkeletonBlock h="h-64" />
      </div>
    );
  }

  if (!verified || score === null) {
    return (
      <div className="grid min-h-screen place-items-center px-6" style={{ backgroundColor: "var(--ts-surface)" }}>
        <TsEmptyState
          icon={ShieldCheck}
          headline="Your report is being prepared"
          body="We'll notify you within 48 hours once verified."
        />
      </div>
    );
  }

  const { tier, color } = getTier(score);
  const chartData = DOMAINS.map((subject, i) => ({ subject, value: domainScores[i] ?? 0 }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ts-surface)" }}>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">

        {/* Score header */}
        <TsCard className="flex flex-col items-center gap-3 py-8 text-center">
          <div
            className="ts-score-ring flex h-[180px] w-[180px] flex-col items-center justify-center"
            style={{ border: "3px solid var(--ts-teal)" }}
            aria-label={`Maturity score ${score} out of 5`}
          >
            <span className="text-[64px] font-bold leading-none text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              {score.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>out of 5.0</span>
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: "var(--ts-font-display)", color }}>
            {tier}
          </span>
          <p className="max-w-lg text-sm text-[var(--ts-text-body)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            {TIER_DESCRIPTIONS[tier]}
          </p>
        </TsCard>

        {/* Radar chart */}
        <TsCard>
          <h2 className="mb-4 text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
            Domain breakdown
          </h2>
          <div className="h-[300px] sm:h-[380px] lg:h-[440px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="var(--ts-border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fill: "var(--ts-text-secondary)" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  fill="rgba(0, 191, 166, 0.15)"
                  stroke="#00BFA6"
                  strokeWidth={2}
                  dot={{ fill: "#00BFA6", r: 4 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Screen-reader table */}
          <table className="sr-only">
            <caption>Maturity scores by domain</caption>
            <thead><tr><th>Domain</th><th>Score (out of 5)</th></tr></thead>
            <tbody>
              {chartData.map(({ subject, value }) => (
                <tr key={subject}><td>{subject}</td><td>{value}</td></tr>
              ))}
            </tbody>
          </table>
        </TsCard>

        {/* Upgrade card (free tier only) */}
        {!isPaid && (
          <div
            className="rounded-xl bg-white p-6"
            style={{ border: "2px solid var(--ts-teal)" }}
          >
            <h3 className="text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              See how you compare to 329 other Nairobi digital SMEs
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--ts-text-body)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              <li>✓ Full domain-level commentary and action plan</li>
              <li>✓ Percentile ranking vs. Nairobi SME benchmark</li>
              <li>✓ Prioritised roadmap with 90-day quick wins</li>
            </ul>
            <div className="mt-5">
              <TsButton variant="primary" onClick={() => navigate({ to: "/surveys/report/upgrade" as never })}>
                Unlock full report — KSh 2,500
              </TsButton>
              <p className="mt-2 text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                M-PESA only · instant access after payment
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
