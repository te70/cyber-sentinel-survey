import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, GraduationCap, Mail, Sparkles, TrendingUp } from "lucide-react";
import { AlitaLogo } from "@/components/alita/Logo";
import { PATTERN_IDS } from "@/components/alita/patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alita — Cybersecurity Maturity Assessment for Nairobi SMEs" },
      {
        name: "description",
        content:
          "A free, plain-language cybersecurity check-up for Nairobi digital SMEs — grounded in NIST CSF and Kenya's Data Protection Act.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <AlitaLogo markSize={32} />
          <div className="flex items-center gap-5">
            <Link
              to="/tools/invoice"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Free tools
            </Link>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <section className="relative overflow-hidden text-center">
          <svg
            className="pointer-events-none absolute inset-0 -z-10"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.diamond})`} opacity="0.1" />
          </svg>

          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Free · takes about 15 minutes
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            A cybersecurity check-up built for businesses like yours
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            No jargon, no assumptions about what you already have in place. Answer a few questions
            in your own words and see exactly where to focus next.
          </p>

          <div className="mt-8">
            <Button asChild size="lg" className="px-8 py-6 text-base">
              <Link to="/alita/start">Start my assessment</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-16 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <Compass className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">Speaks your language</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Questions are written for how your business actually runs — whether that's WhatsApp
              and Instagram or your own custom systems.
            </p>
          </Card>
          <Card className="p-5">
            <TrendingUp className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">Six areas, one clear picture</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              See where you're strong and where to focus — not just a single score that hides the
              details.
            </p>
          </Card>
          <Card className="p-5">
            <Sparkles className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">A next step, not a lecture</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Get a ranked, practical list of what to do next — not a wall of technical
              recommendations.
            </p>
          </Card>
        </section>

        <svg
          className="mx-auto mt-16 block h-4 max-w-2xl"
          width="100%"
          height="16"
          aria-hidden="true"
        >
          <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.zigzag})`} opacity="0.6" />
        </svg>

        <section className="mx-auto mt-6 max-w-2xl">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">About me</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  I'm Tevin Njenga, a graduate researcher at United States International
                  University-Africa (USIU-A). Alita is the tool built for my MSc thesis, which
                  studies how to make cybersecurity maturity assessment practical and accessible for
                  digital SMEs in Nairobi — grounded in the NIST Cybersecurity Framework and Kenya's
                  Data Protection Act, 2019. If you complete an assessment and consent to research
                  participation, your anonymised, aggregated data helps this research directly.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section id="contact" className="mx-auto mt-6 max-w-2xl">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                <Mail className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Contact</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Questions about this research, or about your own data? Reach out directly.
                </p>
                <a
                  href="mailto:njengat1@usiu.ac.ke"
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  njengat1@usiu.ac.ke
                </a>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-4xl px-5 text-center text-xs text-muted-foreground">
          <p>
            Alita is a research tool built at United States International University-Africa
            (USIU-A), grounded in the NIST Cybersecurity Framework and Kenya's Data Protection Act,
            2019.
          </p>
        </div>
      </footer>
    </div>
  );
}
