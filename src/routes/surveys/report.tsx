import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Shield, Download, CheckCircle2, XCircle, AlertTriangle, GraduationCap, ArrowRight, Phone } from "lucide-react";
import { B_DOMAINS, B_RECS, scoreDomain, overallScore, getTier, findGaps, findBarriers } from "@/lib/survey/report";

export const Route = createFileRoute("/surveys/report")({
  head: () => ({ meta: [{ title: "Your Security Report — Tetrasec" }, { name: "robots", content: "noindex" }] }),
  component: ReportPage,
});

type ScanCheck = { name: string; pass: boolean; description: string };
type Demographics = { fullName?: string; businessName?: string; websiteUrl?: string; websiteScan?: { ok: boolean; score?: number; checks?: Record<string, ScanCheck> }; age?: string; gender?: string; education?: string };

const NAVY = "#1A2F42";
const TEAL = "#00C9C8";

function ReportPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [sectionB, setSectionB] = useState<Record<string, string>>({});
  const [sectionC, setSectionC] = useState<Record<string, string>>({});
  const [demographics, setDemographics] = useState<Demographics>({});
  const [domainScores, setDomainScores] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const b = JSON.parse(localStorage.getItem("ts_survey_sectionB") || "{}");
    const c = JSON.parse(localStorage.getItem("ts_survey_sectionC") || "{}");
    const d = JSON.parse(localStorage.getItem("ts_screening_demographics") || "{}");
    setSectionB(b);
    setSectionC(c);
    setDemographics(d);
    const scores = B_DOMAINS.map((dom) => scoreDomain(b, dom.key, dom.questionCount));
    setDomainScores(scores);
    setTotalScore(overallScore(scores));
    setReady(true);
  }, []);

  function handleDownload() {
    const el = printRef.current;
    if (!el) return;
    const styles = Array.from(document.styleSheets)
      .flatMap((sheet) => { try { return Array.from(sheet.cssRules).map((r) => r.cssText); } catch { return []; } })
      .join("\n");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cybersecurity Report — ${demographics.businessName ?? "Your Business"}</title>
<style>
${styles}
@media print {
  body { margin: 0; }
  .no-print { display: none !important; }
  .page-break { page-break-before: always; }
}
body { font-family: 'DM Sans', sans-serif; background: white; color: #1a1a2e; margin: 0; padding: 0; }
</style></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  const { tier, colour, summary } = getTier(totalScore);
  const gaps = ready ? findGaps(sectionB) : [];
  const barriers = ready ? findBarriers(sectionC) : [];
  const strengths = ready
    ? Object.keys(B_RECS).filter((k) => sectionB[k] === "yes").map((k) => B_RECS[k].gap.replace("No ", "Has ").replace("Not ", ""))
    : [];
  const scan = demographics.websiteScan;
  const businessName = demographics.businessName ?? "Your Business";
  const today = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00C9C8] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/surveys/complete" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
        <span className="text-sm font-semibold" style={{ color: NAVY }}>Cybersecurity Maturity Report</span>
        <button onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: TEAL }}>
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Report body */}
      <div ref={printRef} style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", background: "white" }}>

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

          {/* Score ring */}
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
                    <div style={{ height: "100%", width: `${score}%`, background: dc, borderRadius: 3, transition: "width 0.6s ease" }} />
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

            {/* Group by domain */}
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

        {/* ── Tetrasec Academy Ad ───────────────────────────────────────── */}
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
