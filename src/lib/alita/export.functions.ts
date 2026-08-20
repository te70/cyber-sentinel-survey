import { createServerFn } from "@tanstack/react-start";
import type { PrismaClient } from "@prisma/client";
import { requireResearcherSession } from "@/lib/researcher-session.server";
import { DOMAIN_IDS, type DomainId } from "./domains";

const ENDORSEMENT_THRESHOLD = 4;

const DATA_DICTIONARY: { sheet: string; column: string; meaning: string }[] = [
  {
    sheet: "Profile",
    column: "pseudonym",
    meaning: "Stable per-SME pseudonym (SME-0001…), never the business name.",
  },
  {
    sheet: "Profile",
    column: "tier",
    meaning: "Final Implementation Tier (A/B/C), after any override.",
  },
  {
    sheet: "Profile",
    column: "tier_overridden",
    meaning: "Whether the SME changed the suggested tier.",
  },
  {
    sheet: "Profile",
    column: "q1..q5_answer",
    meaning: "Section 4.1 self-classification answers (A/B/C each).",
  },
  { sheet: "Profile", column: "signup_date", meaning: "SME record creation date." },
  {
    sheet: "Assessments",
    column: "D1..D6_confirmed",
    meaning: "Confirmed maturity level (0-5) per domain.",
  },
  {
    sheet: "Assessments",
    column: "D1..D6_computed",
    meaning: "Bottom-up cumulative level from the item battery (Current Profile only).",
  },
  {
    sheet: "Assessments",
    column: "band_label",
    meaning: "Composite band (Non-existent…Optimising).",
  },
  {
    sheet: "Assessments",
    column: "gate_applied",
    meaning: "Whether the D4 awareness gate capped the composite.",
  },
  {
    sheet: "Targets",
    column: "target_level",
    meaning: "Level (0-5) the SME marked as their goal for that domain.",
  },
  {
    sheet: "Training",
    column: "completion_pct_overall",
    meaning: "% of all lessons completed, this tier.",
  },
  {
    sheet: "Training",
    column: "completion_pct_D*",
    meaning: "% of that domain's lessons completed.",
  },
  {
    sheet: "Item Responses",
    column: "endorsed",
    meaning: `response_value >= ${ENDORSEMENT_THRESHOLD} (Agree/Strongly Agree).`,
  },
];

async function getOrAssignPseudonym(
  db: PrismaClient,
  smeId: string,
  cache: Map<string, string>,
): Promise<string> {
  const cached = cache.get(smeId);
  if (cached) return cached;

  const existing = await db.smePseudonym.findUnique({ where: { smeId } });
  if (existing) {
    cache.set(smeId, existing.pseudonym);
    return existing.pseudonym;
  }

  const count = await db.smePseudonym.count();
  const pseudonym = `SME-${String(count + 1).padStart(4, "0")}`;
  await db.smePseudonym.create({ data: { smeId, pseudonym } });
  cache.set(smeId, pseudonym);
  return pseudonym;
}

// Extracted so the consent filter itself — the security-critical piece — is directly testable
// with a plain Prisma client, without going through the researcher-session HTTP request context
// (see consent-export.integration.test.ts).
export function getConsentedSmes(db: PrismaClient) {
  return db.sme.findMany({
    where: {
      consentRecords: {
        some: { consentType: "research_participation", revokedAt: null },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

// The actual workbook-building logic, separated from the auth guard so it's directly testable
// with a plain Prisma client (no HTTP request context needed) — see
// consent-export.integration.test.ts.
export async function buildResearchExportWorkbook(db: PrismaClient): Promise<{ base64: string }> {
  const ExcelJS = (await import("exceljs")).default;

  // Only SMEs with an active (non-revoked) research-participation consent are ever included —
  // enforced here at the query level, not left as a policy note.
  const consentedSmes = await getConsentedSmes(db);
  const consentedIds = consentedSmes.map((s) => s.id);
  const smeById = new Map(consentedSmes.map((s) => [s.id, s]));

  const pseudonymCache = new Map<string, string>();
  for (const sme of consentedSmes) {
    await getOrAssignPseudonym(db, sme.id, pseudonymCache);
  }

  const [assessments, trainingCompletions, itemResponses] = await Promise.all([
    db.assessment.findMany({
      where: { smeId: { in: consentedIds } },
      include: { scores: true, compositeResult: true },
      orderBy: { createdAt: "asc" },
    }),
    db.trainingCompletion.findMany({
      where: { smeId: { in: consentedIds } },
      include: { lesson: true },
    }),
    db.itemResponse.findMany({
      where: { assessment: { smeId: { in: consentedIds } } },
      include: { item: true, assessment: true },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();

  // ── Sheet 1: Data Dictionary ────────────────────────────────────────────────────────────
  const dictSheet = workbook.addWorksheet("Data Dictionary");
  dictSheet.columns = [
    { header: "sheet", key: "sheet", width: 16 },
    { header: "column", key: "column", width: 24 },
    { header: "meaning", key: "meaning", width: 70 },
  ];
  dictSheet.addRows(DATA_DICTIONARY);

  // ── Sheet 2: Profile ────────────────────────────────────────────────────────────────────
  const profileSheet = workbook.addWorksheet("Profile");
  profileSheet.columns = [
    { header: "pseudonym", key: "pseudonym", width: 10 },
    { header: "tier", key: "tier", width: 8 },
    { header: "tier_overridden", key: "tierOverridden", width: 16 },
    { header: "q1_answer", key: "q1", width: 10 },
    { header: "q2_answer", key: "q2", width: 10 },
    { header: "q3_answer", key: "q3", width: 10 },
    { header: "q4_answer", key: "q4", width: 10 },
    { header: "q5_answer", key: "q5", width: 10 },
    { header: "signup_date", key: "signupDate", width: 22 },
  ];
  for (const sme of consentedSmes) {
    profileSheet.addRow({
      pseudonym: pseudonymCache.get(sme.id),
      tier: sme.tier,
      tierOverridden: sme.tierOverridden,
      q1: sme.q1Answer,
      q2: sme.q2Answer,
      q3: sme.q3Answer,
      q4: sme.q4Answer,
      q5: sme.q5Answer,
      signupDate: sme.createdAt.toISOString(),
    });
  }

  // ── Sheet 3: Assessments ────────────────────────────────────────────────────────────────
  const assessmentsSheet = workbook.addWorksheet("Assessments");
  assessmentsSheet.columns = [
    { header: "pseudonym", key: "pseudonym", width: 10 },
    { header: "tier", key: "tier", width: 8 },
    { header: "assessment_type", key: "type", width: 18 },
    { header: "status", key: "status", width: 14 },
    { header: "created_at", key: "createdAt", width: 22 },
    ...DOMAIN_IDS.flatMap((id) => [
      { header: `${id}_confirmed`, key: `${id}_confirmed`, width: 14 },
      { header: `${id}_computed`, key: `${id}_computed`, width: 14 },
    ]),
    { header: "band_label", key: "bandLabel", width: 22 },
    { header: "gate_applied", key: "gateApplied", width: 12 },
    { header: "raw_composite", key: "rawComposite", width: 14 },
    { header: "gated_composite", key: "gatedComposite", width: 15 },
  ];
  const currentProfileAssessments = assessments.filter((a) => a.type === "current_profile");
  for (const assessment of currentProfileAssessments) {
    const scoreByDomain = new Map(assessment.scores.map((s) => [s.domainId, s]));
    const row: Record<string, unknown> = {
      pseudonym: pseudonymCache.get(assessment.smeId),
      tier: smeById.get(assessment.smeId)?.tier ?? "",
      type: assessment.type,
      status: assessment.status,
      createdAt: assessment.createdAt.toISOString(),
      bandLabel: assessment.compositeResult?.bandLabel ?? "",
      gateApplied: assessment.compositeResult?.gateApplied ?? "",
      rawComposite: assessment.compositeResult?.rawComposite ?? "",
      gatedComposite: assessment.compositeResult?.gatedComposite ?? "",
    };
    for (const id of DOMAIN_IDS) {
      const score = scoreByDomain.get(id);
      row[`${id}_confirmed`] = score?.level ?? "";
      row[`${id}_computed`] = score?.computedLevel ?? "";
    }
    assessmentsSheet.addRow(row);
  }

  // ── Sheet 4: Targets ────────────────────────────────────────────────────────────────────
  const targetsSheet = workbook.addWorksheet("Targets");
  targetsSheet.columns = [
    { header: "pseudonym", key: "pseudonym", width: 10 },
    { header: "domain", key: "domain", width: 8 },
    { header: "target_level", key: "targetLevel", width: 14 },
    { header: "assessment_date", key: "assessmentDate", width: 22 },
  ];
  const targetAssessments = assessments.filter((a) => a.type === "target_profile");
  for (const assessment of targetAssessments) {
    for (const score of assessment.scores) {
      targetsSheet.addRow({
        pseudonym: pseudonymCache.get(assessment.smeId),
        domain: score.domainId,
        targetLevel: score.level,
        assessmentDate: assessment.createdAt.toISOString(),
      });
    }
  }

  // ── Sheet 5: Training ───────────────────────────────────────────────────────────────────
  const trainingSheet = workbook.addWorksheet("Training");
  trainingSheet.columns = [
    { header: "pseudonym", key: "pseudonym", width: 10 },
    { header: "completion_pct_overall", key: "overall", width: 20 },
    ...DOMAIN_IDS.map((id) => ({ header: `completion_pct_${id}`, key: id, width: 18 })),
  ];
  const completionsBySme = new Map<string, typeof trainingCompletions>();
  for (const c of trainingCompletions) {
    if (!completionsBySme.has(c.smeId)) completionsBySme.set(c.smeId, []);
    completionsBySme.get(c.smeId)!.push(c);
  }
  const lessonCounts = await db.lesson.groupBy({ by: ["domainId", "tier"], _count: true });
  for (const sme of consentedSmes) {
    const completions = completionsBySme.get(sme.id) ?? [];
    const totalLessonsForTier = lessonCounts
      .filter((l) => l.tier === sme.tier)
      .reduce((sum, l) => sum + l._count, 0);
    const row: Record<string, unknown> = {
      pseudonym: pseudonymCache.get(sme.id),
      overall:
        totalLessonsForTier > 0 ? Math.round((completions.length / totalLessonsForTier) * 100) : 0,
    };
    for (const id of DOMAIN_IDS) {
      const domainTotal = lessonCounts
        .filter((l) => l.domainId === id && l.tier === sme.tier)
        .reduce((sum, l) => sum + l._count, 0);
      const domainCompleted = completions.filter((c) => c.lesson.domainId === id).length;
      row[id] = domainTotal > 0 ? Math.round((domainCompleted / domainTotal) * 100) : 0;
    }
    trainingSheet.addRow(row);
  }

  // ── Sheet 6: Item Responses ─────────────────────────────────────────────────────────────
  const itemsSheet = workbook.addWorksheet("Item Responses");
  itemsSheet.columns = [
    { header: "pseudonym", key: "pseudonym", width: 10 },
    { header: "domain", key: "domain", width: 8 },
    { header: "item_id", key: "itemId", width: 38 },
    { header: "level", key: "level", width: 8 },
    { header: "statement_text", key: "statementText", width: 60 },
    { header: "response_value", key: "responseValue", width: 15 },
    { header: "endorsed", key: "endorsed", width: 10 },
  ];
  for (const response of itemResponses) {
    itemsSheet.addRow({
      pseudonym: pseudonymCache.get(response.assessment.smeId),
      domain: response.item.domainId as DomainId,
      itemId: response.itemId,
      level: response.item.level,
      statementText: response.item.statementText,
      responseValue: response.responseValue,
      endorsed: response.responseValue >= ENDORSEMENT_THRESHOLD,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { base64: Buffer.from(buffer).toString("base64") };
}

export const generateResearchExport = createServerFn({ method: "GET" }).handler(async () => {
  await requireResearcherSession();
  const { db } = await import("@/lib/db");
  return buildResearchExportWorkbook(db);
});
