import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { DOMAIN_IDS, type DomainId } from "./domains";
import { buildRemediationChain, buildRemediationPlan } from "./remediation";
import { matchTools } from "./tool-matching";

const DomainIdSchema = z.enum(DOMAIN_IDS as [DomainId, ...DomainId[]]);

// Picks the "Learn more" lesson for a domain/tier — highest priority first (see the `priority`
// column on Lesson), falling back to sortOrder. Extracted so vitest integration tests can call it
// directly, same pattern as getConsentedSmes/buildSmeDashboard elsewhere in this codebase.
export function pickLessonForDomain(db: PrismaClient, domainId: DomainId, tier: "A" | "B" | "C") {
  return db.lesson.findFirst({
    where: { domainId, tier },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
  });
}

const GetRemediationReportSchema = z.object({ assessmentId: z.string().uuid() });

export const getRemediationReport = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetRemediationReportSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");

    const assessment = await db.assessment.findUniqueOrThrow({
      where: { id: data.assessmentId },
      include: { sme: true, scores: true },
    });

    const currentScores = Object.fromEntries(
      assessment.scores.map((s) => [s.domainId, s.level]),
    ) as Record<DomainId, number>;

    const latestTarget = await db.assessment.findFirst({
      where: { smeId: assessment.smeId, type: "target_profile", status: "complete" },
      orderBy: { createdAt: "desc" },
      include: { scores: true },
    });
    const targetScores = latestTarget
      ? (Object.fromEntries(latestTarget.scores.map((s) => [s.domainId, s.level])) as Partial<
          Record<DomainId, number>
        >)
      : null;

    const plan = buildRemediationPlan(currentScores, targetScores);

    const [allTools, progressRows] = await Promise.all([
      db.toolRecommendation.findMany(),
      db.remediationProgress.findMany({ where: { smeId: assessment.smeId } }),
    ]);
    const progressByDomain = new Map(progressRows.map((p) => [p.domainId, p.status]));

    const entries = await Promise.all(
      plan.map(async (entry) => {
        const chain = buildRemediationChain(entry.currentLevel, entry.effectiveTarget);

        const [chainGuidance, lesson] = await Promise.all([
          Promise.all(
            chain.map((step) =>
              db.remediationGuidance.findUnique({
                where: {
                  domainId_tier_fromLevel_toLevel: {
                    domainId: entry.domainId,
                    tier: assessment.sme.tier,
                    fromLevel: step.fromLevel,
                    toLevel: step.toLevel,
                  },
                },
              }),
            ),
          ),
          pickLessonForDomain(db, entry.domainId, assessment.sme.tier),
        ]);

        return {
          ...entry,
          // First entry is the immediate next step; the rest are shown behind an expand toggle
          // (Phase 5 chaining — don't dump a multi-level jump on the user all at once).
          chainGuidance,
          tools: matchTools(allTools, entry.domainId, assessment.sme.tier, 3),
          lessonId: lesson?.id ?? null,
          progressStatus: progressByDomain.get(entry.domainId) ?? null,
        };
      }),
    );

    return { sme: assessment.sme, entries };
  });

const SetRemediationProgressSchema = z.object({
  smeId: z.string().uuid(),
  domainId: DomainIdSchema,
  status: z.enum(["in_progress", "done"]),
});

export const setRemediationProgress = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SetRemediationProgressSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const progress = await db.remediationProgress.upsert({
      where: { smeId_domainId: { smeId: data.smeId, domainId: data.domainId } },
      create: { smeId: data.smeId, domainId: data.domainId, status: data.status },
      update: { status: data.status },
    });
    return { progress };
  });
