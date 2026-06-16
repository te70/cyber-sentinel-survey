import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getCompletedCount } from "@/lib/survey/survey.functions";
import { TARGET_RESPONSES, REWARD_AMOUNT_KES } from "@/lib/survey/schema";
import { Shield, CheckCircle2, Users, Building2, Smartphone, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cybersecurity Maturity Survey — USIU-A Research" },
      {
        name: "description",
        content:
          "Help shape cybersecurity practice for Nairobi's digital SMEs. 10-minute survey, Ksh 100 M-Pesa reward on completion.",
      },
      { property: "og:title", content: "Cybersecurity Maturity Survey — USIU-A Research" },
      {
        property: "og:description",
        content:
          "Help shape cybersecurity practice for Nairobi's digital SMEs. 10-minute survey, Ksh 100 M-Pesa reward on completion.",
      },
    ],
  }),
  component: Landing,
});

function ConsentBanner({ onAgree }: { onAgree: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 px-4 backdrop-blur-sm">
      <div className="max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <Shield className="h-3.5 w-3.5" /> Ethics statement
        </div>
        <h2 className="text-xl font-semibold">Informed consent</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          This study has been approved by the USIU-A IRB. Participation is voluntary.
          Your responses are anonymous and used only for academic research. You may
          withdraw at any time before submitting the final section.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your M-Pesa number will be used <strong>only</strong> to deliver your
          Ksh {REWARD_AMOUNT_KES} reward and will never be linked to your responses.
        </p>
        <button
          onClick={onAgree}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          I Agree &amp; Continue
        </button>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [consented, setConsented] = useState(true);

  useEffect(() => {
    setConsented(localStorage.getItem("survey_consent") === "yes");
  }, []);

  const { data } = useQuery({
    queryKey: ["completed-count"],
    queryFn: () => getCompletedCount(),
    refetchInterval: 30_000,
  });
  const count = data?.count ?? 0;
  const full = count >= TARGET_RESPONSES;
  const pct = Math.min(100, Math.round((count / TARGET_RESPONSES) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {!consented && (
        <ConsentBanner
          onAgree={() => {
            localStorage.setItem("survey_consent", "yes");
            setConsented(true);
          }}
        />
      )}

      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">USIU-A Research</div>
              <div className="text-xs text-muted-foreground">MSc Information Security</div>
            </div>
          </div>
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <section className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" />
            Active research study — Ksh {REWARD_AMOUNT_KES} M-Pesa reward
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cybersecurity Maturity Assessment for{" "}
            <span className="text-success">Nairobi's digital SMEs</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            We're validating a cybersecurity maturity model purpose-built for digital-services
            SMEs in Nairobi. Your 10-minute, anonymous response helps shape practical
            cybersecurity guidance for businesses like yours.
          </p>
        </section>

        {/* Live counter */}
        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-medium text-muted-foreground">Responses collected</div>
            <div className="text-sm tabular-nums text-muted-foreground">
              <span className="text-2xl font-bold text-foreground">{count}</span>{" "}
              <span>/ {TARGET_RESPONSES}</span>
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${pct}%` }}
              aria-label={`${pct}% complete`}
            />
          </div>
          <div className="mt-2 text-right text-xs text-muted-foreground">{pct}% of target</div>
        </section>

        {/* Eligibility */}
        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="text-xl font-semibold">Who can participate?</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Building2, label: "A digital-services SME registered in Nairobi County" },
              { icon: Users, label: "Owner, manager, or IT / cybersecurity staff" },
              { icon: Smartphone, label: "One response per person — verified by phone" },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-xl border bg-card p-4 text-sm text-foreground"
              >
                <item.icon className="mb-2 h-5 w-5 text-success" />
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center">
          {full ? (
            <div className="mx-auto max-w-md rounded-xl border-2 border-success/40 bg-success/5 p-6">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <h3 className="mt-2 text-lg font-semibold">Survey Closed — Target Reached</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We've collected all {TARGET_RESPONSES} responses needed for this study.
                Thank you for your interest.
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!consented) {
                  setConsented(false);
                  return;
                }
                navigate({ to: "/screening" });
              }}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-100"
            >
              Start Survey →
            </button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            ~10 minutes · Anonymous · Ksh {REWARD_AMOUNT_KES} sent on completion
          </p>
        </section>

        <footer className="mt-20 border-t pt-6 text-center text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Tevin Njenga (ID 674485) · njengat1@usiu.ac.ke · USIU-A
          </div>
        </footer>
      </main>
    </div>
  );
}
