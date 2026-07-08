import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SurveyShell } from "@/components/surveys/SurveyShell";
import { TsLikertGrid } from "@/components/surveys/TsLikertGrid";
import { SECTION_B_LIKERT, B7a_OPTIONS, B7b_OPTIONS, B7c_OPTIONS, B7d_ITEMS } from "@/lib/survey/schema";
import { showToast } from "@/components/surveys/ui/TsToast";

export const Route = createFileRoute("/surveys/section-b")({
  head: () => ({ meta: [{ title: "Section B — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: SectionBPage,
});

const STORAGE_KEY = "ts_survey_sectionB";
const DOMAINS = ["B1", "B2", "B3", "B4", "B5", "B6"] as const;
type DomainKey = (typeof DOMAINS)[number];

type SectionBState = Record<string, number | string | string[] | undefined>;

function allAnswered(values: SectionBState, prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`).every(
    (k) => typeof values[k] === "number",
  );
}

function SectionBPage() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState(0);
  const [data, setData] = useState<SectionBState>({});
  const [saved, setSaved] = useState(false);

  // Total sub-steps: 6 domains + 1 B7 screen = 7
  const totalDomainSteps = DOMAINS.length + 1;

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

  function onChange(key: string, value: number) {
    const next = { ...data, [key]: value };
    update(next);
  }

  function isCurrentComplete(): boolean {
    if (domain < DOMAINS.length) {
      const prefix = DOMAINS[domain];
      const count = SECTION_B_LIKERT[prefix].items.length;
      return allAnswered(data, prefix, count);
    }
    // B7 screen
    const b7a = (data["B7a"] as string[] | undefined) ?? [];
    return (
      b7a.length > 0 &&
      !!data["B7b"] &&
      !!data["B7c"] &&
      allAnswered(data, "B7d", B7d_ITEMS.length)
    );
  }

  function onNext() {
    if (domain < totalDomainSteps - 1) {
      setDomain((d) => d + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
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
      <div className="py-6">
        {domain < DOMAINS.length && (() => {
          const prefix = DOMAINS[domain] as DomainKey;
          const blk = SECTION_B_LIKERT[prefix];
          return (
            <>
              <h2 className="mb-1 text-lg font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                {blk.title}
              </h2>
              <p className="mb-4 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                Rate how well each statement describes your business.
              </p>
              <TsLikertGrid
                items={blk.items}
                prefix={prefix}
                values={data as Record<string, number | undefined>}
                onChange={onChange}
              />
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
              <p className="mb-2 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                Which of the following has your business experienced in the past 12 months?
                <span className="ml-1 font-normal text-[var(--ts-text-secondary)]">(select all that apply)</span>
              </p>
              <div className="flex flex-col gap-2">
                {B7a_OPTIONS.map((opt) => {
                  const checked = ((data["B7a"] as string[] | undefined) ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const cur = (data["B7a"] as string[] | undefined) ?? [];
                        update({ ...data, B7a: checked ? cur.filter((x) => x !== opt) : [...cur, opt] });
                      }}
                      className={[
                        "w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                        checked
                          ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)]"
                          : "border border-[var(--ts-border)] bg-white hover:border-[var(--ts-teal-dim)]",
                      ].join(" ")}
                      style={{ fontFamily: "var(--ts-font-body)" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B7b */}
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                How many separate cybersecurity incidents did your business experience in the past 12 months?
              </p>
              <div className="flex flex-col gap-2">
                {B7b_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ ...data, B7b: opt })}
                    className={[
                      "w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                      data["B7b"] === opt
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

            {/* B7c */}
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                What was the most significant impact of a cybersecurity incident in the past 12 months?
              </p>
              <div className="flex flex-col gap-2">
                {B7c_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ ...data, B7c: opt })}
                    className={[
                      "w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                      data["B7c"] === opt
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

            {/* B7d Likert */}
            <div>
              <h3 className="mb-1 text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: "var(--ts-font-display)" }}>
                Severity of the cybersecurity threat environment
              </h3>
              <TsLikertGrid
                items={B7d_ITEMS}
                prefix="B7d"
                values={data as Record<string, number | undefined>}
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </div>
    </SurveyShell>
  );
}
