import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetStats,
  adminListResponses,
  adminExportCsv,
  checkIsAdmin,
} from "@/lib/survey/admin.functions";
import { TARGET_RESPONSES } from "@/lib/survey/schema";
import { LogOut, Download, ShieldAlert } from "lucide-react";
import { ResponseDetail } from "@/components/admin/ResponseDetail";

const supabase = { auth: { signOut: async () => {} } };

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    queryKey: ["admin-list"],
    queryFn: () => list({ data: { limit: 200 } }),
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
            Your account has not been granted admin access.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
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

  const s = statsQ.data;
  const completed = s?.completed ?? 0;
  const pct = Math.min(100, Math.round((completed / TARGET_RESPONSES) * 100));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Researcher dashboard</h1>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
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

        <div className="mt-8 flex justify-end">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b bg-secondary/50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Responses ({(listQ.data ?? []).length})
            </span>
            <span className="text-[11px] text-muted-foreground">Click a row to view full details</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Sector</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {(listQ.data ?? []).map((r) => (
                <tr
                  key={r.id}
                  className="border-t cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => setSelectedId(r.id)}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium">
                    {r.business_name ?? <span className="text-muted-foreground italic">Unknown</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.sector ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.completed ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    ) : r.screened_in ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Partial
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Screened
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground group-hover:text-foreground">
                    →
                  </td>
                </tr>
              ))}
              {(listQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No responses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {selectedId && (
        <ResponseDetail id={selectedId} onClose={() => setSelectedId(null)} />
      )}
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
