import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { DOMAIN_IDS } from "./domains";

// Pure aggregation logic, exported separately from the createServerFn wrapper below so vitest
// integration tests can call it directly with a real PrismaClient — same pattern as
// getConsentedSmes/buildResearchExportWorkbook in export.functions.ts.
export async function buildSmeDashboard(db: PrismaClient, smeId: string) {
  const sme = await db.sme.findUniqueOrThrow({ where: { id: smeId } });

  const [assessments, completions, lessons] = await Promise.all([
    db.assessment.findMany({
      where: { smeId },
      orderBy: { createdAt: "desc" },
      include: { scores: true, compositeResult: true },
    }),
    db.trainingCompletion.findMany({ where: { smeId } }),
    db.lesson.findMany({ where: { tier: sme.tier } }),
  ]);

  const lessonIds = new Set(lessons.map((l) => l.id));
  const completedCount = completions.filter((c) => lessonIds.has(c.lessonId)).length;

  return {
    sme: { id: sme.id, name: sme.name, tier: sme.tier, tierOverridden: sme.tierOverridden },
    assessments: assessments.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      createdAt: a.createdAt,
      confirmedDomains: a.scores.length,
      totalDomains: DOMAIN_IDS.length,
      composite: a.compositeResult
        ? {
            bandLabel: a.compositeResult.bandLabel,
            gatedComposite: a.compositeResult.gatedComposite,
          }
        : null,
    })),
    training: {
      completedCount,
      totalCount: lessons.length,
      percent: lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
    },
  };
}

const GetSmeDashboardSchema = z.object({ smeId: z.string().uuid() });

// One aggregating fetch for the SME dashboard — assessments (with confirmed-domain progress and
// composite result if complete), and a training completion summary — so the page has a single
// loading state instead of a staggered waterfall of partial fetches.
export const getSmeDashboard = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetSmeDashboardSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    return buildSmeDashboard(db, data.smeId);
  });
