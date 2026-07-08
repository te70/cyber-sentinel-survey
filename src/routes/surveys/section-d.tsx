import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { TsLikertGrid } from "@/components/surveys/TsLikertGrid";
import { D1_ITEMS, D2_ITEMS, D3_ITEMS, D4_PROMPTS } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";

export const Route = createFileRoute("/surveys/section-d")({
  head: () => ({ meta: [{ title: "Section D — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionDPage,
});

const STORAGE_KEY = "ts_survey_sectionD";
type SectionDState = Record<string, number | string | undefined>;

const D4_PLACEHOLDERS: Record<string, string> = {
  D4a: "e.g. The six-domain structure gave me a clear framework to benchmark our security posture",
  D4b: "e.g. A scoring comparison against other SMEs of the same size would help prioritise action",
  D4c: "e.g. Internet costs make it hard to keep cloud tools running reliably",
  D4d: "e.g. Annually before budget season, and whenever we onboard a new developer",
};

function SectionDPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=D1, 1=D2, 2=D3, 3=D4
  const [data, setData] = useState<SectionDState>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { setData(JSON.parse(raw)); } catch { /* ignore */ } }
  }, []);

  function persist(next: SectionDState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 100);
    showToast("Progress saved");
  }

  function update(next: SectionDState) { setData(next); persist(next); }

  function allLikert(prefix: string, count: number) {
    return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`).every(
      (k) => typeof data[k] === "number",
    );
  }

  function isComplete(): boolean {
    if (step === 0) return allLikert("D1", D1_ITEMS.length);
    if (step === 1) return allLikert("D2", D2_ITEMS.length);
    if (step === 2) return allLikert("D3", D3_ITEMS.length);
    return true; // D4 is optional
  }

  async function onNext() {
    if (step < 3) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setBusy(true);
      // Submit to server — completion handled by existing completeSurvey server fn
      try {
        const { completeSurvey } = await import("@/lib/survey/survey.functions");
        const res = await completeSurvey({ data: { section_d: data as Record<string, unknown> } });
        if (res.ok) navigate({ to: "/surveys/complete" });
      } catch {
        // fallback navigate even if submission fails
        navigate({ to: "/surveys/complete" });
      } finally {
        setBusy(false);
      }
    }
  }

  function onBack() {
    if (step > 0) { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else navigate({ to: "/surveys/section-c" });
  }

  const stepLabels = ["D1 — Usability rating", "D2 — Perceived usefulness", "D3 — Local relevance", "D4 — Open feedback"];

  return (
    <SurveyShell
      sectionName={`Section D — ${stepLabels[step]}`}
      sectionIndex={4}
      totalSections={4}
      onNext={onNext}
      onBack={onBack}
      nextLabel={step === 3 ? "Submit & claim reward" : "Next →"}
      nextDisabled={!isComplete()}
      nextDisabledHint={step < 3 ? "Answer all questions above to continue" : undefined}
      busy={busy}
      saved={saved}
    >
      <div className="py-6">
        {step === 0 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              D1. Usability rating
            </h2>
            <p className="mb-4 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              Having completed the assessment, rate how well each statement describes your experience.
            </p>
            {/* Reverse-scored items rendered identically — no label, reversal is server-side */}
            <TsLikertGrid
              items={D1_ITEMS.map((i) => i.text)}
              prefix="D1"
              values={data as Record<string, number | undefined>}
              onChange={(k, v) => update({ ...data, [k]: v })}
            />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              D2. Perceived usefulness &amp; adoption intention
            </h2>
            <TsLikertGrid
              items={D2_ITEMS}
              prefix="D2"
              values={data as Record<string, number | undefined>}
              onChange={(k, v) => update({ ...data, [k]: v })}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              D3. Local relevance &amp; contextual fit
            </h2>
            <TsLikertGrid
              items={D3_ITEMS}
              prefix="D3"
              values={data as Record<string, number | undefined>}
              onChange={(k, v) => update({ ...data, [k]: v })}
            />
          </>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              D4. Open-ended feedback
            </h2>
            {(Object.entries(D4_PROMPTS) as [keyof typeof D4_PROMPTS, string][]).map(([k, prompt]) => {
              const val = (data[k] as string | undefined) ?? "";
              return (
                <div key={k} className="space-y-1">
                  <label
                    htmlFor={k}
                    className="block text-sm font-medium text-[var(--ts-text-primary)]"
                    style={{ fontFamily: "var(--ts-font-body)" }}
                  >
                    {prompt} <span className="font-normal text-[var(--ts-text-secondary)]">(optional)</span>
                  </label>
                  <textarea
                    id={k}
                    rows={4}
                    maxLength={500}
                    value={val}
                    placeholder={D4_PLACEHOLDERS[k]}
                    onChange={(e) => update({ ...data, [k]: e.target.value })}
                    className="w-full resize-none rounded-lg border border-[var(--ts-border-strong)] bg-white p-3 text-sm text-[var(--ts-text-primary)] outline-none focus:border-2 focus:border-[var(--ts-teal)] focus:shadow-[var(--ts-shadow-teal)]"
                    style={{ fontFamily: "var(--ts-font-body)", minHeight: "120px" }}
                  />
                  <p className="text-right text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                    {val.length} / 500
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SurveyShell>
  );
}
