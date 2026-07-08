import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Users, Building2, Smartphone } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Free Cybersecurity Assessment — Tetrasec Research" },
      {
        name: "description",
        content:
          "Take the Tetrasec maturity assessment built for Nairobi digital SMEs. Get your score, benchmark against 330 peers, earn KSh 50.",
      },
      { property: "og:title", content: "Free Cybersecurity Assessment — Tetrasec Research" },
      {
        property: "og:description",
        content:
          "Take the Tetrasec maturity assessment built for Nairobi digital SMEs. Get your score, benchmark against 330 peers, earn KSh 50.",
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
          Participation is voluntary. Your responses are anonymous and used only
          for research purposes. You may withdraw at any time before submitting
          the final section.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your M-Pesa number will be used <strong>only</strong> to deliver your
          Ksh 50 reward and will never be linked to your responses.
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

  function startSurvey() {
    if (!consented) {
      setConsented(false);
      return;
    }
    navigate({ to: "/screening" });
  }

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

      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Tetrasec Solutions</div>
              <div className="text-xs text-muted-foreground">Cybersecurity for Kenyan SMEs</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-20">

        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-success">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" />
            Free cybersecurity assessment for Kenyan SMEs
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            90% of Kenyan businesses have been attacked.{" "}
            <span className="text-success">Which side are you on?</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Get your score, benchmark against your peers and earn a reward for completing it.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={startSurvey}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-100"
            >
              Get my free score →
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Reward sent on completion
          </p>
        </section>

        {/* Eligibility */}
        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold">Who can participate?</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Building2, label: "A digital-services SME registered in Nairobi County" },
              { icon: Users,     label: "Owner, manager, or IT / cybersecurity staff" },
              { icon: Smartphone, label: "One response per person — verified by phone" },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-xl border bg-card p-4 text-sm text-foreground"
              >
                <item.icon className="mb-2 h-5 w-5 text-success" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter onStartSurvey={startSurvey} />
    </div>
  );
}

function SiteFooter({ onStartSurvey }: { onStartSurvey: () => void }) {
  const NAV = {
    Survey: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Eligibility",  href: "/screening" },
      { label: "Start survey", href: "#", action: onStartSurvey },
    ],
    "Free tools": [
      { label: "Invoice generator",      href: "/tools/invoice" },
      { label: "DPA compliance checker", href: "/tools/compliance" },
      { label: "Contract generator",     href: "/tools/contracts" },
      { label: "VAT calculator",         href: "/tools/tax" },
    ],
    Support: [
      { label: "FAQs",              href: "https://www.tetrasec.co.ke/about" },
      { label: "Contact us",        href: "https://www.tetrasec.co.ke/contact" },
      { label: "WhatsApp support",  href: "https://www.tetrasec.co.ke/contact" },
      { label: "Report an issue",   href: "https://www.tetrasec.co.ke/contact" },
    ],
  } as const;

  return (
    <footer style={{ backgroundColor: "var(--ts-navy)" }}>
      {/* Desktop 4-column grid */}
      <div className="mx-auto hidden max-w-6xl grid-cols-4 gap-10 px-8 py-14 lg:grid">
        {/* Col 1 — brand */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--ts-font-display)" }}>
              TetraSec
            </span>
            <span className="text-lg font-bold" style={{ fontFamily: "var(--ts-font-display)", color: "var(--ts-teal)" }}>
              Solutions
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60" style={{ fontFamily: "var(--ts-font-body)" }}>
            Helping Nairobi digital businesses understand and improve their cybersecurity posture.
          </p>
          <p className="mt-3 text-xs text-white/40" style={{ fontFamily: "var(--ts-font-body)" }}>
            Rewards paid via M-PESA · Nairobi, Kenya
          </p>
          <div className="my-4 border-t border-white/10" />
          <p className="text-xs text-white/40" style={{ fontFamily: "var(--ts-font-body)" }}>Part of TetraSec Solutions</p>
          <a
            href="https://tetrasec.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-xs text-white/60 hover:text-white"
            style={{ fontFamily: "var(--ts-font-body)" }}
          >
            → tetrasec.co.ke
          </a>
        </div>

        {/* Cols 2–4 — nav */}
        {(Object.entries(NAV) as [string, { label: string; href: string; action?: () => void }[]][]).map(([heading, links]) => (
          <div key={heading}>
            <h3 className="mb-4 text-sm font-semibold text-white" style={{ fontFamily: "var(--ts-font-display)" }}>
              {heading}
            </h3>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  {link.action ? (
                    <button
                      onClick={link.action}
                      className="text-sm text-white/60 hover:text-white"
                      style={{ fontFamily: "var(--ts-font-body)" }}
                    >
                      {link.label}
                    </button>
                  ) : link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 hover:text-white"
                      style={{ fontFamily: "var(--ts-font-body)" }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href as never}
                      className="text-sm text-white/60 hover:text-white"
                      style={{ fontFamily: "var(--ts-font-body)" }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              {heading === "Support" && (
                <li className="pt-3">
                  <button
                    onClick={onStartSurvey}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--ts-teal)", fontFamily: "var(--ts-font-body)" }}
                  >
                    Earn reward →
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Desktop bottom bar */}
      <div
        className="hidden border-t lg:block"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto max-w-6xl px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40" style={{ fontFamily: "var(--ts-font-body)" }}>
            <span>© 2026 TetraSec Solutions Ltd. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white/70">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white/70">Terms of Use</a>
              <span>·</span>
              <a href="#" className="hover:text-white/70">Data Protection</a>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/30" style={{ fontFamily: "var(--ts-font-body)" }}>
            Data collected under Kenya Data Protection Act 2019. Survey responses are anonymised before analysis.
          </p>
        </div>
      </div>

      {/* Mobile footer — stacked, minimal */}
      <div className="px-6 py-10 text-center lg:hidden">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-base font-bold text-white" style={{ fontFamily: "var(--ts-font-display)" }}>TetraSec</span>
          <span className="text-base font-bold" style={{ fontFamily: "var(--ts-font-display)", color: "var(--ts-teal)" }}>Solutions</span>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-white/50" style={{ fontFamily: "var(--ts-font-body)" }}>
          <a href="#" className="hover:text-white/80">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-white/80">Terms</a>
          <span>·</span>
          <a href="#" className="hover:text-white/80">Data Protection</a>
          <span>·</span>
          <a href="#" className="hover:text-white/80">Contact</a>
        </div>
        <p className="mt-3 text-xs text-white/30" style={{ fontFamily: "var(--ts-font-body)" }}>
          © 2026 TetraSec Solutions Ltd · Nairobi, Kenya · Rewards via M-PESA
        </p>
      </div>
    </footer>
  );
}
