import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ClipboardList, BarChart3, Smartphone, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Tetrasec Cybersecurity Survey" },
      { name: "description", content: "Learn how the Tetrasec cybersecurity maturity assessment works, what you get, and how your data is protected." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    icon: ClipboardList,
    number: "01",
    title: "Check your eligibility",
    description:
      "Answer a few quick questions to confirm your business qualifies. The study targets digital-services SMEs operating in Nairobi County — software, fintech, e-commerce, cloud, and similar sectors.",
  },
  {
    icon: Shield,
    number: "02",
    title: "Complete the assessment",
    description:
      "Work through four short sections covering your organisation's security governance, risk practices, access controls, and more. Most participants finish in 10–15 minutes.",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Get your maturity score",
    description:
      "Instantly see your cybersecurity maturity rating across six domains — from Governance & Policy to Incident Response — benchmarked against other Nairobi digital SMEs.",
  },
  {
    icon: Smartphone,
    number: "04",
    title: "Receive your M-Pesa reward",
    description:
      "Once you submit the final section, a KSh 50 reward is sent to the M-Pesa number you provided during eligibility. Your number is never linked to your survey responses.",
  },
];

const FAQS = [
  {
    q: "Who is this survey for?",
    a: "Digital-services SMEs registered and operating in Nairobi County — including software development, fintech, e-commerce, cloud services, digital marketing, and IT consultancy businesses. The respondent should be an owner, manager, or staff member with IT oversight.",
  },
  {
    q: "How long does it take?",
    a: "Most participants complete the four sections in 10–15 minutes. You can pause and return at any time — your answers are saved in your browser as you go.",
  },
  {
    q: "Is my data anonymous?",
    a: "Yes. Your M-Pesa number is collected only to send your reward and is stored separately from your survey responses using a one-way hash. Researchers never see a link between your phone number and your answers.",
  },
  {
    q: "Can I complete it more than once?",
    a: "No. Each phone number may be used once to ensure the integrity of the research data.",
  },
  {
    q: "What happens to the results?",
    a: "Aggregated, anonymised findings will be published as part of an MSc research project studying cybersecurity maturity among Nairobi's digital SMEs. No individual responses are ever published.",
  },
  {
    q: "Is participation mandatory?",
    a: "No. Participation is entirely voluntary. You may withdraw at any time before submitting the final section without any consequence.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Tetrasec Solutions</div>
              <div className="text-xs text-muted-foreground">Cybersecurity for Kenyan SMEs</div>
            </div>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14 sm:py-20">

        {/* Hero */}
        <section className="text-center mb-16">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-success">
            Free · 15 minutes · Earn KSh 50
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How the assessment works
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            A four-step process that takes 10–15 minutes and gives you an instant cybersecurity maturity score for your business.
          </p>
        </section>

        {/* Steps */}
        <section className="mb-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, number, title, description }) => (
              <div key={number} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30 tabular-nums">{number}</span>
                </div>
                <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section className="mb-16 rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">What you get from the assessment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "A maturity score across 6 cybersecurity domains",
              "Your tier — from Initial to Optimising",
              "Benchmarked against other Nairobi digital SMEs",
              "Specific gaps and priority recommendations",
              "Free downloadable tools for your business",
              "KSh 50 M-Pesa reward on completion",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Data & privacy */}
        <section className="mb-16 rounded-2xl border border-success/20 bg-success/5 p-8">
          <div className="flex items-start gap-4">
            <Lock className="mt-1 h-6 w-6 shrink-0 text-success" />
            <div>
              <h2 className="mb-2 text-base font-semibold text-foreground">Your privacy is protected</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This study is conducted under Kenya's Data Protection Act 2019. Your M-Pesa number is stored using a one-way hash — it is never linked to your survey answers. All published results are aggregated and fully anonymous.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border bg-card p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Ready to get your score?</h2>
          <p className="mb-6 text-sm text-muted-foreground">Free, anonymous, and takes under 15 minutes.</p>
          <Link
            to="/screening"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-100"
          >
            Start the assessment <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="mt-16 border-t bg-card/40 py-6 text-center text-xs text-muted-foreground">
        © 2026 TetraSec Solutions Ltd · Nairobi, Kenya ·{" "}
        <Link to="/" className="hover:text-foreground">tetrasec.co.ke</Link>
      </footer>
    </div>
  );
}
