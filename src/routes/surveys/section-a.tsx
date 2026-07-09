import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { SECTION_A } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";

export const Route = createFileRoute("/surveys/section-a")({
  head: () => ({ meta: [{ title: "Section A — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionAPage,
});

const STORAGE_KEY = "ts_survey_sectionA";
const QUESTIONS = ["A2", "A3", "A4", "A5"] as const;
const TOTAL_SECTIONS = 4;

type SectionAState = {
  A1?: string; A1_other?: string;
  A2?: string; A3?: string; A4?: string;
  A5?: string[];
  A6?: string; A6_other?: string;
};

function OptionButton({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg px-4 text-sm text-left transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
        selected
          ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)] text-[var(--ts-text-primary)]"
          : "border border-[var(--ts-border)] bg-white text-[var(--ts-text-body)] hover:border-[var(--ts-teal-dim)]",
      ].join(" ")}
      style={{ minHeight: "48px", fontFamily: "var(--ts-font-body)", padding: "12px 16px" }}
    >
      {label}
    </button>
  );
}

function SectionAPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SectionAState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setData(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  function persist(next: SectionAState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 100);
    showToast("Progress saved");
  }

  function update(next: SectionAState) {
    setData(next);
    persist(next);
  }

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    const q = QUESTIONS[step];
    if (q === "A5") {
      if (!data.A5 || data.A5.length === 0) e.A5 = "Select at least one option";
    } else {
      if (!data[q]) e[q] = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onNext() {
    if (!validateStep()) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/surveys/section-b" });
    }
  }

  function onBack() {
    if (step > 0) { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else navigate({ to: "/surveys/eligibility" });
  }

  const q = QUESTIONS[step];
  const isAllAnsweredStep = q === "A5" ? (data.A5?.length ?? 0) > 0 : !!data[q as keyof SectionAState];

  return (
    <SurveyShell
      sectionName="Section A — Organisational profile"
      sectionIndex={1}
      totalSections={TOTAL_SECTIONS}
      onNext={onNext}
      onBack={onBack}
      nextLabel={step === QUESTIONS.length - 1 ? "Next section →" : "Next →"}
      nextDisabled={!isAllAnsweredStep}
      nextDisabledHint="Answer this question to continue"
      saved={saved}
    >
      <div className="py-6">
        {/* A2 — Employees */}
        {q === "A2" && (
          <QuestionBlock label={SECTION_A.A2.label} error={errors.A2}>
            <div className="flex flex-col gap-2">
              {SECTION_A.A2.options.map((opt) => (
                <OptionButton key={opt} label={opt} selected={data.A2 === opt} onClick={() => update({ ...data, A2: opt })} />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* A3 — Years */}
        {q === "A3" && (
          <QuestionBlock label={SECTION_A.A3.label} error={errors.A3}>
            <div className="flex flex-col gap-2">
              {SECTION_A.A3.options.map((opt) => (
                <OptionButton key={opt} label={opt} selected={data.A3 === opt} onClick={() => update({ ...data, A3: opt })} />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* A4 — IT staff */}
        {q === "A4" && (
          <QuestionBlock label={SECTION_A.A4.label} error={errors.A4}>
            <div className="flex flex-col gap-2">
              {SECTION_A.A4.options.map((opt) => (
                <OptionButton key={opt} label={opt} selected={data.A4 === opt} onClick={() => update({ ...data, A4: opt })} />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* A5 — Digital platforms (multi-select) */}
        {q === "A5" && (
          <QuestionBlock label={SECTION_A.A5.label} hint="Select all that apply" error={errors.A5}>
            <div className="flex flex-col gap-2">
              {SECTION_A.A5.options.map((opt) => {
                const checked = (data.A5 ?? []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const cur = data.A5 ?? [];
                      update({ ...data, A5: checked ? cur.filter((x) => x !== opt) : [...cur, opt] });
                    }}
                    className={[
                      "w-full rounded-lg px-4 text-sm text-left transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                      checked
                        ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                        : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]",
                    ].join(" ")}
                    style={{ minHeight: "48px", fontFamily: "var(--ts-font-body)", padding: "12px 16px" }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </QuestionBlock>
        )}

      </div>
    </SurveyShell>
  );
}

function QuestionBlock({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
          {label}
        </h2>
        {hint && <p className="mt-1 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{hint}</p>}
      </div>
      {children}
      {error && <p className="text-xs text-[var(--ts-error)]" style={{ fontFamily: "var(--ts-font-body)" }}>{error}</p>}
    </div>
  );
}
