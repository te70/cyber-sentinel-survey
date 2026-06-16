import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { submitScreening } from "@/lib/survey/survey.functions";
import { useServerFn } from "@tanstack/react-start";
import { PHONE_REGEX, REWARD_AMOUNT_KES } from "@/lib/survey/schema";
import { Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/screening")({
  head: () => ({
    meta: [
      { title: "Eligibility — Cybersecurity Maturity Survey" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Screening,
});

const BUSINESS_TYPES = [
  "Software development / IT services",
  "Digital marketing / creative agency",
  "Fintech / mobile money / payment services",
  "E-commerce / online retail",
  "Cloud / SaaS services",
  "IT consultancy / managed services",
  "Other digital services",
];
const ROLES = [
  "Business Owner / CEO / Director",
  "IT Manager / Systems Administrator",
  "Cybersecurity Officer / IT Security Lead",
  "Operations Manager",
  "Other senior role with IT oversight",
];

type FormState = {
  q1: "yes" | "no" | "";
  q2: string;
  q3: string;
  q4: "yes" | "no" | "";
  phone: string;
};

function Screening() {
  const navigate = useNavigate();
  const submit = useServerFn(submitScreening);
  const [form, setForm] = useState<FormState>({ q1: "", q2: "", q3: "", q4: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.q1) e.q1 = "Please answer this question.";
    if (!form.q2) e.q2 = "Select an option.";
    if (!form.q3) e.q3 = "Select an option.";
    if (!form.q4) e.q4 = "Please answer this question.";
    if (!PHONE_REGEX.test(form.phone)) e.phone = "Format: 07XXXXXXXX or 01XXXXXXXX (10 digits).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerErr(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await submit({
        data: {
          q1_nairobi: form.q1 === "yes",
          q2_business_type: form.q2 === "__none" ? "NONE" : form.q2,
          q3_role: form.q3 === "__none" ? "NONE" : form.q3,
          q4_digital_platform: form.q4 === "yes",
          phone: form.phone,
          consent: true,
        },
      });
      if (res.ok) {
        navigate({ to: "/survey" });
      } else if (res.reason === "duplicate") {
        setServerErr(
          "Our records show this number has already completed the survey. Each participant may respond once. Thank you for your interest.",
        );
      } else if (res.reason === "ineligible") {
        navigate({ to: "/screening", search: { ineligible: 1 } as never });
        setServerErr(
          "Thank you for your interest. Based on your answers, this study is looking for a different respondent profile. We appreciate your time.",
        );
      } else {
        setServerErr("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setServerErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mx-auto inline-flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-success" /> Eligibility check
          </div>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold">A few quick questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We need to confirm you fit the study's target group before unlocking the survey.
        </p>

        {serverErr && (
          <div className="mt-6 rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {serverErr}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
          {/* Q1 */}
          <FormBlock
            label="1. Is your business registered and operating in Nairobi County?"
            error={errors.q1}
          >
            <RadioGroup
              name="q1"
              value={form.q1}
              onChange={(v) => setForm({ ...form, q1: v as FormState["q1"] })}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </FormBlock>

          {/* Q2 */}
          <FormBlock label="2. Which best describes your business?" error={errors.q2}>
            <div className="space-y-2">
              {BUSINESS_TYPES.map((opt) => (
                <RadioRow
                  key={opt}
                  name="q2"
                  value={opt}
                  checked={form.q2 === opt}
                  onChange={() => setForm({ ...form, q2: opt })}
                  label={opt}
                />
              ))}
              <RadioRow
                name="q2"
                value="__none"
                checked={form.q2 === "__none"}
                onChange={() => setForm({ ...form, q2: "__none" })}
                label="None of the above"
              />
            </div>
          </FormBlock>

          {/* Q3 */}
          <FormBlock label="3. What is your role in the business?" error={errors.q3}>
            <div className="space-y-2">
              {ROLES.map((opt) => (
                <RadioRow
                  key={opt}
                  name="q3"
                  value={opt}
                  checked={form.q3 === opt}
                  onChange={() => setForm({ ...form, q3: opt })}
                  label={opt}
                />
              ))}
              <RadioRow
                name="q3"
                value="__none"
                checked={form.q3 === "__none"}
                onChange={() => setForm({ ...form, q3: "__none" })}
                label="I am not involved in IT or management decisions"
              />
            </div>
          </FormBlock>

          {/* Q4 */}
          <FormBlock
            label="4. Does your business actively use any digital platform?"
            help="e.g. mobile money, cloud tools, online payments, CRM, remote work tools"
            error={errors.q4}
          >
            <RadioGroup
              name="q4"
              value={form.q4}
              onChange={(v) => setForm({ ...form, q4: v as FormState["q4"] })}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </FormBlock>

          {/* Phone */}
          <FormBlock
            label="Your M-Pesa phone number"
            help={`Used only to send your Ksh ${REWARD_AMOUNT_KES} reward after you complete the survey. It will not be linked to your responses or used for any other purpose.`}
            error={errors.phone}
          >
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              placeholder="07XXXXXXXX"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-invalid={!!errors.phone}
            />
          </FormBlock>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Checking…" : "Continue to Survey →"}
          </button>
        </form>
      </main>
    </div>
  );
}

function FormBlock({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border bg-card p-5">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {help && <p className="mb-3 text-xs text-muted-foreground">{help}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <label
            key={o.value}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

function RadioRow({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
        checked ? "border-primary bg-primary/5" : "border-input bg-background hover:bg-secondary"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}
