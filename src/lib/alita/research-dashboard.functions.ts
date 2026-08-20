import { createServerFn } from "@tanstack/react-start";
import type { PrismaClient } from "@prisma/client";
import { requireResearcherSession } from "@/lib/researcher-session.server";
import { getConsentedSmes } from "./export.functions";
import { DOMAINS, DOMAIN_IDS, type DomainId } from "./domains";
import { BAND_THRESHOLDS } from "./scoring";

// Aggregate-only analysis of the consented population — no business names or pseudonyms appear
// anywhere in this output (a stricter privacy posture than the Excel export, which at least
// needs stable per-row pseudonyms). Reuses getConsentedSmes so the dashboard and export always
// describe the exact same population. Pure/testable — real PrismaClient in, plain object out —
// same extraction pattern as buildResearchExportWorkbook/buildSmeDashboard elsewhere.
export async function buildResearchDashboard(db: PrismaClient) {
  const consentedSmes = await getConsentedSmes(db);
  const consentedIds = consentedSmes.map((s) => s.id);

  const [assessments, trainingCompletions, lessonCounts, revokedConsentCount] = await Promise.all([
    db.assessment.findMany({
      where: { smeId: { in: consentedIds } },
      include: { scores: true, compositeResult: true, dpaCheckpoints: true },
    }),
    db.trainingCompletion.findMany({
      where: { smeId: { in: consentedIds } },
      include: { lesson: true },
    }),
    db.lesson.groupBy({ by: ["domainId", "tier"], _count: true }),
    db.sme.count({
      where: {
        consentRecords: {
          some: { consentType: "research_participation", revokedAt: { not: null } },
        },
      },
    }),
  ]);

  // ── Population ──────────────────────────────────────────────────────────────────────────
  const tierDistribution: Record<"A" | "B" | "C", number> = { A: 0, B: 0, C: 0 };
  for (const sme of consentedSmes) tierDistribution[sme.tier]++;

  // ── Assessment funnel ───────────────────────────────────────────────────────────────────
  const currentComplete = assessments.filter(
    (a) => a.type === "current_profile" && a.status === "complete",
  );
  const currentInProgress = assessments.filter(
    (a) => a.type === "current_profile" && a.status === "in_progress",
  );
  const targetComplete = assessments.filter(
    (a) => a.type === "target_profile" && a.status === "complete",
  );

  // ── Maturity results (complete Current Profile assessments only) ──────────────────────────
  const bandDistribution: Record<string, number> = Object.fromEntries(
    BAND_THRESHOLDS.map((b) => [b.label, 0]),
  );
  let compositeSum = 0;
  let gateAppliedCount = 0;
  for (const a of currentComplete) {
    if (!a.compositeResult) continue;
    bandDistribution[a.compositeResult.bandLabel] =
      (bandDistribution[a.compositeResult.bandLabel] ?? 0) + 1;
    compositeSum += a.compositeResult.gatedComposite;
    if (a.compositeResult.gateApplied) gateAppliedCount++;
  }
  const averageComposite = currentComplete.length > 0 ? compositeSum / currentComplete.length : 0;
  const gateAppliedRate =
    currentComplete.length > 0 ? gateAppliedCount / currentComplete.length : 0;

  const domainLevelSums = new Map(DOMAIN_IDS.map((id) => [id, { sum: 0, count: 0 }]));
  for (const a of currentComplete) {
    for (const s of a.scores) {
      const bucket = domainLevelSums.get(s.domainId as DomainId);
      if (!bucket) continue;
      bucket.sum += s.level;
      bucket.count += 1;
    }
  }
  const domainAverages = DOMAIN_IDS.map((id) => {
    const bucket = domainLevelSums.get(id)!;
    return {
      domainId: id,
      label: DOMAINS.find((d) => d.id === id)!.label,
      average: bucket.count > 0 ? bucket.sum / bucket.count : 0,
    };
  });

  // ── Training engagement ─────────────────────────────────────────────────────────────────
  const completionsBySme = new Map<string, typeof trainingCompletions>();
  for (const c of trainingCompletions) {
    if (!completionsBySme.has(c.smeId)) completionsBySme.set(c.smeId, []);
    completionsBySme.get(c.smeId)!.push(c);
  }
  let completionPercentSum = 0;
  const domainCompletion = new Map(DOMAIN_IDS.map((id) => [id, { completed: 0, possible: 0 }]));
  for (const sme of consentedSmes) {
    const completions = completionsBySme.get(sme.id) ?? [];
    const totalForTier = lessonCounts
      .filter((l) => l.tier === sme.tier)
      .reduce((sum, l) => sum + l._count, 0);
    completionPercentSum += totalForTier > 0 ? (completions.length / totalForTier) * 100 : 0;

    for (const id of DOMAIN_IDS) {
      const bucket = domainCompletion.get(id)!;
      bucket.possible += lessonCounts
        .filter((l) => l.domainId === id && l.tier === sme.tier)
        .reduce((sum, l) => sum + l._count, 0);
      bucket.completed += completions.filter((c) => c.lesson.domainId === id).length;
    }
  }
  const averageCompletionPercent =
    consentedSmes.length > 0 ? Math.round(completionPercentSum / consentedSmes.length) : 0;
  const domainCompletionRates = DOMAIN_IDS.map((id) => {
    const bucket = domainCompletion.get(id)!;
    return {
      domainId: id,
      label: DOMAINS.find((d) => d.id === id)!.label,
      rate: bucket.possible > 0 ? Math.round((bucket.completed / bucket.possible) * 100) : 0,
    };
  });

  // ── DPA readiness (complete Current Profile assessments only) ──────────────────────────────
  const registrationExemption: Record<string, number> = {
    registered_or_exempt_documented: 0,
    checked_not_registered: 0,
    not_checked: 0,
  };
  const breachNotification: Record<string, number> = {
    confirmed_known_with_contact: 0,
    not_confirmed: 0,
  };
  for (const a of currentComplete) {
    for (const cp of a.dpaCheckpoints) {
      if (cp.checkpointType === "registration_exemption") {
        registrationExemption[cp.status] = (registrationExemption[cp.status] ?? 0) + 1;
      } else if (cp.checkpointType === "breach_notification_72h") {
        breachNotification[cp.status] = (breachNotification[cp.status] ?? 0) + 1;
      }
    }
  }

  return {
    population: {
      consentedCount: consentedSmes.length,
      tierDistribution,
      revokedConsentCount,
    },
    funnel: {
      currentComplete: currentComplete.length,
      currentInProgress: currentInProgress.length,
      targetComplete: targetComplete.length,
    },
    maturity: {
      totalComplete: currentComplete.length,
      averageComposite,
      bandDistribution,
      domainAverages,
      gateAppliedCount,
      gateAppliedRate,
    },
    training: {
      averageCompletionPercent,
      domainCompletionRates,
    },
    dpa: {
      registrationExemption,
      breachNotification,
    },
  };
}

export const getResearchDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireResearcherSession();
  const { db } = await import("@/lib/db");
  return buildResearchDashboard(db);
});
