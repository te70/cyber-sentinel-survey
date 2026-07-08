import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TsButton } from "@/components/surveys/ui/TsButton";

export const Route = createFileRoute("/surveys/complete")({
  head: () => ({ meta: [{ title: "Survey complete — Tetrasec Surveys" }, { name: "robots", content: "noindex" }] }),
  component: CompletePage,
});

function AnimatedCheckmark() {
  return (
    <svg viewBox="0 0 52 52" className="h-16 w-16" aria-hidden="true">
      <style>{`
        @keyframes ts-draw-circle-c { 0%{stroke-dashoffset:150.8} 100%{stroke-dashoffset:0} }
        @keyframes ts-draw-check-c  { 0%{stroke-dashoffset:30}    100%{stroke-dashoffset:0} }
      `}</style>
      <circle
        cx="26" cy="26" r="24"
        fill="none"
        stroke="var(--ts-teal)"
        strokeWidth="2.5"
        strokeDasharray="150.8"
        strokeDashoffset="150.8"
        style={{ animation: "ts-draw-circle-c 0.5s ease forwards" }}
      />
      <path
        d="M14 27 l8 8 l16-16"
        fill="none"
        stroke="var(--ts-teal)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="30"
        strokeDashoffset="30"
        style={{ animation: "ts-draw-check-c 0.3s 0.5s ease forwards" }}
      />
    </svg>
  );
}

function CompletePage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      style={{ backgroundColor: "var(--ts-teal-pale)" }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 400ms ease, transform 400ms ease",
        }}
        className="flex flex-col items-center gap-5"
      >
        <AnimatedCheckmark />

        <h1
          className="text-[28px] font-bold text-[var(--ts-text-primary)]"
          style={{ fontFamily: "var(--ts-font-display)" }}
        >
          You're done — thank you
        </h1>

        <p
          className="max-w-md text-base text-[var(--ts-text-body)]"
          style={{ fontFamily: "var(--ts-font-body)" }}
        >
          We're verifying your submission. You'll receive your free maturity report
          and KSh 50 via M-PESA within 48 hours.
        </p>

        <Link to={"/tools" as never}>
          <TsButton variant="ghost">
            Explore your free tools while you wait →
          </TsButton>
        </Link>
      </div>
    </div>
  );
}
