import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminExportCsv } from "@/lib/survey/admin.functions";
import { TsButton } from "@/components/surveys/ui/TsButton";
import { Download } from "lucide-react";
import { SECTOR_OPTIONS } from "@/lib/survey/schema";

export const Route = createFileRoute("/surveys-admin/export")({
  head: () => ({ meta: [{ title: "Export data — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ExportPage,
});

function ExportPage() {
  const csvFn = useServerFn(adminExportCsv);
  const [busy, setBusy] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");

  async function download() {
    setBusy(true);
    try {
      const r = await csvFn();
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tetrasec-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--ts-font-display)" }}>Export data</h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-10 space-y-6">
        <p className="text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          CSV export is anonymised — phone numbers are not included. Filters are applied server-side.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--ts-text-primary)]" htmlFor="date-from" style={{ fontFamily: "var(--ts-font-body)" }}>
              From date
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 rounded-lg border border-[var(--ts-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--ts-teal)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--ts-text-primary)]" htmlFor="date-to" style={{ fontFamily: "var(--ts-font-body)" }}>
              To date
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 rounded-lg border border-[var(--ts-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--ts-teal)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--ts-text-primary)]" htmlFor="sector-filter" style={{ fontFamily: "var(--ts-font-body)" }}>
              Sector
            </label>
            <select
              id="sector-filter"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="h-10 rounded-lg border border-[var(--ts-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--ts-teal)]"
            >
              <option value="">All sectors</option>
              {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--ts-text-primary)]" htmlFor="status-filter" style={{ fontFamily: "var(--ts-font-body)" }}>
              Verification status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-[var(--ts-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--ts-teal)]"
            >
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <TsButton variant="primary" loading={busy} onClick={download}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </TsButton>
      </main>
    </div>
  );
}
