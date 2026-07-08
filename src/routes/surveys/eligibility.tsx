import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TsButton } from "@/components/surveys/ui/TsButton";

export const Route = createFileRoute("/surveys/eligibility")({
  head: () => ({ meta: [{ title: "Eligibility — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: EligibilityPage,
});

const QUESTIONS = [
  {
    id: "digital",
    text: "Is your business a digital service business?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no" },
    ],
  },
  {
    id: "kenya",
    text: "Is your business based in Kenya?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no" },
    ],
  },
  {
    id: "role",
    text: "Are you the owner or a key decision-maker?",
    options: [
      { label: "Yes, I am",       value: "yes" },
      { label: "No, I'm an employee", value: "no" },
    ],
  },
] as const;

type Answers = { digital?: string; kenya?: string; role?: string };

function EligibilityPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [disqualified, setDisqualified] = useState(false);

  const q = QUESTIONS[step];
  const selected = answers[q.id as keyof Answers];

  function advance(value: string) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);

    if (value === "no") {
      setDisqualified(true);
      return;
    }

    if (step < QUESTIONS.length - 1) {
      setExiting("left");
      setTimeout(() => {
        setStep((s) => s + 1);
        setExiting(null);
      }, 300);
    } else {
      navigate({ to: "/surveys/otp" });
    }
  }

  function goBack() {
    if (step === 0) return;
    setExiting("right");
    setTimeout(() => {
      setStep((s) => s - 1);
      setExiting(null);
    }, 300);
  }

  if (disqualified) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--ts-surface)] px-6">
        <div className="max-w-md text-center">
          <p
            className="text-[22px] font-semibold text-[var(--ts-text-primary)]"
            style={{ fontFamily: "var(--ts-font-display)" }}
          >
            This survey is for digital service business owners in Kenya.
          </p>
          <p className="mt-3 text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            You're still welcome to explore our free tools.
          </p>
          <div className="mt-6">
            <TsButton variant="secondary" onClick={() => navigate({ to: "/tools" } as never)}>
              Explore free tools
            </TsButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--ts-surface)] px-6">
      <div className="w-full max-w-md overflow-hidden">
        <div
          style={{
            transform: exiting === "left" ? "translateX(-100%)" : exiting === "right" ? "translateX(100%)" : "translateX(0)",
            transition: "transform 300ms ease",
          }}
        >
          <p className="mb-2 text-center text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
            {step + 1} of {QUESTIONS.length}
          </p>
          <h1
            className="mb-8 text-center text-[22px] font-semibold text-[var(--ts-text-primary)]"
            style={{ fontFamily: "var(--ts-font-display)" }}
          >
            {q.text}
          </h1>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                  className={[
                    "w-full rounded-lg px-4 py-3 text-sm text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
                    isSelected
                      ? "border-2 border-[var(--ts-teal)] bg-[var(--ts-teal-ghost)] text-[var(--ts-text-primary)]"
                      : "border border-[var(--ts-border)] bg-white text-[var(--ts-text-body)]",
                  ].join(" ")}
                  style={{ fontFamily: "var(--ts-font-body)", minHeight: "48px" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <TsButton variant="ghost" onClick={goBack}>← Back</TsButton>
            ) : <span />}
            <TsButton
              variant="primary"
              disabled={!selected}
              onClick={() => selected && advance(selected)}
            >
              Next →
            </TsButton>
          </div>
        </div>
      </div>
    </div>
  );
}
