import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { TsLikertGrid } from "@/components/surveys/TsLikertGrid";
import { SECTION_C_BARRIERS, C5_OPTIONS } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";

export const Route = createFileRoute("/surveys/section-c")({
  head: () => ({ meta: [{ title: "Section C — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionCPage,
});

const STORAGE_KEY = "ts_survey_sectionC";
const BARRIER_KEYS = ["C1", "C2", "C3", "C4"] as const;
type BarrierKey = (typeof BARRIER_KEYS)[number];

type SectionCState = Record<string, number | string | undefined>;

function SectionCPage() {
  const navigate = useNavigate();
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
      return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`).every(
        (k) => typeof data[k] === "number",
      );
    }
    return !!data["C5"];
  }

  function onNext() {
    if (step < totalSteps - 1) { setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else navigate({ to: "/surveys/section-d" });
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
      {/* ⚠️ CRITICAL: sticky warning banner — different scale */}
      <div
        className="sticky top-[57px] z-10 mb-4"
        style={{
          background: "#FEF3C7",
          borderLeft: "4px solid var(--ts-warning)",
          padding: "10px 14px",
        }}
      >
        <p className="text-sm font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          Different scale in this section
        </p>
        <p className="text-sm text-[var(--ts-text-body)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          1 = Not a barrier at all&nbsp;&nbsp;→&nbsp;&nbsp;5 = Critical barrier
        </p>
      </div>

      <div className="py-4">
        {step < BARRIER_KEYS.length && (() => {
          const prefix = BARRIER_KEYS[step] as BarrierKey;
          const blk = SECTION_C_BARRIERS[prefix];
          return (
            <>
              <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                {blk.title}
              </h2>
              <p className="mb-4 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                Rate each statement as a barrier to improving cybersecurity.
              </p>
              <TsLikertGrid
                items={blk.items}
                prefix={prefix}
                values={data as Record<string, number | undefined>}
                onChange={(key, value) => update({ ...data, [key]: value })}
                scaleMin="Not a barrier"
                scaleMax="Critical barrier"
              />
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
                <button
                  key={opt}
                  type="button"
                  onClick={() => update({ ...data, C5: opt })}
                  className={[
                    "w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                    data["C5"] === opt
                      ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                      : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]",
                  ].join(" ")}
                  style={{ fontFamily: "var(--ts-font-body)" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurveyShell>
  );
}
