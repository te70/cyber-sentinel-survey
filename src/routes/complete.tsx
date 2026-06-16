import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, AlertCircle } from "lucide-react";
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
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
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
          href="mailto:njengat1@usiu.ac.ke"
          className="mt-6 inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" /> njengat1@usiu.ac.ke
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
    </div>
  );
}
