import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { CheckCircle2, XCircle, AlertCircle, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/tools/compliance")({
  head: () => ({ meta: [{ title: "DPA Compliance Checker — Alita Tools" }] }),
  component: DpaChecker,
});

type Answer = "yes" | "no" | "partial" | null;

interface Question {
  id: string;
  category: string;
  text: string;
  guidance: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  // Data collection & consent
  {
    id: "q1", category: "Data Collection & Consent",
    text: "Do you tell users/customers what personal data you collect and why, before collecting it?",
    guidance: "Under DPA 2019 s.25, you must provide a privacy notice at the point of collection stating the purpose, legal basis, and how long data will be kept.",
    weight: 2,
  },
  {
    id: "q2", category: "Data Collection & Consent",
    text: "Do you obtain clear consent before collecting sensitive personal data (e.g. ID numbers, health, financial info)?",
    guidance: "Sensitive data requires explicit consent under DPA 2019 s.46. A pre-ticked box or silence does not count as consent.",
    weight: 2,
  },
  {
    id: "q3", category: "Data Collection & Consent",
    text: "Do you only collect data that you actually need for your stated purpose (data minimisation)?",
    guidance: "DPA 2019 s.25(c) requires that data collected is adequate, relevant, and not excessive in relation to the purpose.",
    weight: 1,
  },
  {
    id: "q4", category: "Data Collection & Consent",
    text: "Do you have a written privacy policy available to your customers?",
    guidance: "A privacy policy is required for any entity that processes personal data. It must be accessible and written in plain language.",
    weight: 1,
  },

  // Data security
  {
    id: "q5", category: "Data Security",
    text: "Is customer and staff personal data stored securely (e.g. encrypted, access-controlled)?",
    guidance: "DPA 2019 s.41 requires data controllers to implement appropriate technical and organisational security measures.",
    weight: 2,
  },
  {
    id: "q6", category: "Data Security",
    text: "Do you have a process to detect and respond to data breaches?",
    guidance: "Under DPA 2019 s.43, you must notify the Office of the Data Protection Commissioner (ODPC) within 72 hours of discovering a breach.",
    weight: 2,
  },
  {
    id: "q7", category: "Data Security",
    text: "Do you vet third parties (e.g. payment processors, cloud providers, developers) who handle your customers' data?",
    guidance: "DPA 2019 s.44 requires a data processing agreement with any third-party processor. You remain responsible for how they handle the data.",
    weight: 1,
  },
  {
    id: "q8", category: "Data Security",
    text: "Do you delete or anonymise personal data when it is no longer needed?",
    guidance: "DPA 2019 s.25(e) requires data to be kept no longer than necessary for the purpose it was collected.",
    weight: 1,
  },

  // Individual rights
  {
    id: "q9", category: "Individual Rights",
    text: "Can a customer request to see, correct, or delete the personal data you hold on them?",
    guidance: "DPA 2019 grants data subjects the right of access (s.26), rectification (s.27), erasure (s.28), and objection (s.31). You must respond within 21 days.",
    weight: 2,
  },
  {
    id: "q10", category: "Individual Rights",
    text: "Have you registered as a data controller with the ODPC (Office of the Data Protection Commissioner)?",
    guidance: "Data controllers processing personal data in Kenya must register with the ODPC under DPA 2019 s.16. Fines for non-registration can reach KSh 5 million.",
    weight: 2,
  },
  {
    id: "q11", category: "Individual Rights",
    text: "If you transfer personal data outside Kenya, do you ensure the destination country has adequate protection?",
    guidance: "Cross-border transfers are restricted under DPA 2019 s.48. You need a contractual safeguard or the ODPC's authorisation before transferring data abroad.",
    weight: 1,
  },
  {
    id: "q12", category: "Individual Rights",
    text: "Do staff who handle personal data understand their obligations under the Data Protection Act?",
    guidance: "All staff processing personal data should receive training on DPA 2019 obligations. Controllers are liable for the acts of their employees.",
    weight: 1,
  },
];

const CATEGORIES = [...new Set(QUESTIONS.map((q) => q.category))];

function scoreLabel(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 85) return { label: "Strong", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (pct >= 60) return { label: "Developing", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { label: "Needs attention", color: "text-red-700", bg: "bg-red-50 border-red-200" };
}

function DpaChecker() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");

  const answered = QUESTIONS.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null);
  const allAnswered = answered.length === QUESTIONS.length;

  function score() {
    let earned = 0, max = 0;
    for (const q of QUESTIONS) {
      max += q.weight * 2;
      if (answers[q.id] === "yes") earned += q.weight * 2;
      else if (answers[q.id] === "partial") earned += q.weight;
    }
    return { earned, max, pct: Math.round((earned / max) * 100) };
  }

  const { earned, max, pct } = score();

  if (phase === "results") {
    const { label, color, bg } = scoreLabel(pct);
    const gaps = QUESTIONS.filter((q) => answers[q.id] === "no" || answers[q.id] === "partial");

    return (
      <ToolShell title="DPA Compliance Checker" description="Kenya Data Protection Act 2019 compliance self-assessment.">
        {/* Score banner */}
        <div className={`rounded-2xl border p-6 mb-6 ${bg}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Your DPA 2019 compliance score</p>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-bold ${color}`}>{pct}%</span>
                <span className={`text-lg font-semibold mb-1 ${color}`}>{label}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{earned}/{max} points · {QUESTIONS.length - gaps.length}/{QUESTIONS.length} requirements met</p>
            </div>
            <button
              onClick={() => { setAnswers({}); setPhase("quiz"); }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </button>
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-white/60 overflow-hidden">
            <div className="h-full rounded-full bg-current transition-all" style={{ width: `${pct}%`, color: color.replace("text-", "") }} />
          </div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm mb-6">
            <h2 className="mb-4 text-sm font-semibold text-[#1A2F42]">
              {gaps.length} area{gaps.length !== 1 ? "s" : ""} to address
            </h2>
            <div className="space-y-4">
              {gaps.map((q) => (
                <div key={q.id} className={`rounded-xl border p-4 ${answers[q.id] === "no" ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50"}`}>
                  <div className="flex items-start gap-3">
                    {answers[q.id] === "no"
                      ? <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
                      : <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{q.text}</p>
                      <p className="mt-1.5 text-xs text-slate-500">{q.guidance}</p>
                      <span className="mt-2 inline-block rounded-full bg-white border px-2 py-0.5 text-xs text-slate-500">{q.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passed */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#1A2F42]">Already in place ✓</h2>
          <div className="space-y-2">
            {QUESTIONS.filter((q) => answers[q.id] === "yes").map((q) => (
              <div key={q.id} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                {q.text}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center">
          This checker is for guidance only and does not constitute legal advice. Consult a data protection lawyer or the{" "}
          <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">ODPC</a> for formal compliance advice.
        </p>
      </ToolShell>
    );
  }

  return (
    <ToolShell
      title="DPA Compliance Checker"
      description="Answer 12 questions to see how well your business complies with Kenya's Data Protection Act 2019."
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="rounded-xl bg-white border p-4 shadow-sm flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00C9C8] transition-all"
              style={{ width: `${(answered.length / QUESTIONS.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{answered.length}/{QUESTIONS.length} answered</span>
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat} className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-semibold text-[#1A2F42] uppercase tracking-wide">{cat}</h2>
            <div className="space-y-5">
              {QUESTIONS.filter((q) => q.category === cat).map((q, idx) => (
                <div key={q.id} className={`rounded-xl border p-4 transition-colors ${answers[q.id] ? "border-[#00C9C8]/40 bg-[#00C9C8]/4" : "border-slate-100"}`}>
                  <p className="text-sm font-medium text-slate-800 mb-3">
                    <span className="text-slate-400 mr-1.5 text-xs">{idx + 1}.</span>{q.text}
                  </p>
                  <div className="flex gap-2">
                    {(["yes", "partial", "no"] as const).map((opt) => {
                      const colors: Record<string, string> = {
                        yes: "border-emerald-400 bg-emerald-50 text-emerald-700",
                        partial: "border-amber-400 bg-amber-50 text-amber-700",
                        no: "border-red-300 bg-red-50 text-red-700",
                      };
                      const labels: Record<string, string> = { yes: "Yes", partial: "Partially", no: "No" };
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={[
                            "flex-1 rounded-lg border py-2 text-xs font-semibold transition-all",
                            selected ? colors[opt] : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600",
                          ].join(" ")}
                        >
                          {labels[opt]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={() => setPhase("results")}
            disabled={!allAnswered}
            className="rounded-xl bg-[#1A2F42] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1A2F42]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            See my results →
          </button>
        </div>
      </div>
    </ToolShell>
  );
}
