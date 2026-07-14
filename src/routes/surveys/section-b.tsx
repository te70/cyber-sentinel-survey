import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { SECTION_B_LIKERT, B7a_OPTIONS, B7b_OPTIONS, B7c_OPTIONS, B7d_ITEMS } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";
import { saveSection } from "@/lib/survey/survey.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/surveys/section-b")({
  head: () => ({ meta: [{ title: "Section B — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionBPage,
});

const STORAGE_KEY = "ts_survey_sectionB";
const DOMAINS = ["B1", "B2", "B3", "B4", "B5", "B6"] as const;
type DomainKey = (typeof DOMAINS)[number];
type SectionBState = Record<string, string | string[] | undefined>;

function allAnswered(values: SectionBState, prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`).every(
    (k) => values[k] === "yes" || values[k] === "no",
  );
}

function SectionBPage() {
  const navigate = useNavigate();
  const save = useServerFn(saveSection);
  const [domain, setDomain] = useState(0);
  const [data, setData] = useState<SectionBState>({});
  const [saved, setSaved] = useState(false);

  const totalDomainSteps = DOMAINS.length + 1; // 6 domains + B7

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { setData(JSON.parse(raw)); } catch { /* ignore */ } }
  }, []);

  function persist(next: SectionBState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 100);
    showToast("Progress saved");
  }

  function update(next: SectionBState) { setData(next); persist(next); }

  function setAnswer(key: string, value: string) {
    update({ ...data, [key]: value });
  }

  function isCurrentComplete(): boolean {
    if (domain < DOMAINS.length) {
      const prefix = DOMAINS[domain];
      const count = SECTION_B_LIKERT[prefix].items.length;
      return allAnswered(data, prefix, count);
    }
    // B7 screen
    const b7a = (data["B7a"] as string[] | undefined) ?? [];
    return b7a.length > 0 && !!data["B7b"] && !!data["B7c"] && allAnswered(data, "B7d", B7d_ITEMS.length);
  }

  async function onNext() {
    if (domain < totalDomainSteps - 1) {
      setDomain((d) => d + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Save to backend before navigating away
      const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      try { await save({ data: { section: "section_b", payload } }); } catch { /* non-blocking */ }
      navigate({ to: "/surveys/section-c" });
    }
  }

  function onBack() {
    if (domain > 0) { setDomain((d) => d - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else navigate({ to: "/surveys/section-a" });
  }

  const complete = isCurrentComplete();
  const domainLabel = domain < DOMAINS.length
    ? SECTION_B_LIKERT[DOMAINS[domain] as DomainKey].title
    : "B7 — Threat exposure";

  return (
    <SurveyShell
      sectionName={`Section B — ${domainLabel}`}
      sectionIndex={2}
      totalSections={4}
      onNext={onNext}
      onBack={onBack}
      nextLabel={domain === totalDomainSteps - 1 ? "Next section →" : "Next domain →"}
      nextDisabled={!complete}
      nextDisabledHint="Answer all questions above to continue"
      saved={saved}
    >
      <div className="py-6 space-y-1">
        {domain < DOMAINS.length && (() => {
          const prefix = DOMAINS[domain] as DomainKey;
          const blk = SECTION_B_LIKERT[prefix];
          return (
            <>
              <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                {blk.title}
              </h2>
              <p className="mb-5 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                For each statement, select Yes if it describes your business or No if it does not.
              </p>
              <div className="space-y-4">
                {blk.items.map((item, i) => {
                  const key = `${prefix}_${i + 1}`;
                  const val = data[key] as string | undefined;
                  return (
                    <div key={key} className="rounded-xl border bg-white p-4 space-y-3">
                      <p className="text-sm text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{item}</p>
                      <div className="flex gap-3">
                        <YesNoBtn label="Yes" active={val === "yes"} onClick={() => setAnswer(key, "yes")} positive />
                        <YesNoBtn label="No"  active={val === "no"}  onClick={() => setAnswer(key, "no")}  positive={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {domain === DOMAINS.length && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
              B7 — Threat exposure
            </h2>

            {/* B7a multi-select */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                Which of the following has your business experienced in the past 12 months?{" "}
                <span className="font-normal text-[var(--ts-text-secondary)]">(select all that apply)</span>
              </p>
              <div className="flex flex-col gap-2">
                {B7a_OPTIONS.map((opt) => {
                  const checked = ((data["B7a"] as string[] | undefined) ?? []).includes(opt);
                  return (
                    <button key={opt} type="button"
                      onClick={() => {
                        const cur = (data["B7a"] as string[] | undefined) ?? [];
                        update({ ...data, B7a: checked ? cur.filter((x) => x !== opt) : [...cur, opt] });
                      }}
                      className={["w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                        checked ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                                : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]"].join(" ")}
                      style={{ fontFamily: "var(--ts-font-body)" }}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>

            {/* B7b */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                How many separate cybersecurity incidents did your business experience in the past 12 months?
              </p>
              <div className="flex flex-col gap-2">
                {B7b_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => update({ ...data, B7b: opt })}
                    className={["w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                      data["B7b"] === opt ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                                          : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]"].join(" ")}
                    style={{ fontFamily: "var(--ts-font-body)" }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            {/* B7c */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                What was the most significant impact of a cybersecurity incident in the past 12 months?
              </p>
              <div className="flex flex-col gap-2">
                {B7c_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => update({ ...data, B7c: opt })}
                    className={["w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                      data["B7c"] === opt ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                                          : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]"].join(" ")}
                    style={{ fontFamily: "var(--ts-font-body)" }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            {/* B7d Yes/No */}
            <div>
              <h3 className="mb-1 text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                Severity of the cybersecurity threat environment
              </h3>
              <p className="mb-4 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                Does each statement apply to your business?
              </p>
              <div className="space-y-4">
                {B7d_ITEMS.map((item, i) => {
                  const key = `B7d_${i + 1}`;
                  const val = data[key] as string | undefined;
                  return (
                    <div key={key} className="rounded-xl border bg-white p-4 space-y-3">
                      <p className="text-sm text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>{item}</p>
                      <div className="flex gap-3">
                        <YesNoBtn label="Yes" active={val === "yes"} onClick={() => setAnswer(key, "yes")} positive />
                        <YesNoBtn label="No"  active={val === "no"}  onClick={() => setAnswer(key, "no")}  positive={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </SurveyShell>
  );
}

function YesNoBtn({ label, active, onClick, positive }: { label: string; active: boolean; onClick: () => void; positive: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
        active
          ? positive
            ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal)] text-white"
            : "border-2 border-red-400 bg-red-50 text-red-700"
          : "border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-body)] hover:border-[var(--ts-teal-dim)]",
      ].join(" ")}
      style={{ fontFamily: "var(--ts-font-body)" }}
    >
      {label}
    </button>
  );
}
