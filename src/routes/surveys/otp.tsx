import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { TsButton } from "@/components/surveys/ui/TsButton";
import { TsInput } from "@/components/surveys/ui/TsInput";
import { PHONE_REGEX } from "@/lib/survey/schema";

export const Route = createFileRoute("/surveys/otp")({
  head: () => ({ meta: [{ title: "Verify phone — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: OtpPage,
});

function maskPhone(phone: string) {
  if (phone.length < 10) return phone;
  return phone.slice(0, 4) + "XXX" + phone.slice(-3);
}

function CheckmarkAnim() {
  return (
    <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden="true">
      <circle
        cx="26" cy="26" r="24"
        fill="none"
        stroke="var(--ts-teal)"
        strokeWidth="2.5"
        strokeDasharray="150.8"
        strokeDashoffset="0"
        style={{ animation: "ts-draw-circle 0.4s ease forwards" }}
      />
      <path
        d="M14 27 l8 8 l16-16"
        fill="none"
        stroke="var(--ts-teal)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "ts-draw-check 0.3s 0.4s ease forwards" }}
      />
      <style>{`
        @keyframes ts-draw-circle { to { stroke-dashoffset: 0; } }
        @keyframes ts-draw-check  { to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

function OtpPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string | undefined>();
  const [otp, setOtp] = useState("");
  const [otpErr, setOtpErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown() {
    setResendCooldown(30);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function submitPhone() {
    if (!PHONE_REGEX.test(phone)) {
      setPhoneErr("Enter a valid Kenyan number (07XX or 01XX)");
      return;
    }
    setPhoneErr(undefined);
    setBusy(true);
    // Africa's Talking OTP — key not yet configured; mock for now
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    startCooldown();
    setPhase("otp");
  }

  async function submitOtp() {
    if (otp.length !== 6) {
      setOtpErr("Enter the 6-digit code from your SMS");
      return;
    }
    setBusy(true);
    // Verify OTP — Africa's Talking verify call goes here
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    // Mock: accept any 6-digit code in dev
    if (otp === "000000") {
      setOtpErr("That code doesn't match. Check your SMS and try again.");
      return;
    }
    setOtpErr(undefined);
    setPhase("success");
    setTimeout(() => navigate({ to: "/surveys/section-a" }), 800);
  }

  async function resend() {
    if (resendCooldown > 0) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    setBusy(false);
    startCooldown();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--ts-surface)] px-6">
      <div className="w-full max-w-sm">
        {phase === "phone" && (
          <div className="flex flex-col gap-6">
            <h1
              className="text-center text-[22px] font-semibold text-[var(--ts-text-primary)]"
              style={{ fontFamily: "var(--ts-font-display)" }}
            >
              Verify your phone number
            </h1>
            <TsInput
              label="Phone number"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
              error={phoneErr}
              helperText="We'll send you a 6-digit code"
            />
            <TsButton fullWidth loading={busy} onClick={submitPhone}>
              Send code
            </TsButton>
          </div>
        )}

        {phase === "otp" && (
          <div className="flex flex-col gap-6 text-center">
            <h1
              className="text-[22px] font-semibold text-[var(--ts-text-primary)]"
              style={{ fontFamily: "var(--ts-font-display)" }}
            >
              Enter your code
            </h1>
            <p className="text-sm text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
              We sent a code to +254 {maskPhone(phone.replace(/^0/, ""))}
            </p>

            <div className="flex flex-col items-center gap-1">
              <label htmlFor="otp-field" className="sr-only">6-digit code</label>
              <input
                id="otp-field"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpErr(undefined); }}
                aria-describedby={otpErr ? "otp-error" : undefined}
                aria-invalid={!!otpErr}
                className="w-full rounded-lg border border-[var(--ts-border-strong)] bg-white px-4 py-3 text-center text-[32px] tracking-[0.3em] outline-none focus:border-2 focus:border-[var(--ts-teal)] focus:shadow-[var(--ts-shadow-teal)]"
                style={{ fontFamily: "var(--ts-font-display)" }}
              />
              {otpErr && (
                <p id="otp-error" className="text-xs text-[var(--ts-error)]" style={{ fontFamily: "var(--ts-font-body)" }}>
                  {otpErr}
                </p>
              )}
            </div>

            <TsButton fullWidth loading={busy} onClick={submitOtp}>
              Verify code
            </TsButton>

            <div style={{ fontFamily: "var(--ts-font-body)" }}>
              {resendCooldown > 0 ? (
                <span className="text-sm text-[var(--ts-text-secondary)]">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={resend}
                  className="text-sm text-[var(--ts-teal)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckmarkAnim />
            <p
              className="text-lg font-semibold text-[var(--ts-text-primary)]"
              style={{ fontFamily: "var(--ts-font-display)" }}
            >
              Phone verified
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
