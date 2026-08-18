import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Download, CheckCircle2, XCircle, AlertTriangle, GraduationCap, ArrowRight, Phone } from "lucide-react";
import { B_DOMAINS, B_RECS, scoreDomain, overallScore, getTier, findGaps, findBarriers } from "@/lib/survey/report";

export const Route = createFileRoute("/surveys/report")({
  head: () => ({ meta: [{ title: "Your Security Report — Tetrasec" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: ReportPage,
});

type ScanCheck = { name: string; pass: boolean; description: string };
type Demographics = {
  fullName?: string; businessName?: string; websiteUrl?: string;
  websiteScan?: { ok: boolean; score?: number; checks?: Record<string, ScanCheck> };
  age?: string; gender?: string; education?: string;
};

const NAVY = "#1A2F42";
const TEAL = "#00C9C8";

function readLocal<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}

// ── PDF generation ────────────────────────────────────────────────────────────
function buildPdfDocument(args: {
  businessName: string;
  today: string;
  totalScore: number;
  tier: string;
  colour: string;
  summary: string;
  domainScores: number[];
  gaps: ReturnType<typeof findGaps>;
  strengths: string[];
  barriers: string[];
  scan: Demographics["websiteScan"];
  websiteUrl: string | undefined;
}): string {
  const {
    businessName, today, totalScore, tier, colour, summary,
    domainScores, gaps, strengths, barriers, scan, websiteUrl,
  } = args;

  // Print-optimised palette
  const N  = "#0B1C2E";   // deep navy
  const T  = "#007E7E";   // deep teal
  const R  = "#B83A2C";   // brick red  (gaps / risk)
  const G  = "#1A6E40";   // forest green (strengths)
  const P  = "#F7F5F1";   // warm paper ground
  const BD = "#DDD9D0";   // warm border
  const MT = "#636E7A";   // slate muted text

  function esc(s: string) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function tintFor(score: number) {
    if (score < 20) return R;
    if (score < 40) return "#C87020";
    if (score < 60) return "#8B6800";
    if (score < 80) return G;
    return T;
  }

  // ── Domain score cards ──────────────────────────────────────────────────
  const domainCards = B_DOMAINS.map((dom, i) => {
    const score = domainScores[i] ?? 0;
    const tint = tintFor(score);
    return `<div style="border:1px solid ${BD};border-radius:4px;padding:15px 16px;background:white;break-inside:avoid;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px;">
    <div style="font-size:11px;font-weight:700;color:${N};text-transform:uppercase;letter-spacing:0.04em;line-height:1.4;max-width:70%;">${esc(dom.label)}</div>
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:${tint};flex-shrink:0;margin-left:8px;">${score}%</div>
  </div>
  <div style="height:4px;background:${BD};border-radius:2px;overflow:hidden;margin-bottom:9px;">
    <div style="height:100%;width:${score}%;background:${tint};"></div>
  </div>
  <div style="font-size:10px;color:${MT};line-height:1.55;">${esc(dom.description)}</div>
</div>`;
  }).join("\n");

  // ── Gap sections grouped by domain ──────────────────────────────────────
  const gapDomains = B_DOMAINS.map((dom, i) => ({
    dom, score: domainScores[i] ?? 0,
    items: gaps.filter((g) => g.key.startsWith(dom.key)),
  })).filter(({ items }) => items.length > 0);

  const gapsHtml = gapDomains.length === 0 ? "" : `
<div style="break-before:page;padding:48px 52px 40px;background:white;">
  <div style="font-size:9px;font-weight:700;color:${T};text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Recommendations</div>
  <div style="padding-bottom:11px;border-bottom:2px solid ${T};display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${N};margin:0;">Where Action Is Needed</h2>
  </div>
  <p style="font-size:12px;color:${MT};margin-top:16px;margin-bottom:32px;line-height:1.65;max-width:560px;">
    The following gaps were identified in your cybersecurity assessment. Each gap is explained in plain English with a specific, practical recommendation and a Tetrasec service that can help you address it.
  </p>
  ${gapDomains.map(({ dom, score, items }, di) => `
  <div style="${di > 0 ? "break-before:page;" : ""}padding-bottom:8px;">
    <div style="display:flex;align-items:center;gap:12px;padding:11px 15px;background:${P};border-radius:4px;margin-bottom:16px;">
      <div style="width:7px;height:7px;border-radius:50%;background:${tintFor(score)};flex-shrink:0;"></div>
      <div style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:${N};">${esc(dom.label)}</div>
      <div style="margin-left:auto;font-family:Georgia,serif;font-size:15px;font-weight:700;color:${tintFor(score)};">${score}%</div>
      <div style="font-size:10px;color:${MT};margin-left:8px;">${items.length} gap${items.length > 1 ? "s" : ""}</div>
    </div>
    ${items.map(({ rec }) => `
    <div style="break-inside:avoid;margin-bottom:11px;border-left:3px solid ${R};">
      <div style="padding:11px 14px;background:#FDF2F2;border-bottom:1px solid #FECACA;">
        <span style="font-size:12px;font-weight:700;color:#7F1D1D;">${esc(rec.gap)}</span>
      </div>
      <div style="padding:10px 14px;background:#FEF9F9;border-bottom:1px solid #FEE2E2;">
        <div style="font-size:9px;font-weight:700;color:${MT};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">What this means</div>
        <div style="font-size:11px;color:#3D4450;line-height:1.65;">${esc(rec.risk)}</div>
      </div>
      <div style="padding:10px 14px;background:white;border-bottom:1px solid ${BD};">
        <div style="font-size:9px;font-weight:700;color:${MT};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Recommended action</div>
        <div style="font-size:11px;color:#3D4450;line-height:1.65;">${esc(rec.recommendation)}</div>
      </div>
      <div style="padding:9px 14px;background:#E4F3F3;">
        <div style="font-size:9px;font-weight:700;color:${T};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">How Tetrasec can help</div>
        <div style="font-size:11px;color:${N};">${esc(rec.tetrasecService)}</div>
      </div>
    </div>`).join("\n")}
  </div>`).join("\n")}
</div>`;

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengthsHtml = strengths.length === 0 ? "" : `
<div style="break-before:page;padding:48px 52px 40px;background:#EEF9F4;">
  <div style="font-size:9px;font-weight:700;color:${G};text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Existing Practices</div>
  <div style="padding-bottom:11px;border-bottom:2px solid ${G};display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${N};margin:0;">What Your Business Does Well</h2>
  </div>
  <p style="font-size:12px;color:${MT};margin-top:16px;margin-bottom:20px;line-height:1.65;max-width:560px;">
    These are areas where your business already has good cybersecurity practices in place. Keep doing these &#8212; they are your current best defences.
  </p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    ${strengths.slice(0, 20).map((s) => `
    <div style="display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid #A7F3D0;border-radius:3px;background:white;break-inside:avoid;">
      <span style="color:${G};font-size:13px;font-weight:700;flex-shrink:0;line-height:1.35;">&#10003;</span>
      <span style="font-size:11px;color:#134E35;line-height:1.5;">${esc(s)}</span>
    </div>`).join("\n")}
  </div>
</div>`;

  // ── Barriers ─────────────────────────────────────────────────────────────
  const barriersHtml = barriers.length === 0 ? "" : `
<div style="break-before:page;padding:48px 52px 40px;background:#FFFCF0;">
  <div style="font-size:9px;font-weight:700;color:#B45309;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Context</div>
  <div style="padding-bottom:11px;border-bottom:2px solid #B45309;display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${N};margin:0;">What Is Holding Your Business Back</h2>
  </div>
  <p style="font-size:12px;color:${MT};margin-top:16px;margin-bottom:20px;line-height:1.65;max-width:560px;">
    You identified the following as barriers to improving cybersecurity. Tetrasec&#8217;s services are designed to help overcome each of them affordably.
  </p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    ${barriers.map((b) => `
    <div style="display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid #FCD34D;border-radius:3px;background:white;break-inside:avoid;">
      <span style="color:#92400E;font-size:14px;font-weight:700;flex-shrink:0;line-height:1.25;">!</span>
      <span style="font-size:11px;color:#78350F;line-height:1.5;">${esc(b)}</span>
    </div>`).join("\n")}
  </div>
</div>`;

  // ── Website security ─────────────────────────────────────────────────────
  const scanHtml = !(scan?.ok && scan.checks) ? "" : `
<div style="break-before:page;padding:48px 52px 40px;background:${P};">
  <div style="font-size:9px;font-weight:700;color:${T};text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Website Security</div>
  <div style="padding-bottom:11px;border-bottom:2px solid ${T};display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${N};margin:0;">Your Website Security</h2>
  </div>
  <p style="font-size:12px;color:${MT};margin-top:16px;margin-bottom:20px;line-height:1.65;max-width:560px;">
    We automatically scanned <strong>${esc(websiteUrl ?? "your website")}</strong> for common web security issues while you completed the eligibility form.
  </p>
  <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;padding:16px 20px;border:1px solid ${BD};border-radius:4px;background:white;">
    <div style="font-family:Georgia,serif;font-size:40px;font-weight:700;color:${(scan.score ?? 0) >= 70 ? G : (scan.score ?? 0) >= 40 ? "#C87020" : R};flex-shrink:0;">${scan.score}%</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:${N};margin-bottom:3px;">Website Security Score</div>
      <div style="font-size:11px;color:${MT};">${(scan.score ?? 0) >= 70 ? "Good foundation &#8212; a few improvements recommended." : (scan.score ?? 0) >= 40 ? "Several important security headers are missing." : "Critical security headers are missing from your website."}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    ${Object.values(scan.checks!).map((c) => `
    <div style="display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid ${c.pass ? "#A7F3D0" : "#FECACA"};border-radius:3px;background:${c.pass ? "white" : "#FEF9F9"};break-inside:avoid;">
      <span style="color:${c.pass ? G : R};font-size:13px;font-weight:700;flex-shrink:0;line-height:1.35;">${c.pass ? "&#10003;" : "&#10005;"}</span>
      <div>
        <div style="font-size:11px;font-weight:700;color:${c.pass ? "#134E35" : "#7F1D1D"};margin-bottom:2px;">${esc(c.name)}</div>
        <div style="font-size:10px;color:${MT};line-height:1.45;">${esc(c.description)}</div>
      </div>
    </div>`).join("\n")}
  </div>
</div>`;

  // ── Services + contact (endpaper) ────────────────────────────────────────
  const servicesHtml = `
<div style="break-before:page;background:${N};padding:48px 52px 40px;color:white;">
  <div style="font-size:9px;font-weight:700;color:#00C9C8;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Get Support</div>
  <div style="padding-bottom:11px;border-bottom:1px solid rgba(255,255,255,0.15);display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:white;margin:0;">How Tetrasec Solutions Can Help</h2>
  </div>
  <p style="font-size:12px;color:rgba(255,255,255,0.52);margin-top:16px;margin-bottom:24px;line-height:1.65;max-width:560px;">
    Tetrasec Solutions Ltd provides practical, affordable cybersecurity services designed specifically for digital SMEs in Nairobi.
    We understand the unique challenges Kenyan businesses face &#8212; from M-Pesa fraud to third-party developer risks to budget constraints.
  </p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px;">
    ${[
      { title: "Security Audit & Risk Assessment", desc: "A structured review of your cybersecurity posture with a prioritised action plan." },
      { title: "Security Policy Development", desc: "Ready-to-use, customised security policies, procedures, and staff guidelines." },
      { title: "Security Awareness Training", desc: "Kenya-specific training that turns your staff into your first line of defence." },
      { title: "Incident Response Planning", desc: "A tested response playbook so your team knows exactly what to do." },
      { title: "DPA 2019 Compliance", desc: "ODPC registration support and data handling procedures for Kenyan law." },
      { title: "Virtual CISO", desc: "Fractional security leadership &#8212; a CISO&#8217;s expertise at an SME-friendly cost." },
    ].map((s) => `
    <div style="border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:14px 16px;background:rgba(255,255,255,0.04);break-inside:avoid;">
      <div style="font-size:11px;font-weight:700;color:#00C9C8;margin-bottom:6px;line-height:1.4;">${s.title}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.46);line-height:1.6;">${s.desc}</div>
    </div>`).join("\n")}
  </div>
  <div style="border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:20px;">
    <div>
      <div style="font-size:14px;font-weight:700;color:white;margin-bottom:5px;">Get a free 30-minute consultation</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.48);max-width:380px;line-height:1.65;">Tell us your top three gaps from this report and we&#8217;ll outline the most cost-effective path forward for your business.</div>
    </div>
    <div style="flex-shrink:0;text-align:right;">
      <div style="font-size:12px;font-weight:700;color:#00C9C8;margin-bottom:4px;">info@tetrasec.co.ke</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.32);">www.tetrasec.co.ke</div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.26);">
    <span>This report is confidential and prepared exclusively for ${esc(businessName)}.</span>
    <span>&#169; ${new Date().getFullYear()} Tetrasec Solutions Ltd. All rights reserved.</span>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cybersecurity Report &#8212; ${esc(businessName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{font-family:Arial,Helvetica,sans-serif;color:#1A1A2A;background:white;}
@page{margin:14mm 18mm;size:A4 portrait;}
@page :first{margin:0;}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;}}
</style>
</head>
<body>

<!-- COVER — full-bleed navy via @page :first margin:0 -->
<div style="break-after:page;background:${N};min-height:100vh;padding:52px 56px;display:flex;flex-direction:column;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:80px;">
    <div style="font-size:11px;font-weight:700;color:#00C9C8;text-transform:uppercase;letter-spacing:0.14em;">Tetrasec Solutions Ltd</div>
    <div style="width:1px;height:11px;background:rgba(255,255,255,0.2);"></div>
    <div style="font-size:10px;color:rgba(255,255,255,0.36);">Cybersecurity for Kenyan SMEs</div>
  </div>
  <div style="flex:1;">
    <div style="font-size:9px;font-weight:700;color:#00C9C8;text-transform:uppercase;letter-spacing:0.18em;margin-bottom:22px;">Confidential &#8212; Management Report</div>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:58px;font-weight:700;color:white;line-height:1.05;margin-bottom:20px;">Cybersecurity<br>Maturity<br>Assessment</h1>
    <div style="font-family:Georgia,serif;font-size:19px;color:rgba(255,255,255,0.56);margin-bottom:56px;">${esc(businessName)}</div>
    <div style="display:flex;align-items:center;gap:44px;">
      <div style="flex-shrink:0;width:144px;height:144px;border-radius:50%;border:5px solid ${colour};display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.04);">
        <span style="font-family:Georgia,serif;font-size:50px;font-weight:700;color:white;line-height:1;">${totalScore}</span>
        <span style="font-size:9px;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.12em;margin-top:6px;">out of 100</span>
      </div>
      <div>
        <div style="display:inline-block;padding:4px 14px;border-radius:100px;border:1px solid ${colour}70;background:${colour}22;margin-bottom:13px;">
          <span style="font-size:12px;font-weight:700;color:${colour};font-family:Georgia,serif;">Maturity Level: ${esc(tier)}</span>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);max-width:360px;line-height:1.78;">${esc(summary)}</div>
      </div>
    </div>
  </div>
  <div style="padding-top:18px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.26);">
    <span>Date of Assessment: ${esc(today)}</span>
    <span>Prepared by: Tetrasec Solutions Ltd</span>
  </div>
</div>

<!-- SCORE OVERVIEW -->
<div style="break-after:page;padding:48px 52px;background:${P};">
  <div style="font-size:9px;font-weight:700;color:${T};text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">Security Assessment</div>
  <div style="padding-bottom:11px;border-bottom:2px solid ${T};display:inline-block;margin-bottom:0;">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${N};margin:0;">Your Security Score by Area</h2>
  </div>
  <p style="font-size:12px;color:${MT};margin-top:16px;margin-bottom:24px;line-height:1.65;max-width:560px;">
    We assessed your cybersecurity across six key areas. Each score shows the percentage of good practices your business currently has in place.
    A score of 0% means no practices are in place; 100% means all practices are fully implemented.
  </p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:24px;">
    ${domainCards}
  </div>
  <div style="padding:16px 20px;border:1px solid ${BD};border-radius:4px;background:white;display:flex;align-items:center;gap:18px;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:700;color:${colour};flex-shrink:0;">${totalScore}</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:${N};margin-bottom:5px;">Overall Score &#8212; ${esc(tier)}</div>
      <div style="height:5px;background:${BD};border-radius:2px;overflow:hidden;width:220px;">
        <div style="height:100%;width:${totalScore}%;background:${colour};border-radius:2px;"></div>
      </div>
      <div style="font-size:10px;color:${MT};margin-top:5px;">Average across all six security domains</div>
    </div>
  </div>
</div>

${gapsHtml}
${strengthsHtml}
${barriersHtml}
${scanHtml}
${servicesHtml}

</body>
</html>`;
}

// ── Screen component ──────────────────────────────────────────────────────────
function ReportPage() {
  const [sectionB, setSectionB] = useState<Record<string, string>>({});
  const [sectionC, setSectionC] = useState<Record<string, string>>({});
  const [demographics, setDemographics] = useState<Demographics>({});

  useEffect(() => {
    const localB = readLocal<Record<string, string>>("ts_survey_sectionB", {});
    const localC = readLocal<Record<string, string>>("ts_survey_sectionC", {});
    const localD = readLocal<Demographics>("ts_screening_demographics", {});
    setSectionB(localB);
    setSectionC(localC);
    setDemographics(localD);

    // Pull from DB while the session cookie is still alive (deleted inside getReportData).
    // This covers port-switch / incognito edge cases where localStorage is empty.
    import("@/lib/survey/survey.functions").then(({ getReportData }) =>
      getReportData().then((res) => {
        if (res.ok) {
          if (res.sectionB && Object.keys(res.sectionB).length > 0) setSectionB(res.sectionB);
          if (res.sectionC && Object.keys(res.sectionC).length > 0) setSectionC(res.sectionC);
        }
      }).catch(() => {/* session already expired — localStorage is the source */})
    );
  }, []);

  const domainScores = B_DOMAINS.map((dom) => scoreDomain(sectionB, dom.key, dom.questionCount));
  const totalScore = overallScore(domainScores);
  const { tier, colour, summary } = getTier(totalScore);
  const gaps = findGaps(sectionB);
  const barriers = findBarriers(sectionC);
  const strengths = Object.keys(B_RECS)
    .filter((k) => sectionB[k] === "yes")
    .map((k) => {
      const rec = B_RECS[k];
      return rec.strength ?? rec.gap.replace(/^No /, "Has ").replace(/^Not /, "");
    });

  const scan = demographics.websiteScan;
  const businessName = demographics.businessName ?? "Your Business";
  const today = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

  function handleDownload() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPdfDocument({
      businessName, today, totalScore, tier, colour, summary,
      domainScores, gaps, strengths, barriers, scan,
      websiteUrl: demographics.websiteUrl,
    }));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-sm font-semibold" style={{ color: NAVY }}>Survey complete — thank you</div>
          <div className="text-xs text-gray-400">Your cybersecurity report is ready below</div>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Report body */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", background: "white" }}>

        {/* ── Cover page ────────────────────────────────────────────────── */}
        <div style={{ background: NAVY, color: "white", padding: "48px 40px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${TEAL}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield style={{ color: TEAL, width: 24, height: 24 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tetrasec Solutions Ltd</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Cybersecurity for Kenyan SMEs</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Confidential</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>
            Cybersecurity<br />Maturity Report
          </h1>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", marginBottom: 32 }}>{businessName}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", border: `6px solid ${TEAL}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: "white", lineHeight: 1 }}>{totalScore}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>out of 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: colour, marginBottom: 6 }}>Maturity Level: {tier}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", maxWidth: 420, lineHeight: 1.6 }}>{summary}</div>
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 40, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <span>Date: {today}</span>
            <span>Prepared by: Tetrasec Solutions Ltd</span>
            <span>Audience: Management</span>
          </div>
        </div>

        {/* ── Domain scores ─────────────────────────────────────────────── */}
        <Section title="Your Security Score by Area">
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
            We assessed your cybersecurity across six key areas. Each score shows the percentage of good practices your business currently has in place.
            A score of 0% means no practices are in place; 100% means all practices are fully implemented.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {B_DOMAINS.map((dom, i) => {
              const score = domainScores[i] ?? 0;
              const { colour: dc } = getTier(score);
              return (
                <div key={dom.key} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, maxWidth: "70%" }}>{dom.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: dc }}>{score}%</div>
                  </div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, marginBottom: 10 }}>
                    <div style={{ height: "100%", width: `${score}%`, background: dc, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{dom.description}</div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Strengths ─────────────────────────────────────────────────── */}
        {strengths.length > 0 && (
          <Section title="What Your Business Does Well" bg="#f0fdf4">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
              These are areas where your business already has good cybersecurity practices in place. Keep doing these — they are your current best defences.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              {strengths.slice(0, 18).map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "white", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
                  <CheckCircle2 style={{ color: "#22c55e", width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "#166534" }}>{s}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Gaps & Recommendations ──────────────────────────────────────── */}
        {gaps.length > 0 && (
          <Section title="Where Action Is Needed">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
              The following gaps were identified in your cybersecurity assessment. Each gap is explained in plain English with a specific, practical recommendation and a Tetrasec service that can help you address it.
            </p>
            {B_DOMAINS.map((dom) => {
              const domGaps = gaps.filter((g) => g.key.startsWith(dom.key));
              if (domGaps.length === 0) return null;
              return (
                <div key={dom.key} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${NAVY}18` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{dom.label}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>{domGaps.length} gap{domGaps.length > 1 ? "s" : ""} identified</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {domGaps.map(({ key, rec }) => (
                      <div key={key} style={{ border: "1px solid #fee2e2", borderLeft: "4px solid #ef4444", borderRadius: 10, padding: 18, background: "#fff5f5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <XCircle style={{ color: "#ef4444", width: 16, height: 16, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>{rec.gap}</span>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>What this means for your business</span>
                          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginTop: 4 }}>{rec.risk}</p>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>What to do</span>
                          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginTop: 4 }}>{rec.recommendation}</p>
                        </div>
                        <div style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}40`, borderRadius: 8, padding: "10px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: "0.06em" }}>How Tetrasec can help</span>
                          <p style={{ fontSize: 12, color: NAVY, marginTop: 3 }}>{rec.tetrasecService}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* ── Website security ──────────────────────────────────────────── */}
        {scan?.ok && scan.checks && (
          <Section title="Your Website Security" bg="#f8fafc">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
              We automatically scanned <strong>{demographics.websiteUrl}</strong> for common web security issues while you completed the eligibility form.
              These checks test for security controls recommended by OWASP (the Open Web Application Security Project) — the global standard for web security.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: (scan.score ?? 0) >= 70 ? "#22c55e" : (scan.score ?? 0) >= 40 ? "#eab308" : "#ef4444" }}>
                {scan.score}%
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Website Security Score</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {(scan.score ?? 0) >= 70 ? "Good foundation — a few improvements recommended." : (scan.score ?? 0) >= 40 ? "Several important security headers are missing." : "Critical security headers are missing from your website."}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
              {Object.values(scan.checks).map((c) => (
                <div key={c.name} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: `1px solid ${c.pass ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, padding: "10px 14px", background: c.pass ? "#f0fdf4" : "#fff5f5" }}>
                  {c.pass
                    ? <CheckCircle2 style={{ color: "#22c55e", width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                    : <XCircle style={{ color: "#ef4444", width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.pass ? "#166534" : "#991b1b" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.description}</div>
                  </div>
                </div>
              ))}
            </div>
            {!Object.values(scan.checks).every((c) => c.pass) && (
              <div style={{ marginTop: 20, background: `${TEAL}10`, border: `1px solid ${TEAL}40`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Tetrasec Web Security Audit</div>
                <div style={{ fontSize: 13, color: "#374151" }}>
                  Our web security team can assess and fix the missing headers above, along with a broader OWASP Top 10 check of your website.
                  Contact us at <strong>info@tetrasec.co.ke</strong> for a quote.
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Barriers ──────────────────────────────────────────────────── */}
        {barriers.length > 0 && (
          <Section title="What Is Holding Your Business Back">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
              You identified the following as barriers to improving cybersecurity in your business.
              Recognising these barriers is the first step — Tetrasec's SME-focused services are designed to help overcome each of them affordably.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
              {barriers.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", background: "#fffbeb" }}>
                  <AlertTriangle style={{ color: "#d97706", width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: "#92400e" }}>{b}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── How Tetrasec can help ─────────────────────────────────────── */}
        <Section title="How Tetrasec Solutions Can Help" bg={`${NAVY}08`}>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
            Tetrasec Solutions Ltd provides practical, affordable cybersecurity services designed specifically for digital SMEs in Nairobi.
            We understand the unique challenges Kenyan businesses face — from M-Pesa fraud to third-party developer risks to budget constraints.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 28 }}>
            {[
              { title: "Security Audit & Risk Assessment", desc: "A structured review of your cybersecurity posture with a prioritised action plan." },
              { title: "Security Policy Development", desc: "Ready-to-use, customised security policies, procedures, and staff guidelines." },
              { title: "Security Awareness Training", desc: "Engaging, Kenya-specific training that turns your staff from your biggest risk into your first line of defence." },
              { title: "Incident Response Planning", desc: "A tested response playbook so your team knows exactly what to do when something goes wrong." },
              { title: "DPA 2019 Compliance", desc: "ODPC registration support and data handling procedures to keep you compliant with Kenyan law." },
              { title: "Virtual CISO", desc: "Fractional security leadership — the expertise of a Chief Information Security Officer at an SME-friendly cost." },
            ].map((s) => (
              <div key={s.title} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, background: "white" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: NAVY, borderRadius: 12, padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>Get a free 30-minute consultation</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>Tell us your top three gaps from this report and we'll outline the most cost-effective path forward for your business.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <a href="mailto:info@tetrasec.co.ke" style={{ display: "flex", alignItems: "center", gap: 6, color: TEAL, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Phone style={{ width: 14, height: 14 }} /> info@tetrasec.co.ke
              </a>
              <a href="https://www.tetrasec.co.ke" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textDecoration: "none" }}>
                www.tetrasec.co.ke
              </a>
            </div>
          </div>
        </Section>

        {/* ── Tetrasec Academy ─────────────────────────────────────────── */}
        <Section title="">
          <div style={{ border: `2px solid ${TEAL}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: NAVY, padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${TEAL}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GraduationCap style={{ color: TEAL, width: 26, height: 26 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em" }}>Tetrasec Academy</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginTop: 4 }}>Data Science for Business</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 6, maxWidth: 480 }}>
                  Learn how to turn your everyday business data into confident decisions. A 6-week, Kenya-focused course for SME owners and managers — no coding required.
                </div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", padding: "20px 28px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {["Spot your most profitable customers", "Forecast cash flow in Google Sheets", "Understand Kenya DPA 2019"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
                    <CheckCircle2 style={{ color: "#22c55e", width: 14, height: 14 }} />
                    {item}
                  </div>
                ))}
              </div>
              <a href="https://www.tetrasec.co.ke/academy" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TEAL, color: NAVY, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                Enrol — first module free <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          </div>
        </Section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{ background: NAVY, padding: "24px 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Tetrasec Solutions Ltd</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Nairobi, Kenya · Cybersecurity for Digital SMEs</div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
            <div>This report is confidential and prepared exclusively for {businessName}.</div>
            <div>© {new Date().getFullYear()} Tetrasec Solutions Ltd. All rights reserved.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, bg }: { title: string; children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ background: bg ?? "white", padding: "40px 40px 32px" }}>
      {title && (
        <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 6, paddingBottom: 12, borderBottom: `3px solid ${TEAL}`, display: "inline-block" }}>
          {title}
        </h2>
      )}
      <div style={{ marginTop: title ? 24 : 0 }}>{children}</div>
    </div>
  );
}
