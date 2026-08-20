import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CLASSIFICATION_QUESTIONS, suggestTier, type Tier } from "./classification";
import { DOMAIN_IDS, type DomainId } from "./domains";
import { applyAwarenessGate, calculateRawComposite, getBandLabel } from "./scoring";

const TierSchema = z.enum(["A", "B", "C"]);
const DomainIdSchema = z.enum(DOMAIN_IDS as [DomainId, ...DomainId[]]);
const LevelSchema = z.number().int().min(0).max(5);

// ---------- SME + tier classification ----------

const CreateSmeSchema = z.object({
  name: z.string().min(1),
  q1Answer: TierSchema,
  q2Answer: TierSchema,
  q3Answer: TierSchema,
  q4Answer: TierSchema,
  q5Answer: TierSchema,
});

export const createSme = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateSmeSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const tierSuggested = suggestTier({
      q1: data.q1Answer,
      q2: data.q2Answer,
      q3: data.q3Answer,
      q4: data.q4Answer,
      q5: data.q5Answer,
    });
    const sme = await db.sme.create({
      data: { ...data, tierSuggested, tier: tierSuggested },
    });
    return { sme };
  });

const OverrideSmeTierSchema = z.object({ smeId: z.string().uuid(), tier: TierSchema });

export const overrideSmeTier = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OverrideSmeTierSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const sme = await db.sme.update({
      where: { id: data.smeId },
      data: { tier: data.tier, tierOverridden: true },
    });
    return { sme };
  });

export const getClassificationQuestions = createServerFn({ method: "GET" }).handler(async () => {
  return { questions: CLASSIFICATION_QUESTIONS };
});

const GetSmeSchema = z.object({ smeId: z.string().uuid() });

export const getSme = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetSmeSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const sme = await db.sme.findUniqueOrThrow({ where: { id: data.smeId } });
    return { sme };
  });

// ---------- Assessments ----------

const CreateAssessmentSchema = z.object({
  smeId: z.string().uuid(),
  type: z.enum(["current_profile", "target_profile"]),
});

export const createAssessment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateAssessmentSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const assessment = await db.assessment.create({ data });
    return { assessment };
  });

const GetAssessmentSchema = z.object({ assessmentId: z.string().uuid() });

export const getAssessment = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetAssessmentSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const assessment = await db.assessment.findUniqueOrThrow({
      where: { id: data.assessmentId },
      include: { sme: true, scores: true, itemResponses: true },
    });
    return { assessment };
  });

const UpdateAssessmentScoresSchema = z.object({
  assessmentId: z.string().uuid(),
  scores: z.record(DomainIdSchema, LevelSchema),
});

export const updateAssessmentScores = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpdateAssessmentScoresSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    await Promise.all(
      Object.entries(data.scores).map(([domainId, level]) =>
        db.assessmentScore.upsert({
          where: { assessmentId_domainId: { assessmentId: data.assessmentId, domainId } },
          create: { assessmentId: data.assessmentId, domainId, level },
          update: { level },
        }),
      ),
    );
    return { ok: true };
  });

function deriveDpaCheckpoints(d1Level: number, d5Level: number) {
  const registrationStatus =
    d1Level >= 3
      ? "registered_or_exempt_documented"
      : d1Level >= 2
        ? "checked_not_registered"
        : "not_checked";
  const breachNotificationStatus = d5Level >= 3 ? "confirmed_known_with_contact" : "not_confirmed";
  return [
    { checkpointType: "registration_exemption" as const, status: registrationStatus },
    { checkpointType: "breach_notification_72h" as const, status: breachNotificationStatus },
  ];
}

const CompleteAssessmentSchema = z.object({ assessmentId: z.string().uuid() });

export const completeAssessment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CompleteAssessmentSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const scoreRows = await db.assessmentScore.findMany({
      where: { assessmentId: data.assessmentId },
    });

    const scoresByDomain = new Map(scoreRows.map((r) => [r.domainId, r.level]));
    const missing = DOMAIN_IDS.filter((id) => !scoresByDomain.has(id));
    if (missing.length > 0) {
      return { ok: false as const, error: `Missing scores for: ${missing.join(", ")}` };
    }

    const scores = Object.fromEntries(
      DOMAIN_IDS.map((id) => [id, scoresByDomain.get(id)!]),
    ) as Record<DomainId, number>;
    const raw = calculateRawComposite(scores);
    const { composite: gated, gated: gateApplied } = applyAwarenessGate(raw, scores.D4);
    const bandLabel = getBandLabel(gated);

    await db.compositeResult.upsert({
      where: { assessmentId: data.assessmentId },
      create: {
        assessmentId: data.assessmentId,
        rawComposite: raw,
        gatedComposite: gated,
        bandLabel,
        gateApplied,
      },
      update: { rawComposite: raw, gatedComposite: gated, bandLabel, gateApplied },
    });

    const checkpoints = deriveDpaCheckpoints(scores.D1, scores.D5);
    await Promise.all(
      checkpoints.map((cp) =>
        db.dpaCheckpoint.upsert({
          where: {
            assessmentId_checkpointType: {
              assessmentId: data.assessmentId,
              checkpointType: cp.checkpointType,
            },
          },
          create: {
            assessmentId: data.assessmentId,
            checkpointType: cp.checkpointType,
            status: cp.status,
          },
          update: { status: cp.status },
        }),
      ),
    );

    await db.assessment.update({ where: { id: data.assessmentId }, data: { status: "complete" } });

    return { ok: true as const };
  });

const GetAssessmentResultSchema = z.object({ assessmentId: z.string().uuid() });

export const getAssessmentResult = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetAssessmentResultSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const [composite, scores, dpaCheckpoints] = await Promise.all([
      db.compositeResult.findUnique({ where: { assessmentId: data.assessmentId } }),
      db.assessmentScore.findMany({
        where: { assessmentId: data.assessmentId },
        include: { domain: true },
      }),
      db.dpaCheckpoint.findMany({ where: { assessmentId: data.assessmentId } }),
    ]);
    return { composite, scores, dpaCheckpoints };
  });

const GetAssessmentGapsSchema = z.object({ smeId: z.string().uuid() });

export const getAssessmentGaps = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetAssessmentGapsSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const [current, target] = await Promise.all([
      db.assessment.findFirst({
        where: { smeId: data.smeId, type: "current_profile", status: "complete" },
        orderBy: { createdAt: "desc" },
        include: { scores: true },
      }),
      db.assessment.findFirst({
        where: { smeId: data.smeId, type: "target_profile", status: "complete" },
        orderBy: { createdAt: "desc" },
        include: { scores: true },
      }),
    ]);

    if (!current || !target) {
      return {
        ok: false as const,
        error: "Both a completed current and target profile are required.",
      };
    }

    const currentByDomain = new Map(current.scores.map((s) => [s.domainId, s.level]));
    const targetByDomain = new Map(target.scores.map((s) => [s.domainId, s.level]));

    // Priority heuristic (unspecified in the source spec — a documented, provisional rule,
    // same treatment as the researcher-set weights/gate): larger gaps rank higher priority.
    const items = DOMAIN_IDS.map((domainId) => {
      const gapSize = (targetByDomain.get(domainId) ?? 0) - (currentByDomain.get(domainId) ?? 0);
      const priority = gapSize >= 3 ? "High" : gapSize === 2 ? "Medium" : "Low";
      return { domainId, gapSize, priority };
    }).filter((item) => item.gapSize > 0);

    await Promise.all(
      items.map((item) =>
        db.actionItem.create({
          data: {
            assessmentId: current.id,
            domainId: item.domainId,
            gapSize: item.gapSize,
            priority: item.priority as "High" | "Medium" | "Low",
          },
        }),
      ),
    );

    return { ok: true as const, items };
  });

// ---------- Pilot analytics ----------

const LogAssessmentEventSchema = z.object({
  assessmentId: z.string().uuid(),
  eventType: z.enum(["domain_viewed", "domain_scored"]),
  domainId: DomainIdSchema.optional(),
});

export const logAssessmentEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LogAssessmentEventSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    await db.assessmentEvent.create({ data });
    return { ok: true };
  });

// ---------- Descriptors ----------

const GetDescriptorsSchema = z.object({
  domainId: DomainIdSchema.optional(),
  level: LevelSchema.optional(),
  tier: TierSchema.optional(),
});

export const getDescriptors = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetDescriptorsSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const descriptors = await db.descriptor.findMany({
      where: { domainId: data.domainId, level: data.level, tier: data.tier },
      orderBy: [{ domainId: "asc" }, { level: "asc" }, { tier: "asc" }],
    });
    return { descriptors };
  });

export type { Tier };
