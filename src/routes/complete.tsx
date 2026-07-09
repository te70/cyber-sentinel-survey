import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, AlertCircle, GraduationCap, BarChart3, Shield, ArrowRight, Star } from "lucide-react";
import { REWARD_AMOUNT_KES } from "@/lib/survey/schema";

export const Route = createFileRoute("/complete")({
  head: () => ({
    meta: [
      { title: "Thank you — Survey complete" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    masked: typeof s.masked === "string" ? s.masked : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
  }),
  component: Complete,
});

function Complete() {
  const { masked, status } = Route.useSearch();
  const failed = status === "failed";

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-background to-secondary px-6 py-12">
      <div className="flex w-full max-w-4xl flex-col items-stretch gap-6 lg:flex-row lg:items-start">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm lg:max-w-md">
        {failed ? (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Response recorded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your response has been recorded successfully. Our team will manually process
              your Ksh {REWARD_AMOUNT_KES} reward within 24 hours.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Thank you for participating!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ksh {REWARD_AMOUNT_KES} has been sent to{" "}
              <span className="font-semibold text-foreground">{masked ?? "your M-Pesa number"}</span>.
              It may take a few minutes to arrive.
            </p>
          </>
        )}

        <div className="mt-6 rounded-lg border bg-secondary/40 p-4 text-left text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Your contribution matters</div>
          <p className="mt-1">
            Your response helps validate a cybersecurity maturity model designed specifically for
            Nairobi's digital SMEs. Aggregated, anonymous findings will be published as part of
            the MSc research.
          </p>
        </div>

        <a
          href="mailto:info@tetrasec.co.ke"
          className="mt-6 inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" /> info@tetrasec.co.ke
        </a>

        <div className="mt-6">
          <Link
            to="/"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Tetrasec Academy Ad */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#00C9C8]/40 shadow-lg lg:flex-1 lg:self-start">
        {/* Ad label */}
        <div className="flex items-center justify-between bg-[#1A2F42]/8 px-4 py-1.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Sponsored</span>
          <span className="text-[10px] text-muted-foreground">Tetrasec Solutions</span>
        </div>

        {/* Hero band */}
        <div className="bg-[#1A2F42] px-8 py-8">
          <div className="flex items-start gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#00C9C8]/15">
              <GraduationCap className="h-9 w-9 text-[#00C9C8]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00C9C8]">Tetrasec Academy</p>
              <h3 className="mt-1 text-2xl font-bold leading-tight text-white">Data Science<br />for Business</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-xs">A 6-week practical course for Nairobi SME owners — no coding background required.</p>
              <div className="mt-3 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#00C9C8] text-[#00C9C8]" />
                ))}
                <span className="ml-1.5 text-xs text-white/50">Kenya-focused</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card px-8 py-6 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Turn your everyday business data into confident decisions. Learn how to read trends, forecast cash flow, and protect your data — all with tools you already own.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: BarChart3, label: "6 modules" },
              { icon: Shield,    label: "DPA 2019" },
              { icon: GraduationCap, label: "Certificate" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border bg-secondary/40 py-4 px-2">
                <Icon className="mx-auto h-5 w-5 text-[#00C9C8]" />
                <p className="mt-1.5 text-xs font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {[
              "Spot your most profitable customers & products",
              "Forecast cash flow using Google Sheets",
              "Stay compliant with Kenya DPA 2019",
              "Present data to investors, banks, or your team",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href="https://www.tetrasec.co.ke/academy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-[#1A2F42] transition-transform hover:scale-[1.02] active:scale-100"
            style={{ backgroundColor: "#00C9C8" }}
          >
            Enrol now — first module free <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-center text-[10px] text-muted-foreground">
            <a href="https://www.tetrasec.co.ke/academy" target="_blank" rel="noopener noreferrer" className="hover:underline">
              www.tetrasec.co.ke/academy
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
