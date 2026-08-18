import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Plus, Trash2, Printer } from "lucide-react";

export const Route = createFileRoute("/tools/invoice")({
  head: () => ({ meta: [{ title: "Invoice Generator — Alita Tools" }] }),
  component: InvoiceGenerator,
});

interface LineItem {
  id: number;
  description: string;
  qty: number;
  unitPrice: number;
}

interface InvoiceData {
  invoiceNo: string;
  date: string;
  dueDate: string;
  fromName: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  fromKraPIN: string;
  toName: string;
  toAddress: string;
  toEmail: string;
  vatExempt: boolean;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);
const due30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const BLANK: InvoiceData = {
  invoiceNo: "INV-001",
  date: today,
  dueDate: due30,
  fromName: "",
  fromAddress: "",
  fromEmail: "",
  fromPhone: "",
  fromKraPIN: "",
  toName: "",
  toAddress: "",
  toEmail: "",
  vatExempt: false,
  notes: "Payment via M-Pesa, bank transfer, or cheque payable to the above.",
};

let nextId = 2;
const BLANK_ITEMS: LineItem[] = [{ id: 1, description: "", qty: 1, unitPrice: 0 }];

function fmt(n: number) {
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InvoiceGenerator() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [data, setData] = useState<InvoiceData>(BLANK);
  const [items, setItems] = useState<LineItem[]>(BLANK_ITEMS);
  const printRef = useRef<HTMLDivElement>(null);

  function set(k: keyof InvoiceData, v: string | boolean) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function updateItem(id: number, k: keyof LineItem, v: string | number) {
    setItems((it) => it.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  }

  function addItem() {
    setItems((it) => [...it, { id: nextId++, description: "", qty: 1, unitPrice: 0 }]);
  }

  function removeItem(id: number) {
    if (items.length === 1) return;
    setItems((it) => it.filter((i) => i.id !== id));
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vatAmount = data.vatExempt ? 0 : subtotal * 0.16;
  const total = subtotal + vatAmount;

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;

    const styles = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join("\n");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${data.invoiceNo}</title><style>${styles}</style></head><body style="margin:0;padding:32px;background:white;">${el.outerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }

  if (step === "preview") {
    return (
      <ToolShell title="Invoice Generator" description="Preview and print your invoice.">
        <div className="mb-4 flex gap-3 print:hidden">
          <button
            onClick={() => setStep("form")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Edit invoice
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#1A2F42] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1A2F42]/90"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>

        <div ref={printRef} className="rounded-2xl border bg-white p-8 shadow-sm">
          {/* Invoice header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1A2F42]">INVOICE</h1>
              <p className="mt-1 text-sm text-slate-500">#{data.invoiceNo}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p><span className="text-slate-400">Date:</span> {data.date}</p>
              <p><span className="text-slate-400">Due:</span> {data.dueDate}</p>
            </div>
          </div>

          <div className="my-6 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">From</p>
              <p className="font-semibold text-[#1A2F42]">{data.fromName || "—"}</p>
              {data.fromAddress && <p className="text-sm text-slate-500 whitespace-pre-line">{data.fromAddress}</p>}
              {data.fromEmail && <p className="text-sm text-slate-500">{data.fromEmail}</p>}
              {data.fromPhone && <p className="text-sm text-slate-500">{data.fromPhone}</p>}
              {data.fromKraPIN && <p className="text-sm text-slate-500">KRA PIN: {data.fromKraPIN}</p>}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
              <p className="font-semibold text-[#1A2F42]">{data.toName || "—"}</p>
              {data.toAddress && <p className="text-sm text-slate-500 whitespace-pre-line">{data.toAddress}</p>}
              {data.toEmail && <p className="text-sm text-slate-500">{data.toEmail}</p>}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2F42] text-left">
                <th className="pb-2 font-semibold text-[#1A2F42]">Description</th>
                <th className="pb-2 font-semibold text-[#1A2F42] text-center w-16">Qty</th>
                <th className="pb-2 font-semibold text-[#1A2F42] text-right w-28">Unit Price</th>
                <th className="pb-2 font-semibold text-[#1A2F42] text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-slate-700">{item.description || "—"}</td>
                  <td className="py-3 text-center text-slate-600">{item.qty}</td>
                  <td className="py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-[#1A2F42]">{fmt(item.qty * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {!data.vatExempt && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>VAT (16%)</span><span>{fmt(vatAmount)}</span>
                </div>
              )}
              {data.vatExempt && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>VAT</span><span>Exempt</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-[#1A2F42]">
                <span>Total</span><span>KSh {fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="mt-8 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{data.notes}</p>
            </div>
          )}

          <div className="mt-8 border-t pt-4 text-center text-xs text-slate-400">
            Generated by Alita · a USIU-A research tool
          </div>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell title="Invoice Generator" description="Create a professional invoice for your Kenyan digital business. Includes VAT at 16%.">
      <div className="space-y-6">

        {/* Invoice meta */}
        <Card title="Invoice details">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Invoice number">
              <input className={input} value={data.invoiceNo} onChange={(e) => set("invoiceNo", e.target.value)} />
            </Field>
            <Field label="Invoice date">
              <input type="date" className={input} value={data.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Due date">
              <input type="date" className={input} value={data.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* From */}
          <Card title="Your business">
            <div className="space-y-3">
              <Field label="Business name"><input className={input} placeholder="Acme Digital Ltd" value={data.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
              <Field label="Address"><textarea className={`${input} resize-none`} rows={2} placeholder="P.O. Box 12345, Nairobi" value={data.fromAddress} onChange={(e) => set("fromAddress", e.target.value)} /></Field>
              <Field label="Email"><input type="email" className={input} placeholder="hello@acme.co.ke" value={data.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} /></Field>
              <Field label="Phone"><input className={input} placeholder="+254 7XX XXX XXX" value={data.fromPhone} onChange={(e) => set("fromPhone", e.target.value)} /></Field>
              <Field label="KRA PIN (optional)"><input className={input} placeholder="A012345678B" value={data.fromKraPIN} onChange={(e) => set("fromKraPIN", e.target.value)} /></Field>
            </div>
          </Card>

          {/* To */}
          <Card title="Bill to (client)">
            <div className="space-y-3">
              <Field label="Client name / company"><input className={input} placeholder="Client Ltd" value={data.toName} onChange={(e) => set("toName", e.target.value)} /></Field>
              <Field label="Address"><textarea className={`${input} resize-none`} rows={2} placeholder="Client address" value={data.toAddress} onChange={(e) => set("toAddress", e.target.value)} /></Field>
              <Field label="Email"><input type="email" className={input} placeholder="accounts@client.co.ke" value={data.toEmail} onChange={(e) => set("toEmail", e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        {/* Line items */}
        <Card title="Line items">
          <div className="space-y-3">
            <div className="hidden grid-cols-[1fr_80px_120px_120px_40px] gap-3 sm:grid">
              {["Description", "Qty", "Unit price (KSh)", "Amount (KSh)", ""].map((h) => (
                <span key={h} className="text-xs font-semibold text-slate-400">{h}</span>
              ))}
            </div>
            {items.map((item) => (
              <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_120px_40px] sm:gap-3 sm:items-center">
                <input
                  className={input}
                  placeholder="Description of service or product"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                />
                <input
                  type="number" min="0" step="1"
                  className={`${input} text-center`}
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number" min="0" step="0.01"
                  className={`${input} text-right`}
                  value={item.unitPrice || ""}
                  placeholder="0.00"
                  onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                />
                <div className={`${input} text-right bg-slate-50 text-slate-600 font-medium`}>
                  {fmt(item.qty * item.unitPrice)}
                </div>
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                  className="flex items-center justify-center rounded-lg h-10 w-10 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-medium text-[#00A8A7] hover:text-[#1A2F42] transition-colors"
            >
              <Plus className="h-4 w-4" /> Add line item
            </button>
          </div>

          {/* Totals summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-56 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex items-center justify-between text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={data.vatExempt} onChange={(e) => set("vatExempt", e.target.checked)}
                    className="rounded border-slate-300 text-[#00C9C8] focus:ring-[#00C9C8]" />
                  <span className="text-xs">VAT exempt</span>
                </label>
                <span>{data.vatExempt ? "—" : fmt(vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-[#1A2F42]">
                <span>Total</span><span>KSh {fmt(total)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card title="Notes (optional)">
          <textarea
            className={`${input} resize-none`}
            rows={3}
            value={data.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Payment terms, bank details, M-Pesa number…"
          />
        </Card>

        <div className="flex justify-end">
          <button
            onClick={() => setStep("preview")}
            className="rounded-xl bg-[#1A2F42] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1A2F42]/90 transition-colors"
          >
            Preview invoice →
          </button>
        </div>
      </div>
    </ToolShell>
  );
}

const input = "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#1A2F42] outline-none focus:border-[#00C9C8] focus:ring-2 focus:ring-[#00C9C8]/20 bg-white";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-[#1A2F42]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
