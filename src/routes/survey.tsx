import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  saveSection,
  completeSurvey,
  getSessionInfo,
} from "@/lib/survey/survey.functions";
import {
  SECTION_A,
  SECTION_B_LIKERT,
  B7a_OPTIONS,
  B7b_OPTIONS,
  B7c_OPTIONS,
  B7d_ITEMS,
  SECTION_C_BARRIERS,
  C5_OPTIONS,
  D1_ITEMS,
  D2_ITEMS,
  D3_ITEMS,
  D4_PROMPTS,
  SURVEY_STEPS,
} from "@/lib/survey/schema";

export const Route = createFileRoute("/survey")({
  head: () => ({
    meta: [
      { title: "Survey — Cybersecurity Maturity Assessment" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurveyPage,
});

// ---------- shared input wrappers ----------
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-5 sm:p-6">{children}</div>;
}
function FieldLabel({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold">{children}</div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
function RadioList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
            value === opt
              ? "border-primary bg-primary/5"
              : "border-input bg-background hover:bg-secondary"
          }`}
        >
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="h-4 w-4 accent-primary"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
function CheckboxList({
  options,
  values,
  onToggle,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = values.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
              checked
                ? "border-primary bg-primary/5"
                : "border-input bg-background hover:bg-secondary"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              className="h-4 w-4 accent-primary"
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

// ---------- state types ----------
type SectionA = {
  A1?: string;
  A1_other?: string;
  A2?: string;
  A3?: string;
  A4?: string;
  A5?: string[];
  A6?: string;
  A6_other?: string;
};
type SectionB = Record<string, string | string[] | undefined>;
type SectionC = Record<string, string | undefined>;
type SectionD = Record<string, string | undefined>;

function SurveyPage() {
  const navigate = useNavigate();
  const save = useServerFn(saveSection);
  const complete = useServerFn(completeSurvey);
  const info = useServerFn(getSessionInfo);

  const [step, setStep] = useState(0);
  const [a, setA] = useState<SectionA>({});
  const [b, setB] = useState<SectionB>({});
  const [c, setC] = useState<SectionC>({});
  const [d, setD] = useState<SectionD>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Validate session and resume saved data
  useEffect(() => {
    let cancelled = false;
    info()
      .then((res) => {
        if (cancelled) return;
        if (!res.active) {
          navigate({ to: "/screening" });
          return;
        }
        if (res.completed) {
          navigate({ to: "/surveys/report" });
          return;
        }
        if (res.saved.a) setA(res.saved.a as SectionA);
        if (res.saved.b) setB(res.saved.b as SectionB);
        if (res.saved.c) setC(res.saved.c as SectionC);
        if (res.saved.d) setD(res.saved.d as SectionD);
        setReady(true);
      })
      .catch(() => navigate({ to: "/screening" }));
    return () => {
      cancelled = true;
    };
  }, [info, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading your survey…
      </div>
    );
  }

  const totalSteps = SURVEY_STEPS.length;
  const pct = Math.round(((step + 1) / totalSteps) * 100);

  function setErr(key: string, msg: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  }

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!a.A1) e.A1 = "Required";
      if (a.A1 === "Other digital services" && !(a.A1_other ?? "").trim())
        e.A1_other = "Please specify";
      if (!a.A2) e.A2 = "Required";
      if (!a.A3) e.A3 = "Required";
      if (!a.A4) e.A4 = "Required";
      if (!a.A5 || a.A5.length === 0) e.A5 = "Select at least one option";
      if (!a.A6) e.A6 = "Required";
      if (a.A6 === "Other" && !(a.A6_other ?? "").trim()) e.A6_other = "Please specify";
    } else if (step >= 1 && step <= 6) {
      const map = ["B1", "B2", "B3", "B4", "B5", "B6"] as const;
      const prefix = map[step - 1];
      const block = SECTION_B_LIKERT[prefix];
      block.items.forEach((_, i) => {
        const k = `${prefix}_${i + 1}`;
        if (b[k] !== "yes" && b[k] !== "no") e[k] = "Required";
      });
    } else if (step === 7) {
      const a7 = (b["B7a"] as string[] | undefined) ?? [];
      if (a7.length === 0) e.B7a = "Select at least one option";
      if (!b["B7b"]) e.B7b = "Required";
      if (!b["B7c"]) e.B7c = "Required";
      B7d_ITEMS.forEach((_, i) => {
        if (b[`B7d_${i + 1}`] !== "yes" && b[`B7d_${i + 1}`] !== "no") e[`B7d_${i + 1}`] = "Required";
      });
    } else if (step === 8) {
      (["C1", "C2", "C3", "C4"] as const).forEach((p) => {
        SECTION_C_BARRIERS[p].items.forEach((_, i) => {
          const k = `${p}_${i + 1}`;
          if (c[k] !== "yes" && c[k] !== "no") e[k] = "Required";
        });
      });
      if (!c.C5) e.C5 = "Required";
    } else if (step === 9) {
      D1_ITEMS.forEach((_, i) => {
        if (d[`D1_${i + 1}`] !== "yes" && d[`D1_${i + 1}`] !== "no") e[`D1_${i + 1}`] = "Required";
      });
      D2_ITEMS.forEach((_, i) => {
        if (d[`D2_${i + 1}`] !== "yes" && d[`D2_${i + 1}`] !== "no") e[`D2_${i + 1}`] = "Required";
      });
      D3_ITEMS.forEach((_, i) => {
        if (d[`D3_${i + 1}`] !== "yes" && d[`D3_${i + 1}`] !== "no") e[`D3_${i + 1}`] = "Required";
      });
      (["D4a", "D4b", "D4c", "D4d"] as const).forEach((k) => {
        if (!(d[k] as string | undefined)?.trim()) e[k] = "Please provide a brief answer";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function persist(section: "section_a" | "section_b" | "section_c" | "section_d") {
    const payload = section === "section_a" ? a : section === "section_b" ? b : section === "section_c" ? c : d;
    const res = await save({ data: { section, payload: payload as Record<string, unknown> } });
    if (!res.ok) {
      if (res.reason === "no_session") {
        navigate({ to: "/screening" });
        return false;
      }
      setServerErr("Couldn't save progress. Please try again.");
      return false;
    }
    return true;
  }

  async function onNext() {
    setServerErr(null);
    if (!validateStep()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      // Save section that just completed
      if (step === 0) {
        if (!(await persist("section_a"))) return;
      } else if (step === 7) {
        if (!(await persist("section_b"))) return;
      } else if (step === 8) {
        if (!(await persist("section_c"))) return;
      } else if (step === 9) {
        const res = await complete({ data: { section_d: d as Record<string, unknown> } });
        if (res.ok) {
          navigate({ to: "/surveys/report" });
          return;
        }
        setServerErr("Couldn't submit. Please try again.");
        return;
      }
      // Section B partial save on each likert page too
      if (step >= 1 && step <= 6) {
        if (!(await persist("section_b"))) return;
      }
      setStep((s) => Math.min(totalSteps - 1, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  function onBack() {
    setServerErr(null);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary pb-20">
      <div className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              Section {step + 1} of {totalSteps}
            </span>
            <span className="text-muted-foreground">{pct}% complete</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">{SURVEY_STEPS[step]}</div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {serverErr && (
          <div className="mb-6 rounded-lg border-2 border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {serverErr}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <Card>
              <FieldLabel>{SECTION_A.A1.label}</FieldLabel>
              <RadioList
                name="A1"
                options={SECTION_A.A1.options}
                value={a.A1}
                onChange={(v) => setA({ ...a, A1: v })}
              />
              {a.A1 === "Other digital services" && (
                <input
                  className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Please specify"
                  value={a.A1_other ?? ""}
                  onChange={(e) => setA({ ...a, A1_other: e.target.value })}
                />
              )}
              {errors.A1 && <p className="mt-2 text-xs text-destructive">{errors.A1}</p>}
              {errors.A1_other && <p className="mt-1 text-xs text-destructive">{errors.A1_other}</p>}
            </Card>
            {(["A2", "A3", "A4"] as const).map((k) => (
              <Card key={k}>
                <FieldLabel>{SECTION_A[k].label}</FieldLabel>
                <RadioList
                  name={k}
                  options={SECTION_A[k].options}
                  value={a[k] as string | undefined}
                  onChange={(v) => setA({ ...a, [k]: v })}
                />
                {errors[k] && <p className="mt-2 text-xs text-destructive">{errors[k]}</p>}
              </Card>
            ))}
            <Card>
              <FieldLabel help="Select all that apply">{SECTION_A.A5.label}</FieldLabel>
              <CheckboxList
                options={SECTION_A.A5.options}
                values={a.A5 ?? []}
                onToggle={(v) =>
                  setA({
                    ...a,
                    A5: (a.A5 ?? []).includes(v)
                      ? (a.A5 ?? []).filter((x) => x !== v)
                      : [...(a.A5 ?? []), v],
                  })
                }
              />
              {errors.A5 && <p className="mt-2 text-xs text-destructive">{errors.A5}</p>}
            </Card>
            <Card>
              <FieldLabel>{SECTION_A.A6.label}</FieldLabel>
              <RadioList
                name="A6"
                options={SECTION_A.A6.options}
                value={a.A6}
                onChange={(v) => setA({ ...a, A6: v })}
              />
              {a.A6 === "Other" && (
                <input
                  className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Please specify"
                  value={a.A6_other ?? ""}
                  onChange={(e) => setA({ ...a, A6_other: e.target.value })}
                />
              )}
              {errors.A6 && <p className="mt-2 text-xs text-destructive">{errors.A6}</p>}
              {errors.A6_other && <p className="mt-1 text-xs text-destructive">{errors.A6_other}</p>}
            </Card>
          </div>
        )}

        {step >= 1 && step <= 6 && (
          <Card>
            {(() => {
              const prefix = (["B1", "B2", "B3", "B4", "B5", "B6"] as const)[step - 1];
              const blk = SECTION_B_LIKERT[prefix];
              return (
                <>
                  <h2 className="mb-1 text-lg font-semibold">{blk.title}</h2>
                  <p className="mb-4 text-xs text-muted-foreground">
                    For each statement, select Yes if it describes your business or No if it does not.
                  </p>
                  <YesNoGrid
                    items={blk.items}
                    prefix={prefix}
                    values={b}
                    onChange={(k, v) => { setB({ ...b, [k]: v }); setErr(k, null); }}
                  />
                </>
              );
            })()}
          </Card>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <Card>
              <FieldLabel help="Select all that apply">
                B7a. Which of the following has your business experienced in the past 12 months?
              </FieldLabel>
              <CheckboxList
                options={B7a_OPTIONS}
                values={(b.B7a as string[] | undefined) ?? []}
                onToggle={(v) => {
                  const cur = (b.B7a as string[] | undefined) ?? [];
                  setB({ ...b, B7a: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
                }}
              />
              {errors.B7a && <p className="mt-2 text-xs text-destructive">{errors.B7a}</p>}
            </Card>
            <Card>
              <FieldLabel>
                B7b. How many separate cybersecurity incidents did your business experience in the
                past 12 months?
              </FieldLabel>
              <RadioList
                name="B7b"
                options={B7b_OPTIONS}
                value={b.B7b as string | undefined}
                onChange={(v) => setB({ ...b, B7b: v })}
              />
              {errors.B7b && <p className="mt-2 text-xs text-destructive">{errors.B7b}</p>}
            </Card>
            <Card>
              <FieldLabel>
                B7c. What was the most significant impact of a cybersecurity incident on your business
                in the past 12 months?
              </FieldLabel>
              <RadioList
                name="B7c"
                options={B7c_OPTIONS}
                value={b.B7c as string | undefined}
                onChange={(v) => setB({ ...b, B7c: v })}
              />
              {errors.B7c && <p className="mt-2 text-xs text-destructive">{errors.B7c}</p>}
            </Card>
            <Card>
              <h2 className="mb-1 text-lg font-semibold">
                B7d. Severity of the cybersecurity threat environment
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Does each statement apply to your business?
              </p>
              <YesNoGrid
                items={B7d_ITEMS}
                prefix="B7d"
                values={b}
                onChange={(k, v) => { setB({ ...b, [k]: v }); setErr(k, null); }}
              />
            </Card>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            {(["C1", "C2", "C3", "C4"] as const).map((p) => {
              const blk = SECTION_C_BARRIERS[p];
              return (
                <Card key={p}>
                  <h2 className="mb-1 text-lg font-semibold">{blk.title}</h2>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Does each statement apply as a barrier to improving cybersecurity in your business?
                  </p>
                  <BarrierGrid
                    items={blk.items}
                    prefix={p}
                    values={c}
                    onChange={(k, v) => { setC({ ...c, [k]: v }); setErr(k, null); }}
                  />
                </Card>
              );
            })}
            <Card>
              <FieldLabel>
                C5. Of the four barrier categories above, which single category poses the greatest
                obstacle to improving cybersecurity in your business?
              </FieldLabel>
              <RadioList
                name="C5"
                options={C5_OPTIONS}
                value={c.C5 as string | undefined}
                onChange={(v) => setC({ ...c, C5: v })}
              />
              {errors.C5 && <p className="mt-2 text-xs text-destructive">{errors.C5}</p>}
            </Card>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-sm">
              <strong>Almost done.</strong> Having answered Sections A–C, you have just experienced
              the proposed cybersecurity maturity assessment model. Please rate your experience
              below.
            </div>

            <Card>
              <h2 className="mb-1 text-lg font-semibold">D1. Usability rating</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Having completed the assessment, does each statement describe your experience?
              </p>
              <YesNoGrid
                items={D1_ITEMS}
                prefix="D1"
                values={d}
                onChange={(k, v) => { setD({ ...d, [k]: v }); setErr(k, null); }}
              />
            </Card>

            <Card>
              <h2 className="mb-1 text-lg font-semibold">
                D2. Perceived usefulness &amp; adoption intention
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Does each statement apply to how you see yourself using this tool?
              </p>
              <YesNoGrid
                items={D2_ITEMS}
                prefix="D2"
                values={d}
                onChange={(k, v) => { setD({ ...d, [k]: v }); setErr(k, null); }}
              />
            </Card>

            <Card>
              <h2 className="mb-1 text-lg font-semibold">D3. Local relevance &amp; contextual fit</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Does each statement apply to this assessment tool?
              </p>
              <YesNoGrid
                items={D3_ITEMS}
                prefix="D3"
                values={d}
                onChange={(k, v) => { setD({ ...d, [k]: v }); setErr(k, null); }}
              />
            </Card>

            <Card>
              <h2 className="mb-3 text-lg font-semibold">D4. Open-ended feedback</h2>
              {(Object.entries(D4_PROMPTS) as [keyof typeof D4_PROMPTS, string][]).map(
                ([k, prompt]) => (
                  <div key={k} className="mb-4">
                    <label className="mb-1 block text-sm font-medium">{prompt}</label>
                    <textarea
                      rows={3}
                      value={(d[k] as string | undefined) ?? ""}
                      onChange={(e) => {
                        setD({ ...d, [k]: e.target.value });
                        setErr(k, null);
                      }}
                      className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {errors[k] && (
                      <p className="mt-1 text-xs text-destructive">{errors[k]}</p>
                    )}
                  </div>
                ),
              )}
            </Card>
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={step === 0 || busy}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy
              ? "Saving…"
              : step === SURVEY_STEPS.length - 1
                ? "Submit & Claim Reward"
                : "Next →"}
          </button>
        </div>
      </main>
    </div>
  );
}

function YesNoGrid({ items, prefix, values, onChange }: {
  items: readonly string[];
  prefix: string;
  values: Record<string, string | string[] | undefined>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const key = `${prefix}_${i + 1}`;
        const val = values[key] as string | undefined;
        return (
          <div key={key} className="rounded-xl border bg-background p-4 space-y-3">
            <p className="text-sm">{item}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => onChange(key, "yes")}
                className={["flex-1 rounded-lg py-2 text-sm font-semibold transition-colors border",
                  val === "yes" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-secondary"].join(" ")}>
                Yes
              </button>
              <button type="button" onClick={() => onChange(key, "no")}
                className={["flex-1 rounded-lg py-2 text-sm font-semibold transition-colors border",
                  val === "no" ? "border-destructive bg-destructive/10 text-destructive" : "border-input bg-background hover:bg-secondary"].join(" ")}>
                No
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarrierGrid({ items, prefix, values, onChange }: {
  items: readonly string[];
  prefix: string;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const key = `${prefix}_${i + 1}`;
        const val = values[key];
        return (
          <div key={key} className="rounded-xl border bg-background p-4 space-y-3">
            <p className="text-sm">{item}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => onChange(key, "yes")}
                className={["flex-1 rounded-lg py-2 text-sm font-semibold transition-colors border",
                  val === "yes" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-input bg-background hover:border-amber-300"].join(" ")}>
                Yes, this is a barrier
              </button>
              <button type="button" onClick={() => onChange(key, "no")}
                className={["flex-1 rounded-lg py-2 text-sm font-semibold transition-colors border",
                  val === "no" ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:bg-secondary"].join(" ")}>
                No, not a barrier
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
