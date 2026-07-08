import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";

export const Route = createFileRoute("/tools/tax")({
  head: () => ({ meta: [{ title: "VAT Calculator — Tetrasec Tools" }] }),
  component: VatCalculator,
});

const VAT_RATE = 0.16;

const PRESETS = [1000, 5000, 10000, 50000, 100000, 500000];

function fmt(n: number) {
  return "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function VatCalculator() {
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");

  const amount = parseFloat(raw.replace(/,/g, "")) || 0;

  const net   = mode === "add" ? amount : amount / (1 + VAT_RATE);
  const vat   = net * VAT_RATE;
  const gross = net + vat;

  const hasValue = amount > 0;

  return (
    <ToolShell
      title="VAT Calculator"
      description="Kenya VAT is 16%. Calculate the VAT amount on any price, or strip VAT from a VAT-inclusive total."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl border p-1 bg-slate-50">
            {(["add", "remove"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === m
                    ? "bg-[#1A2F42] text-white shadow"
                    : "text-slate-500 hover:text-[#1A2F42]",
                ].join(" ")}
              >
                {m === "add" ? "Add VAT to price" : "Remove VAT from price"}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-[#1A2F42] mb-1.5">
            {mode === "add" ? "Price before VAT (KSh)" : "VAT-inclusive price (KSh)"}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              KSh
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="0.00"
              className="h-14 w-full rounded-xl border border-slate-200 pl-14 pr-4 text-xl font-semibold text-[#1A2F42] outline-none focus:border-[#00C9C8] focus:ring-2 focus:ring-[#00C9C8]/20"
            />
          </div>

          {/* Quick presets */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-slate-400">Quick amounts</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRaw(String(p))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#00C9C8] hover:text-[#1A2F42] transition-colors"
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold text-slate-500 uppercase tracking-wide">Breakdown</h2>
          <div className="space-y-4">
            <ResultRow label="Net amount (excl. VAT)" value={hasValue ? fmt(net) : "—"} />
            <ResultRow label="VAT @ 16%" value={hasValue ? fmt(vat) : "—"} highlight />
            <div className="my-2 border-t border-dashed" />
            <ResultRow label="Total (incl. VAT)" value={hasValue ? fmt(gross) : "—"} total />
          </div>

          {hasValue && (
            <div className="mt-6 rounded-xl bg-[#00C9C8]/8 border border-[#00C9C8]/20 p-4 text-sm text-[#1A2F42]">
              <p className="font-medium">VAT on your invoice</p>
              <p className="mt-1 text-slate-500 text-xs">
                Net: <strong className="text-[#1A2F42]">{fmt(net)}</strong> +{" "}
                VAT: <strong className="text-[#1A2F42]">{fmt(vat)}</strong> ={" "}
                Total: <strong className="text-[#1A2F42]">{fmt(gross)}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reference table */}
      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1A2F42]">Quick reference — common amounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold text-slate-500">
                <th className="pb-2 font-semibold">Net price</th>
                <th className="pb-2 font-semibold">VAT (16%)</th>
                <th className="pb-2 font-semibold">Total (incl. VAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[500, 1000, 2500, 5000, 10000, 25000, 50000, 100000].map((n) => (
                <tr key={n} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 text-slate-700">{n.toLocaleString()}</td>
                  <td className="py-2 text-[#00A8A7] font-medium">{(n * 0.16).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 font-semibold text-[#1A2F42]">{(n * 1.16).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">Standard VAT rate in Kenya: 16% (Finance Act 2023). Zero-rated and exempt supplies apply differently.</p>
      </div>
    </ToolShell>
  );
}

function ResultRow({ label, value, highlight, total }: { label: string; value: string; highlight?: boolean; total?: boolean }) {
  return (
    <div className={["flex items-center justify-between", total ? "pt-1" : ""].join(" ")}>
      <span className={["text-sm", total ? "font-semibold text-[#1A2F42]" : "text-slate-500"].join(" ")}>{label}</span>
      <span className={[
        "font-semibold tabular-nums",
        total ? "text-lg text-[#1A2F42]" : highlight ? "text-[#00A8A7]" : "text-[#1A2F42]",
      ].join(" ")}>{value}</span>
    </div>
  );
}
