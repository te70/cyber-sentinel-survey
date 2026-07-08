import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetStats, checkIsAdmin } from "@/lib/survey/admin.functions";
import { TARGET_RESPONSES } from "@/lib/survey/schema";
import { TsEmptyState } from "@/components/surveys/ui/TsEmptyState";
import { ShieldAlert } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/surveys-admin/")({
  head: () => ({ meta: [{ title: "Admin — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const navigate = useNavigate();
  const check = useServerFn(checkIsAdmin);
  const getStats = useServerFn(adminGetStats);
  const [role, setRole] = useState<"admin" | "reviewer" | null | false>(null);

  useEffect(() => {
    check()
      .then((r) => setRole(r.isAdmin ? "admin" : false))
      .catch(() => setRole(false));
  }, [check]);

  const statsQ = useQuery({
    queryKey: ["ts-admin-stats"],
    queryFn: () => getStats(),
    enabled: !!role,
  });

  if (role === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-[var(--ts-text-secondary)]">Checking access…</div>;
  }

  if (role === false) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <TsEmptyState
          icon={ShieldAlert}
          headline="Not authorised"
          body="Your account does not have admin access to this dashboard."
          ctaLabel="Go home"
          ctaHref="/"
        />
      </div>
    );
  }

  const s = statsQ.data;
  const completed = s?.completed ?? 0;
  const pct = Math.min(100, Math.round((completed / TARGET_RESPONSES) * 100));
  const partial = s?.partial ?? 0;
  const screened = s?.screened ?? 0;
  const total = s?.total ?? 0;

  const funnel = [
    { label: "Submitted",   value: total,     pct: total ? 100 : 0 },
    { label: "Screened in", value: screened,  pct: total ? Math.round((screened / total) * 100) : 0 },
    { label: "Partial",     value: partial,   pct: total ? Math.round((partial / total) * 100) : 0 },
    { label: "Completed",   value: completed, pct: total ? Math.round((completed / total) * 100) : 0 },
  ];

  // Placeholder sparkline — replace with real daily data from DB
  const sparkline = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    count: Math.floor(Math.random() * 20),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--ts-font-display)" }}>
            TetraSec Surveys — Admin
          </h1>
          <div className="flex items-center gap-4 text-xs text-[var(--ts-text-secondary)]">
            <Link to="/surveys-admin/queue" className="hover:text-[var(--ts-teal)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              Review queue
            </Link>
            <Link to="/surveys-admin/payouts" className="hover:text-[var(--ts-teal)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              Payouts
            </Link>
            <Link to="/surveys-admin/export" className="hover:text-[var(--ts-teal)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              Export
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Target counter */}
        <div className="text-center">
          <p
            className="text-[48px] font-bold tabular-nums text-[var(--ts-text-primary)]"
            style={{ fontFamily: "var(--ts-font-display)" }}
          >
            {completed} / {TARGET_RESPONSES}
          </p>
          <p className="text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            verified responses
          </p>
          <div className="mx-auto mt-3 h-2 max-w-md overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-[var(--ts-teal)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Funnel */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {funnel.map(({ label, value, pct: p }) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                {value}
              </p>
              <p className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{p}% of total</p>
            </div>
          ))}
        </div>

        {/* Payout breakdown */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["sent", "submitted", "failed", "pending"] as const).map((k) => (
            <div key={k} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-[var(--ts-text-secondary)] capitalize" style={{ fontFamily: "var(--ts-font-body)" }}>Payout: {k}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--ts-font-display)" }}>
                {s?.payouts?.[k] ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        <div className="rounded-xl border bg-card p-6">
          <p className="mb-4 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
            Daily submissions (last 14 days)
          </p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--ts-text-secondary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ts-text-secondary)" }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--ts-teal)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
