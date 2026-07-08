import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListResponses, adminRetryPayout } from "@/lib/survey/admin.functions";
import { TsEmptyState } from "@/components/surveys/ui/TsEmptyState";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/surveys-admin/queue")({
  head: () => ({ meta: [{ title: "Review queue — Admin" }, { name: "robots", content: "noindex" }] }),
  component: QueuePage,
});

function scoreColor(score: number | undefined) {
  if (score === undefined) return "var(--ts-border)";
  if (score >= 70) return "var(--ts-success)";
  if (score >= 40) return "var(--ts-warning)";
  return "var(--ts-error)";
}

function QueuePage() {
  const list = useServerFn(adminListResponses);
  const retry = useServerFn(adminRetryPayout);
  const [filter, setFilter] = useState("");
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["ts-admin-queue", filter],
    queryFn: () => list({ data: { payoutStatus: filter || undefined, limit: 200 } }),
  });

  async function onApprove(id: string) {
    setExitingIds((prev) => new Set(prev).add(id));
    await retry({ data: { responseId: id } });
    setTimeout(() => {
      listQ.refetch();
      setExitingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 300);
  }

  const rows = listQ.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--ts-font-display)" }}>Review queue</h1>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--ts-text-secondary)]" htmlFor="payout-filter">
              Filter payout
            </label>
            <select
              id="payout-filter"
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {rows.length === 0 && !listQ.isLoading ? (
          <TsEmptyState
            icon={CheckCircle}
            headline="All caught up"
            body="No submissions need review right now."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-[var(--ts-text-secondary)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Sector</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payout</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const exiting = exitingIds.has(r.id);
                  const riskScore = undefined; // wire from real data
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r.id === selected ? null : r.id)}
                      className="cursor-pointer border-t transition-all hover:bg-secondary/50"
                      style={{
                        borderLeft: `3px solid ${scoreColor(riskScore)}`,
                        opacity: exiting ? 0 : 1,
                        transform: exiting ? "translateX(20px)" : "none",
                        transition: "opacity 300ms ease, transform 300ms ease",
                      }}
                    >
                      <td className="px-3 py-2 text-xs text-[var(--ts-text-secondary)]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r.masked_phone}</td>
                      <td className="px-3 py-2 text-xs">{r.sector ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.completed ? "✅ completed" : r.screened_in ? "📝 partial" : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span style={{
                          color: r.payout_status === "sent" ? "var(--ts-success)" :
                                 r.payout_status === "failed" ? "var(--ts-error)" : "var(--ts-text-secondary)",
                        }}>
                          {r.payout_status}
                        </span>
                        {r.payout_error && (
                          <div className="text-[10px] text-[var(--ts-error)]">{r.payout_error}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.completed && r.payout_status !== "sent" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); onApprove(r.id); }}
                              className="rounded border border-[var(--ts-teal)] px-2 py-1 text-[11px] text-[var(--ts-teal)] hover:bg-[var(--ts-teal-ghost)]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border px-2 py-1 text-[11px] text-[var(--ts-error)] hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
