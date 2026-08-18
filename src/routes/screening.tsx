import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { submitScreening, scanWebsite } from "@/lib/survey/survey.functions";
import { useServerFn } from "@tanstack/react-start";
import { PHONE_REGEX, REWARD_AMOUNT_KES } from "@/lib/survey/schema";
import { Shield, ArrowLeft, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
const SOCIAL_PLATFORMS = [
  "Facebook", "Instagram", "X (Twitter)", "LinkedIn",
  "TikTok", "YouTube", "WhatsApp Business", "Telegram",
];
const AGE_GROUPS = ["18–24", "25–34", "35–44", "45–54", "55 or older"];
const GENDERS = ["Male", "Female", "Non-binary / gender diverse", "Prefer not to say"];
const EDUCATION_LEVELS = [
  "Secondary school (KCSE or equivalent)",
  "College diploma / certificate",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate (PhD)",
  "Other",
];

type ScanResult = {
  ok: true;
  score: number;
  checks: Record<string, { name: string; pass: boolean; description: string }>;
  finalUrl: string;
} | { ok: false; error: string };

type FormState = {
  q1: "yes" | "no" | "";
  q2: string;
  q3: string;
  q4: "yes" | "no" | "";
  fullName: string;
  businessName: string;
  websiteUrl: string;
  socialPlatforms: string[];
  socialHandle: string;
  age: string;
  gender: string;
  education: string;
  phone: string;
  privacyConsent: boolean;
  termsConsent: boolean;
};

function Screening() {
  const navigate = useNavigate();
  const submit = useServerFn(submitScreening);
  const scan = useServerFn(scanWebsite);

  const [form, setForm] = useState<FormState>({
    q1: "", q2: "", q3: "", q4: "",
    fullName: "", businessName: "", websiteUrl: "", socialPlatforms: [], socialHandle: "",
    age: "", gender: "", education: "", phone: "",
    privacyConsent: false, termsConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerScan = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || trimmed.length < 4) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scan({ data: { url: trimmed } });
      setScanResult(result as ScanResult);
    } catch {
      setScanResult({ ok: false, error: "Scan failed. The website may be unreachable." });
    } finally {
      setScanning(false);
    }
  }, [scan]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!form.websiteUrl.trim()) { setScanResult(null); return; }
    debounceRef.current = setTimeout(() => triggerScan(form.websiteUrl), 1800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.websiteUrl, triggerScan]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.q1) e.q1 = "Please answer this question.";
    if (!form.q2) e.q2 = "Select an option.";
    if (!form.q3) e.q3 = "Select an option.";
    if (!form.q4) e.q4 = "Please answer this question.";
    if (!form.fullName.trim()) e.fullName = "Please enter your full name.";
    if (!form.businessName.trim()) e.businessName = "Please enter your business name.";
    if (form.socialPlatforms.length === 0) e.socialPlatforms = "Select at least one platform.";
    if (!form.age) e.age = "Select an option.";
    if (!form.gender) e.gender = "Select an option.";
    if (!form.education) e.education = "Select an option.";
    if (!PHONE_REGEX.test(form.phone)) e.phone = "Format: 07XXXXXXXX or 01XXXXXXXX (10 digits).";
    if (!form.privacyConsent) e.privacyConsent = "You must accept the Privacy Policy to continue.";
    if (!form.termsConsent) e.termsConsent = "You must accept the Terms of Service to continue.";
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
          fullName: form.fullName,
          businessName: form.businessName,
          websiteUrl: form.websiteUrl || undefined,
          socialPlatforms: form.socialPlatforms,
          socialHandle: form.socialHandle || undefined,
          age: form.age,
          gender: form.gender,
          education: form.education,
          phone: form.phone,
          consent: true,
          privacyConsent: form.privacyConsent,
          termsConsent: form.termsConsent,
        },
      });
      if (res.ok) {
        localStorage.setItem("ts_screening_demographics", JSON.stringify({
          fullName: form.fullName,
          businessName: form.businessName,
          websiteUrl: form.websiteUrl,
          socialPlatforms: form.socialPlatforms,
          socialHandle: form.socialHandle,
          websiteScan: scanResult,
          age: form.age,
          gender: form.gender,
          education: form.education,
        }));
        const existingA = JSON.parse(localStorage.getItem("ts_survey_sectionA") || "{}");
        localStorage.setItem("ts_survey_sectionA", JSON.stringify({
          ...existingA,
          A1: form.q2 === "__none" ? "" : form.q2,
          A6: form.q3 === "__none" ? "" : form.q3,
        }));
        navigate({ to: "/survey" });
      } else if (res.reason === "duplicate") {
        setServerErr("Thank you for your interest. You are not qualified.");
      } else if (res.reason === "ineligible") {
        setServerErr("Thank you for your interest. You are not qualified.");
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
          <button onClick={() => navigate({ to: "/" })} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
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
          <FormBlock label="1. Is your business registered and operating in Nairobi County?" error={errors.q1}>
            <RadioGroup name="q1" value={form.q1} onChange={(v) => setForm({ ...form, q1: v as "yes" | "no" })}
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          </FormBlock>

          {/* Q2 */}
          <FormBlock label="2. Which best describes your business?" error={errors.q2}>
            <div className="space-y-2">
              {BUSINESS_TYPES.map((opt) => (
                <RadioRow key={opt} name="q2" value={opt} checked={form.q2 === opt} onChange={() => setForm({ ...form, q2: opt })} label={opt} />
              ))}
              <RadioRow name="q2" value="__none" checked={form.q2 === "__none"} onChange={() => setForm({ ...form, q2: "__none" })} label="None of the above" />
            </div>
          </FormBlock>

          {/* Q3 */}
          <FormBlock label="3. What is your role in the business?" error={errors.q3}>
            <div className="space-y-2">
              {ROLES.map((opt) => (
                <RadioRow key={opt} name="q3" value={opt} checked={form.q3 === opt} onChange={() => setForm({ ...form, q3: opt })} label={opt} />
              ))}
              <RadioRow name="q3" value="__none" checked={form.q3 === "__none"} onChange={() => setForm({ ...form, q3: "__none" })} label="I am not involved in IT or management decisions" />
            </div>
          </FormBlock>

          {/* Q4 */}
          <FormBlock label="4. Does your business actively use any digital platform?" help="e.g. mobile money, cloud tools, online payments, CRM, remote work tools" error={errors.q4}>
            <RadioGroup name="q4" value={form.q4} onChange={(v) => setForm({ ...form, q4: v as "yes" | "no" })}
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          </FormBlock>

          {/* Identity */}
          <FormBlock label="5. Your full name" error={errors.fullName}>
            <input type="text" autoComplete="name" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. Jane Wanjiku"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </FormBlock>

          <FormBlock label="6. Business name" error={errors.businessName}>
            <input type="text" autoComplete="organization" value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="e.g. Wanjiku Tech Solutions"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </FormBlock>

          {/* Website + OWASP scan */}
          <FormBlock label="7. Business website URL" help="Optional — we will automatically check your site for common security issues" error={errors.websiteUrl}>
            <input type="url" value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://yourwebsite.co.ke"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />

            {/* Scan status */}
            {scanning && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning website security headers…
              </div>
            )}
            {scanResult && scanResult.ok && (
              <div className="mt-3 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Website security score</span>
                  <span className={`text-lg font-bold ${scanResult.score >= 70 ? "text-success" : scanResult.score >= 40 ? "text-warning" : "text-destructive"}`}>
                    {scanResult.score}%
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {Object.values(scanResult.checks).map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      {c.pass
                        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                        : <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                      <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">These results will be included in your security report.</p>
              </div>
            )}
            {scanResult && !scanResult.ok && (
              <p className="mt-2 text-xs text-destructive">{scanResult.error}</p>
            )}
          </FormBlock>

          {/* Social media */}
          <FormBlock label="8. Which social media platforms does your business use?" help="Select all that apply" error={errors.socialPlatforms}>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_PLATFORMS.map((platform) => {
                const active = form.socialPlatforms.includes(platform);
                return (
                  <button key={platform} type="button"
                    onClick={() => {
                      const cur = form.socialPlatforms;
                      setForm({ ...form, socialPlatforms: active ? cur.filter((p) => p !== platform) : [...cur, platform] });
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-secondary"}`}>
                    {platform}
                  </button>
                );
              })}
            </div>
          </FormBlock>

          <FormBlock label="9. Your business social media handle" help="Optional — username on your main platform (e.g. @wanjikutech)" error={errors.socialHandle}>
            <input type="text" value={form.socialHandle}
              onChange={(e) => setForm({ ...form, socialHandle: e.target.value })}
              placeholder="@yourbusiness"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </FormBlock>

          {/* Demographics */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed" /></div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-b from-background to-secondary px-3 text-xs font-medium text-muted-foreground">About you (for research purposes only)</span>
            </div>
          </div>

          <FormBlock label="10. What is your age group?" error={errors.age}>
            <RadioGroup name="age" value={form.age} onChange={(v) => setForm({ ...form, age: v })}
              options={AGE_GROUPS.map((a) => ({ value: a, label: a }))} />
          </FormBlock>

          <FormBlock label="11. What is your gender?" error={errors.gender}>
            <RadioGroup name="gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })}
              options={GENDERS.map((g) => ({ value: g, label: g }))} />
          </FormBlock>

          <FormBlock label="12. What is your highest level of education?" error={errors.education}>
            <div className="space-y-2">
              {EDUCATION_LEVELS.map((opt) => (
                <RadioRow key={opt} name="education" value={opt} checked={form.education === opt} onChange={() => setForm({ ...form, education: opt })} label={opt} />
              ))}
            </div>
          </FormBlock>

          {/* Phone */}
          <FormBlock
            label="Your M-Pesa phone number"
            help={`Used only to send your Ksh ${REWARD_AMOUNT_KES} reward after you complete the survey. It will not be linked to your responses or used for any other purpose.`}
            error={errors.phone}>
            <input type="tel" inputMode="numeric" autoComplete="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="07XXXXXXXX"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-invalid={!!errors.phone} />
          </FormBlock>

          {/* Privacy + T&C consent */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-sm font-semibold">Data consent & legal agreement</p>
            <p className="text-xs text-muted-foreground">
              Please read both documents before proceeding.
            </p>

            {/* Privacy Policy */}
            <div>
              <button type="button" onClick={() => setShowPrivacy((v) => !v)}
                className="flex w-full items-center justify-between text-xs font-medium text-primary hover:underline">
                <span>Privacy Policy (Kenya DPA 2019)</span>
                {showPrivacy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showPrivacy && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-3 leading-relaxed">
                  <p className="font-semibold text-foreground">PRIVACY POLICY — TETRASEC SOLUTIONS LTD</p>
                  <p>Effective Date: 13 July 2026 | Data Controller: Tetrasec Solutions Ltd, Nairobi, Kenya</p>
                  <p><strong>1. What we collect.</strong> Full name, business name, M-Pesa phone number, business details (sector, size, years operating), social media presence, cybersecurity survey responses, website security scan results, and demographic information (age, gender, education).</p>
                  <p><strong>2. Why we collect it.</strong> Under the Kenya Data Protection Act 2019, our legal bases are: (a) Consent (s.30) — you have provided explicit informed consent; (b) Contract (s.29) — processing is necessary to issue your KSh {REWARD_AMOUNT_KES} M-Pesa reward; (c) Legitimate interests (s.30(1)(f)) — developing cybersecurity products for Kenyan SMEs.</p>
                  <p><strong>3. Data ownership transfer.</strong> By completing the survey and accepting these terms, you transfer ownership of your survey responses and associated business data to Tetrasec Solutions Ltd. This transfer is conditional on receipt of the KSh {REWARD_AMOUNT_KES} compensation. Tetrasec may use transferred data for: research and development, aggregate benchmarking reports (without identifying individual businesses), AI/ML model training for cybersecurity, internal business intelligence, and commercial licensing of anonymised datasets.</p>
                  <p><strong>4. Your phone number.</strong> Stored in an encrypted, hashed format solely to process your reward. Not used for marketing. Not linked to your survey responses in any published output. Deleted within 12 months of payment confirmation.</p>
                  <p><strong>5. Your rights under Kenya DPA 2019.</strong> You have the right to access (s.26), correct (s.27), delete (s.28), object to (s.31), and receive portable copies of (s.32) your personal data. Note: deletion rights do not apply to data already transferred under the data purchase agreement. Contact: privacy@tetrasec.co.ke</p>
                  <p><strong>6. Data security.</strong> AES-256 encryption at rest. TLS 1.3 in transit. Access restricted to authorised Tetrasec personnel only. Phone numbers stored as one-way cryptographic hashes.</p>
                  <p><strong>7. Retention.</strong> Phone numbers: deleted after payment or within 12 months. Survey responses: retained indefinitely as business data owned by Tetrasec.</p>
                  <p><strong>8. Third parties.</strong> Sub-processors: Supabase Inc (cloud database, US — under DPA/SCCs); Africa's Talking (M-Pesa payments, Kenya). We do not sell personal identifiers to third parties.</p>
                  <p><strong>9. Complaints.</strong> Office of the Data Protection Commissioner (ODPC) Kenya — odpc.go.ke</p>
                </div>
              )}
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.privacyConsent}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-primary" />
                <span className="text-xs">I have read and agree to the <strong>Privacy Policy</strong>.</span>
              </label>
              {errors.privacyConsent && <p className="mt-1 text-xs text-destructive">{errors.privacyConsent}</p>}
            </div>

            {/* Terms of Service */}
            <div>
              <button type="button" onClick={() => setShowTerms((v) => !v)}
                className="flex w-full items-center justify-between text-xs font-medium text-primary hover:underline">
                <span>Terms of Service — Data Participation Agreement</span>
                {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showTerms && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-3 leading-relaxed">
                  <p className="font-semibold text-foreground">TERMS OF SERVICE — DATA PARTICIPATION AGREEMENT</p>
                  <p>Effective Date: 13 July 2026 | Parties: Tetrasec Solutions Ltd (Buyer) and You (Participant/Data Seller)</p>
                  <p><strong>1. Nature of agreement.</strong> This is a commercial data purchase agreement. By completing this survey you are selling your business cybersecurity maturity data to Tetrasec Solutions Ltd in exchange for KSh {REWARD_AMOUNT_KES} sent via M-Pesa upon verification of your submission.</p>
                  <p><strong>2. What you agree to.</strong> (a) Provide accurate, truthful responses; (b) Transfer all survey data to Tetrasec upon completion; (c) Acknowledge that this transfer is irrevocable once payment has been issued; (d) Warrant that you are authorised to disclose the business information provided.</p>
                  <p><strong>3. Payment terms.</strong> KSh {REWARD_AMOUNT_KES} via M-Pesa, processed within 48 hours of verification. Payment is conditional on completing the full survey and passing automated submission quality checks. Tetrasec reserves the right to withhold payment if submissions are found to be fraudulent, duplicate, or substantially incomplete.</p>
                  <p><strong>4. Data rights after transfer.</strong> Once payment is issued, all survey responses become the exclusive property of Tetrasec Solutions Ltd. Tetrasec may use, reproduce, aggregate, license, and commercialise the data without further notice or payment. Tetrasec may publish aggregated findings without identifying your business by name.</p>
                  <p><strong>5. Accuracy warranty.</strong> You warrant that you are the business owner or a senior manager authorised to share business information, that the information is accurate to the best of your knowledge, and that you are not submitting on behalf of a business you do not represent.</p>
                  <p><strong>6. Limitation of liability.</strong> Tetrasec's total liability is limited to the KSh {REWARD_AMOUNT_KES} survey reward. Tetrasec is not liable for indirect or consequential losses arising from your participation.</p>
                  <p><strong>7. Governing law.</strong> Laws of Kenya. Disputes: courts of Nairobi, Kenya. Contact: legal@tetrasec.co.ke</p>
                </div>
              )}
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.termsConsent}
                  onChange={(e) => setForm({ ...form, termsConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-primary" />
                <span className="text-xs">I have read and agree to the <strong>Terms of Service</strong>.</span>
              </label>
              {errors.termsConsent && <p className="mt-1 text-xs text-destructive">{errors.termsConsent}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Checking…" : "Continue to Survey →"}
          </button>
        </form>
      </main>
    </div>
  );
}

function FormBlock({ label, help, error, children }: { label: string; help?: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border bg-card p-5">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {help && <p className="mb-3 text-xs text-muted-foreground">{help}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

function RadioGroup({ name, value, onChange, options }: { name: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <label key={o.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-secondary"}`}>
            <input type="radio" className="sr-only" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

function RadioRow({ name, value, checked, onChange, label }: { name: string; value: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? "border-primary bg-primary/5" : "border-input bg-background hover:bg-secondary"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 accent-primary" />
      <span>{label}</span>
    </label>
  );
}
