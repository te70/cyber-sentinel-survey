import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListResponses } from "@/lib/survey/admin.functions";
import { TsEmptyState } from "@/components/surveys/ui/TsEmptyState";
import { TsBadge } from "@/components/surveys/ui/TsBadge";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/surveys-admin/payouts")({
  head: () => ({ meta: [{ title: "Payout log — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PayoutsPage,
});

function statusBadgeVariant(status: string) {
  if (status === "sent")      return "verified"  as const;
  if (status === "failed")    return "rejected"  as const;
  return "pending" as const;
}

function PayoutsPage() {
  const list = useServerFn(adminListResponses);
  const listQ = useQuery({
    queryKey: ["ts-admin-payouts"],
    queryFn: () => list({ data: { limit: 500 } }),
  });

  const rows = (listQ.data ?? []).filter((r) => r.completed);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--ts-font-display)" }}>Payout log</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {rows.length === 0 ? (
          <TsEmptyState icon={FileText} headline="No payouts yet" body="Completed responses will appear here." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-[var(--ts-text-secondary)]">
                <tr>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{r.masked_phone}</td>
                    <td className="px-3 py-2 text-xs">KSh 50</td>
                    <td className="px-3 py-2">
                      <TsBadge variant={statusBadgeVariant(r.payout_status ?? "pending")} label={r.payout_status?.toUpperCase()} />
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--ts-text-secondary)]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
