import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Printer, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/tools/contracts")({
  head: () => ({ meta: [{ title: "Contract Generator — Alita Tools" }] }),
  component: ContractGenerator,
});

type ContractType = "nda" | "service" | "freelance";

interface ContractFields {
  partyA: string;
  partyAAddress: string;
  partyB: string;
  partyBAddress: string;
  date: string;
  // Service / Freelance specific
  serviceDescription: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  amount: string;
  paymentTerms: string;
  // NDA specific
  ndaPurpose: string;
  ndaDuration: string;
}

const today = new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

const BLANK: ContractFields = {
  partyA: "", partyAAddress: "",
  partyB: "", partyBAddress: "",
  date: today,
  serviceDescription: "",
  deliverables: "",
  startDate: "",
  endDate: "",
  amount: "",
  paymentTerms: "50% upfront, 50% on delivery",
  ndaPurpose: "exploring a potential business relationship",
  ndaDuration: "2 years",
};

const CONTRACT_TYPES: { id: ContractType; label: string; desc: string }[] = [
  { id: "nda", label: "Non-Disclosure Agreement (NDA)", desc: "Protect confidential business information shared between two parties." },
  { id: "service", label: "Service Agreement", desc: "Define the scope, timeline, and payment terms for a business service." },
  { id: "freelance", label: "Freelance / Consulting Contract", desc: "Formalise a short-term engagement with a freelancer or consultant." },
];

function fill(template: string, fields: ContractFields) {
  return template
    .replace(/\[PARTY_A\]/g, fields.partyA || "[Party A]")
    .replace(/\[PARTY_A_ADDRESS\]/g, fields.partyAAddress || "[Party A address]")
    .replace(/\[PARTY_B\]/g, fields.partyB || "[Party B]")
    .replace(/\[PARTY_B_ADDRESS\]/g, fields.partyBAddress || "[Party B address]")
    .replace(/\[DATE\]/g, fields.date)
    .replace(/\[SERVICE_DESCRIPTION\]/g, fields.serviceDescription || "[description of services]")
    .replace(/\[DELIVERABLES\]/g, fields.deliverables || "[list of deliverables]")
    .replace(/\[START_DATE\]/g, fields.startDate || "[start date]")
    .replace(/\[END_DATE\]/g, fields.endDate || "[end date]")
    .replace(/\[AMOUNT\]/g, fields.amount ? `KSh ${Number(fields.amount).toLocaleString()}` : "[amount]")
    .replace(/\[PAYMENT_TERMS\]/g, fields.paymentTerms || "[payment terms]")
    .replace(/\[NDA_PURPOSE\]/g, fields.ndaPurpose || "[purpose]")
    .replace(/\[NDA_DURATION\]/g, fields.ndaDuration || "[duration]");
}

const NDA_TEMPLATE = `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between:

[PARTY_A], located at [PARTY_A_ADDRESS] ("Disclosing Party"), and

[PARTY_B], located at [PARTY_B_ADDRESS] ("Receiving Party").

1. PURPOSE
The parties wish to explore [NDA_PURPOSE]. In connection with this purpose, the Disclosing Party may share certain confidential and proprietary information with the Receiving Party.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by the Disclosing Party, including but not limited to: business plans, financial data, customer lists, technical specifications, pricing, software, trade secrets, and any other information designated as confidential.

3. OBLIGATIONS
The Receiving Party agrees to:
(a) Hold the Confidential Information in strict confidence;
(b) Not disclose the Confidential Information to any third party without prior written consent;
(c) Use the Confidential Information solely for the stated purpose;
(d) Protect the Confidential Information with the same degree of care used to protect its own confidential information, but no less than reasonable care.

4. EXCLUSIONS
These obligations do not apply to information that:
(a) Was publicly known at the time of disclosure;
(b) Becomes publicly known through no breach by the Receiving Party;
(c) Was already known to the Receiving Party prior to disclosure;
(d) Is required to be disclosed by law or court order.

5. DURATION
This Agreement shall remain in effect for [NDA_DURATION] from the date of signing, unless terminated earlier by mutual written agreement.

6. RETURN OF INFORMATION
Upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information.

7. GOVERNING LAW
This Agreement shall be governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the Kenyan courts.

8. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties with respect to the subject matter herein.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

___________________________          ___________________________
[PARTY_A]                             [PARTY_B]
Date: ____________________           Date: ____________________`;

const SERVICE_TEMPLATE = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is made on [DATE] between:

[PARTY_A] of [PARTY_A_ADDRESS] ("Service Provider"), and

[PARTY_B] of [PARTY_B_ADDRESS] ("Client").

1. SERVICES
The Service Provider agrees to provide the following services to the Client:

[SERVICE_DESCRIPTION]

2. DELIVERABLES
The Service Provider will deliver the following:

[DELIVERABLES]

3. TIMELINE
Work shall commence on [START_DATE] and be completed by [END_DATE], subject to the Client providing necessary access, approvals, and information in a timely manner.

4. FEES AND PAYMENT
The Client agrees to pay the Service Provider [AMOUNT] for the services described above.
Payment terms: [PAYMENT_TERMS].

Payments shall be made via M-Pesa, bank transfer, or any other method agreed in writing. Late payments exceeding 14 days attract a 2% monthly interest charge.

5. INTELLECTUAL PROPERTY
Upon full payment, all deliverables created under this Agreement become the property of the Client. The Service Provider retains the right to reference the work in their portfolio unless otherwise agreed in writing.

6. CONFIDENTIALITY
Both parties agree to keep confidential any proprietary or sensitive information shared during this engagement.

7. WARRANTIES
The Service Provider warrants that the services will be performed professionally and that, to the best of their knowledge, the deliverables will not infringe any third-party intellectual property rights.

8. LIMITATION OF LIABILITY
The Service Provider's total liability under this Agreement shall not exceed the total fees paid by the Client.

9. TERMINATION
Either party may terminate this Agreement with 14 days' written notice. The Client shall pay for all work completed up to the date of termination.

10. GOVERNING LAW
This Agreement is governed by the laws of Kenya. Any disputes shall be resolved in the Kenyan courts.

IN WITNESS WHEREOF, the parties have signed this Agreement on the date stated above.

___________________________          ___________________________
[PARTY_A] (Service Provider)         [PARTY_B] (Client)
Date: ____________________           Date: ____________________`;

const FREELANCE_TEMPLATE = `FREELANCE / CONSULTING CONTRACT

This Freelance Contract ("Contract") is entered into on [DATE] between:

[PARTY_A] of [PARTY_A_ADDRESS] ("Freelancer" / "Consultant"), and

[PARTY_B] of [PARTY_B_ADDRESS] ("Client").

1. ENGAGEMENT
The Client engages the Freelancer on a non-exclusive, independent contractor basis to provide:

[SERVICE_DESCRIPTION]

2. DELIVERABLES AND TIMELINE
Deliverables: [DELIVERABLES]
Start date: [START_DATE]
Completion date: [END_DATE]

3. FEES
Fee: [AMOUNT]
Payment terms: [PAYMENT_TERMS]

4. INDEPENDENT CONTRACTOR STATUS
The Freelancer is an independent contractor, not an employee of the Client. The Freelancer is responsible for their own taxes, including income tax and any applicable withholding tax obligations under Kenyan law.

5. INTELLECTUAL PROPERTY
Work product created during this engagement shall, upon full payment, be assigned to the Client. The Freelancer retains the right to use the work in a portfolio unless agreed otherwise.

6. CONFIDENTIALITY
The Freelancer agrees not to disclose any confidential business information of the Client during or after the engagement.

7. NON-SOLICITATION
For a period of 6 months after this Contract ends, neither party shall directly solicit the other party's employees or clients without prior written consent.

8. REVISIONS
Up to [2] rounds of revisions are included in the agreed fee. Additional revisions will be billed at an agreed hourly rate.

9. TERMINATION
Either party may terminate this Contract with 7 days' written notice. The Client shall pay for all work completed to the date of termination.

10. DISPUTE RESOLUTION
The parties agree to first attempt to resolve any dispute through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to mediation or the jurisdiction of Kenyan courts.

11. GOVERNING LAW
This Contract is governed by the laws of Kenya.

IN WITNESS WHEREOF:

___________________________          ___________________________
[PARTY_A] (Freelancer)               [PARTY_B] (Client)
Date: ____________________           Date: ____________________`;

const TEMPLATES: Record<ContractType, string> = {
  nda: NDA_TEMPLATE,
  service: SERVICE_TEMPLATE,
  freelance: FREELANCE_TEMPLATE,
};

function ContractGenerator() {
  const [type, setType] = useState<ContractType | null>(null);
  const [fields, setFields] = useState<ContractFields>(BLANK);
  const [phase, setPhase] = useState<"select" | "form" | "preview">("select");

  function set(k: keyof ContractFields, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
  }

  const contractText = type ? fill(TEMPLATES[type], fields) : "";

  if (phase === "select") {
    return (
      <ToolShell title="Contract Generator" description="Choose a template, fill in the details, and print a ready-to-sign contract.">
        <div className="grid gap-4 sm:grid-cols-3">
          {CONTRACT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => { setType(ct.id); setPhase("form"); }}
              className="rounded-2xl border bg-white p-6 text-left shadow-sm hover:border-[#00C9C8] hover:shadow-md transition-all group"
            >
              <p className="font-semibold text-[#1A2F42] group-hover:text-[#00A8A7] transition-colors">{ct.label}</p>
              <p className="mt-2 text-sm text-slate-500">{ct.desc}</p>
              <span className="mt-4 inline-block text-xs font-semibold text-[#00A8A7]">Use this template →</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-400 text-center">
          These templates are for general guidance only. Have a Kenyan lawyer review any contract before signing for high-value engagements.
        </p>
      </ToolShell>
    );
  }

  if (phase === "preview") {
    return (
      <ToolShell title="Contract Generator" description="Review and print your contract.">
        <div className="mb-4 flex gap-3 print:hidden">
          <button onClick={() => setPhase("form")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" /> Edit details
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-[#1A2F42] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1A2F42]/90">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>
        <div className="rounded-2xl border bg-white p-8 shadow-sm print:shadow-none print:border-none print:rounded-none">
          <pre className="whitespace-pre-wrap font-[Georgia,serif] text-sm leading-relaxed text-slate-800">
            {contractText}
          </pre>
          <div className="mt-8 border-t pt-4 text-center text-xs text-slate-400 print:block">
            Generated by Alita · a USIU-A research tool · This document is a template and not legal advice.
          </div>
        </div>
      </ToolShell>
    );
  }

  // Form
  const isNda = type === "nda";
  const isService = type === "service";
  const isFreelance = type === "freelance";

  return (
    <ToolShell
      title={CONTRACT_TYPES.find((c) => c.id === type)?.label ?? "Contract Generator"}
      description="Fill in the details below to generate your contract."
    >
      <div className="space-y-6">
        <button onClick={() => setPhase("select")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#1A2F42] transition-colors">
          <ChevronLeft className="h-4 w-4" /> Choose a different template
        </button>

        {/* Parties */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={isNda ? "Disclosing party" : "Service provider / Freelancer"}>
            <div className="space-y-3">
              <Field label="Full name or company name">
                <input className={inp} value={fields.partyA} onChange={(e) => set("partyA", e.target.value)} placeholder="Acme Digital Ltd" />
              </Field>
              <Field label="Address">
                <textarea className={`${inp} resize-none`} rows={2} value={fields.partyAAddress} onChange={(e) => set("partyAAddress", e.target.value)} placeholder="P.O. Box 123, Nairobi" />
              </Field>
            </div>
          </Card>
          <Card title={isNda ? "Receiving party" : "Client"}>
            <div className="space-y-3">
              <Field label="Full name or company name">
                <input className={inp} value={fields.partyB} onChange={(e) => set("partyB", e.target.value)} placeholder="Client Ltd" />
              </Field>
              <Field label="Address">
                <textarea className={`${inp} resize-none`} rows={2} value={fields.partyBAddress} onChange={(e) => set("partyBAddress", e.target.value)} placeholder="P.O. Box 456, Nairobi" />
              </Field>
            </div>
          </Card>
        </div>

        {/* Agreement date */}
        <Card title="Agreement details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of agreement">
              <input className={inp} value={fields.date} onChange={(e) => set("date", e.target.value)} placeholder={today} />
            </Field>
            {isNda && (
              <Field label="Confidentiality period (e.g. 2 years)">
                <input className={inp} value={fields.ndaDuration} onChange={(e) => set("ndaDuration", e.target.value)} placeholder="2 years" />
              </Field>
            )}
          </div>
          {isNda && (
            <div className="mt-3">
              <Field label="Purpose of sharing confidential information">
                <input className={inp} value={fields.ndaPurpose} onChange={(e) => set("ndaPurpose", e.target.value)} placeholder="exploring a potential business relationship" />
              </Field>
            </div>
          )}
        </Card>

        {(isService || isFreelance) && (
          <Card title="Scope of work">
            <div className="space-y-3">
              <Field label="Description of services">
                <textarea className={`${inp} resize-none`} rows={3} value={fields.serviceDescription}
                  onChange={(e) => set("serviceDescription", e.target.value)}
                  placeholder="Design and develop a company website including 5 pages, contact form, and M-Pesa payment integration." />
              </Field>
              <Field label="Deliverables">
                <textarea className={`${inp} resize-none`} rows={3} value={fields.deliverables}
                  onChange={(e) => set("deliverables", e.target.value)}
                  placeholder="1. Figma design mockups&#10;2. Deployed website on client's hosting&#10;3. Source code handover" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date"><input className={inp} type="date" value={fields.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
                <Field label="End / delivery date"><input className={inp} type="date" value={fields.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Total fee (KSh)">
                  <input className={inp} type="number" min="0" value={fields.amount} onChange={(e) => set("amount", e.target.value)} placeholder="50000" />
                </Field>
                <Field label="Payment terms">
                  <input className={inp} value={fields.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="50% upfront, 50% on delivery" />
                </Field>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setPhase("preview")}
            className="rounded-xl bg-[#1A2F42] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1A2F42]/90 transition-colors"
          >
            Preview contract →
          </button>
        </div>
      </div>
    </ToolShell>
  );
}

const inp = "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#1A2F42] outline-none focus:border-[#00C9C8] focus:ring-2 focus:ring-[#00C9C8]/20 bg-white";

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
