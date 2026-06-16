import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetStats,
  adminListResponses,
  adminExportCsv,
  adminRetryPayout,
  checkIsAdmin,
} from "@/lib/survey/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { TARGET_RESPONSES } from "@/lib/survey/schema";
import { LogOut, Download, RefreshCw, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin dashboard" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const check = useServerFn(checkIsAdmin);
  const stats = useServerFn(adminGetStats);
  const list = useServerFn(adminListResponses);
  const csv = useServerFn(adminExportCsv);
  const retry = useServerFn(adminRetryPayout);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    check()
      .then((r) => setIsAdmin(r.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [check]);

  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => stats(),
    enabled: !!isAdmin,
  });
  const listQ = useQuery({
    queryKey: ["admin-list", filter],
    queryFn: () => list({ data: { payoutStatus: filter || undefined, limit: 200 } }),
    enabled: !!isAdmin,
  });

  if (isAdmin === null) {
    return <div className="grid min-h-screen place-items-center text-sm">Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-2 text-lg font-semibold">Not authorised</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is signed in but has not been granted the admin role.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="mt-4 rounded-md border px-4 py-2 text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function onExport() {
    const r = await csv();
    const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onRetry(id: string) {
    await retry({ data: { responseId: id } });
    listQ.refetch();
    statsQ.refetch();
  }

  const s = statsQ.data;
  const completed = s?.completed ?? 0;
  const pct = Math.min(100, Math.round((completed / TARGET_RESPONSES) * 100));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Researcher dashboard</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-4">
          <Stat label="Completed" value={`${completed} / ${TARGET_RESPONSES}`} accent />
          <Stat label="Partial" value={`${s?.partial ?? 0}`} />
          <Stat label="Screened in" value={`${s?.screened ?? 0}`} />
          <Stat label="Total rows" value={`${s?.total ?? 0}`} />
        </section>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-success" style={{ width: `${pct}%` }} />
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          {(["sent", "submitted", "failed", "pending"] as const).map((k) => (
            <Stat key={k} label={`Payout: ${k}`} value={`${s?.payouts?.[k] ?? 0}`} />
          ))}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Filter payout</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="">All</option>
              <option value="sent">sent</option>
              <option value="submitted">submitted</option>
              <option value="failed">failed</option>
              <option value="pending">pending</option>
            </select>
          </div>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV (anonymised)
          </button>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Sector</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payout</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(listQ.data ?? []).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.masked_phone}</td>
                  <td className="px-3 py-2 text-xs">{r.sector ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.completed ? "✅ completed" : r.screened_in ? "📝 partial" : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={
                        r.payout_status === "sent"
                          ? "text-success"
                          : r.payout_status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {r.payout_status}
                    </span>
                    {r.payout_error && (
                      <div className="text-[10px] text-destructive/80">{r.payout_error}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.completed && r.payout_status !== "sent" && (
                      <button
                        onClick={() => onRetry(r.id)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px]"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(listQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No responses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${accent ? "border-success/40" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
