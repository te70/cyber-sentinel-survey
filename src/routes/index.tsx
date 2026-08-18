import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Sparkles, TrendingUp } from "lucide-react";
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
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-extrabold text-foreground">Alita</span>
          </div>
          <Link to="/tools/invoice" className="text-sm text-muted-foreground hover:text-foreground">
            Free tools
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <section className="text-center">
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
