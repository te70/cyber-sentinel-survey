import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TsBadge } from "@/components/surveys/ui/TsBadge";
import { TsButton } from "@/components/surveys/ui/TsButton";
import { TsCard } from "@/components/surveys/ui/TsCard";
import {
  FileText, ShieldCheck, FileSignature, Calculator,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/surveys/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Tier = "Initial" | "Developing" | "Defined" | "Managed" | "Optimising";

function getTier(score: number): { tier: Tier; color: string } {
  if (score < 2)  return { tier: "Initial",    color: "var(--ts-error)" };
  if (score < 3)  return { tier: "Developing", color: "var(--ts-warning)" };
  if (score < 4)  return { tier: "Defined",    color: "var(--ts-info)" };
  if (score < 4.5)return { tier: "Managed",    color: "var(--ts-success)" };
  return           { tier: "Optimising",        color: "var(--ts-teal)" };
}

const TOOLS = [
  { icon: FileText,       name: "Invoice generator",      desc: "Create professional invoices",       href: "/tools/invoice",    pro: false },
  { icon: ShieldCheck,    name: "DPA compliance checker", desc: "Kenya Data Protection Act audit",    href: "/tools/compliance", pro: true  },
  { icon: FileSignature,  name: "Contract generator",     desc: "Standard service agreements",        href: "/tools/contracts",  pro: true  },
  { icon: Calculator,     name: "VAT calculator",         desc: "Kenyan VAT made simple",             href: "/tools/tax",        pro: false },
  { icon: BarChart3,      name: "Maturity report",        desc: "Cybersecurity maturity deep-dive",   href: "/surveys/report",   pro: true  },
] as const;

function ScoreRing({ score, tier, color, isPaid }: { score: number; tier: Tier; color: string; isPaid: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="ts-score-ring flex h-[180px] w-[180px] flex-col items-center justify-center"
        style={{ border: "3px solid var(--ts-teal)" }}
        aria-label={`Maturity score ${score} out of 5, tier ${tier}`}
      >
        <span
          className="text-[64px] font-bold leading-none text-[var(--ts-text-primary)]"
          style={{ fontFamily: "var(--ts-font-display)" }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          out of 5.0
        </span>
      </div>
      <span
        className="text-sm font-semibold"
        style={{ fontFamily: "var(--ts-font-display)", color }}
      >
        {tier}
      </span>
      <Link to={isPaid ? "/surveys/report" : ("/surveys/report/upgrade" as never)}>
        <TsButton variant="primary">
          {isPaid ? "View full report →" : "Unlock full report — KSh 2,500"}
        </TsButton>
      </Link>
    </div>
  );
}

function SkeletonRing() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="ts-skeleton h-[180px] w-[180px] rounded-full" />
      <div className="ts-skeleton h-4 w-24 rounded" />
      <div className="ts-skeleton h-10 w-40 rounded-full" />
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // In production these come from the verified response record
  const [verified] = useState<boolean>(false);
  const [score] = useState<number | null>(null);
  const [businessName] = useState("Your Business");
  const [isPaid] = useState(false);

  useEffect(() => {
    // Check session — redirect to OTP if not authenticated
    const hasSession = !!document.cookie.includes("survey_session");
    if (!hasSession) { navigate({ to: "/surveys/otp" }); return; }
    setLoading(false);
  }, [navigate]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const tierInfo = score !== null ? getTier(score) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ts-surface)" }}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:flex lg:gap-8">
        {/* Left column */}
        <div className="lg:w-64 lg:shrink-0">
          {/* Greeting card */}
          <TsCard className="mb-6">
            <p className="text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              {greeting},
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              {businessName}
            </h1>
            <div className="mt-2">
              <TsBadge variant={verified ? "verified" : "pending"} />
            </div>
            {verified && (
              <Link to="/surveys/report">
                <TsButton variant="ghost" className="mt-3 text-sm">Your maturity report is ready →</TsButton>
              </Link>
            )}
          </TsCard>

          {/* Score card */}
          <TsCard>
            {loading ? (
              <SkeletonRing />
            ) : verified && score !== null && tierInfo ? (
              <ScoreRing score={score} tier={tierInfo.tier} color={tierInfo.color} isPaid={isPaid} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <ShieldCheck className="h-10 w-10 text-[var(--ts-teal)]" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                  Your report is being prepared
                </p>
                <p className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                  We'll notify you within 48 hours once verified.
                </p>
              </div>
            )}
          </TsCard>
        </div>

        {/* Right column — tools */}
        <div className="mt-6 flex-1 lg:mt-0">
          <h2 className="mb-4 text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
            Your tools
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TOOLS.map((tool) => (
              <TsCard key={tool.name} className="relative flex flex-col gap-3">
                {tool.pro && (
                  <div className="absolute right-3 top-3">
                    <TsBadge variant="pro" />
                  </div>
                )}
                <tool.icon className="h-8 w-8 text-[var(--ts-teal)]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                    {tool.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-auto">
                  <Link to={tool.href as never}>
                    <TsButton variant="secondary" className="text-xs" style={{ minHeight: "36px", padding: "6px 14px" } as React.CSSProperties}>
                      Open
                    </TsButton>
                  </Link>
                </div>
              </TsCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
