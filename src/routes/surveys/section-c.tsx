import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { SECTION_C_BARRIERS, C5_OPTIONS } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";
import { saveSection } from "@/lib/survey/survey.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/surveys/section-c")({
  head: () => ({ meta: [{ title: "Section C — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionCPage,
});

const STORAGE_KEY = "ts_survey_sectionC";
const BARRIER_KEYS = ["C1", "C2", "C3", "C4"] as const;
type BarrierKey = (typeof BARRIER_KEYS)[number];
type SectionCState = Record<string, string | undefined>;

function allAnswered(values: SectionCState, prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`).every(
    (k) => values[k] === "yes" || values[k] === "no",
  );
}

function SectionCPage() {
  const navigate = useNavigate();
  const save = useServerFn(saveSection);
  const [step, setStep] = useState(0); // 0–3 = barrier grids, 4 = C5
  const [data, setData] = useState<SectionCState>({});
  const [saved, setSaved] = useState(false);

  const totalSteps = BARRIER_KEYS.length + 1;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { setData(JSON.parse(raw)); } catch { /* ignore */ } }
  }, []);

  function persist(next: SectionCState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 100);
    showToast("Progress saved");
  }

  function update(next: SectionCState) { setData(next); persist(next); }

  function isComplete(): boolean {
    if (step < BARRIER_KEYS.length) {
      const prefix = BARRIER_KEYS[step];
      const count = SECTION_C_BARRIERS[prefix].items.length;
      return allAnswered(data, prefix, count);
    }
    return !!data["C5"];
  }

  async function onNext() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      try { await save({ data: { section: "section_c", payload } }); } catch { /* non-blocking */ }
      navigate({ to: "/surveys/section-d" });
    }
  }

  function onBack() {
    if (step > 0) { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else navigate({ to: "/surveys/section-b" });
  }

  const sectionLabel =
    step < BARRIER_KEYS.length
      ? `Section C — ${SECTION_C_BARRIERS[BARRIER_KEYS[step] as BarrierKey].title}`
      : "Section C — Greatest barrier";

  return (
    <SurveyShell
      sectionName={sectionLabel}
      sectionIndex={3}
      totalSections={4}
      onNext={onNext}
      onBack={onBack}
      nextLabel={step === totalSteps - 1 ? "Next section →" : "Next →"}
      nextDisabled={!isComplete()}
      nextDisabledHint="Answer all questions above to continue"
      saved={saved}
    >
      <div className="py-6">
        {step < BARRIER_KEYS.length && (() => {
          const prefix = BARRIER_KEYS[step] as BarrierKey;
          const blk = SECTION_C_BARRIERS[prefix];
          return (
            <>
              <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                {blk.title}
              </h2>
              <p className="mb-5 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                {prefix === "C3"
                  ? "Does each statement describe your experience with this check-up?"
                  : "Does each statement apply as a barrier to improving cybersecurity in your business?"}
              </p>
              <div className="space-y-4">
                {blk.items.map((item, i) => {
                  const key = `${prefix}_${i + 1}`;
                  const val = data[key];
                  const yesLabel = prefix === "C3" ? "Yes, this applies" : "Yes, this is a barrier";
                  const noLabel  = prefix === "C3" ? "No, this does not apply" : "No, not a barrier";
                  return (
                    <div key={key} className="rounded-xl border bg-white p-4 space-y-3">
                      <p className="text-sm text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{item}</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => update({ ...data, [key]: "yes" })}
                          className={["flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                            val === "yes"
                              ? "border-2 border-amber-400 bg-amber-50 text-amber-700"
                              : "border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-body)] hover:border-amber-300"].join(" ")}
                          style={{ fontFamily: "var(--ts-font-body)" }}
                        >{yesLabel}</button>
                        <button
                          type="button"
                          onClick={() => update({ ...data, [key]: "no" })}
                          className={["flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                            val === "no"
                              ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)] text-[var(--ts-teal)]"
                              : "border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-body)] hover:border-[var(--ts-teal-dim)]"].join(" ")}
                          style={{ fontFamily: "var(--ts-font-body)" }}
                        >{noLabel}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {step === BARRIER_KEYS.length && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              C5. Which single category poses the greatest obstacle to improving cybersecurity in your business?
            </h2>
            <div className="flex flex-col gap-2">
              {C5_OPTIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => update({ ...data, C5: opt })}
                  className={["w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                    data["C5"] === opt
                      ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                      : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]"].join(" ")}
                  style={{ fontFamily: "var(--ts-font-body)" }}
                >{opt}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurveyShell>
  );
}
