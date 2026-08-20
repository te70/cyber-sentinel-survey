import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DOMAIN_IDS, type DomainId } from "./domains";
import { computeCumulativeLevel, type LevelResponses } from "./item-scoring";

const TierSchema = z.enum(["A", "B", "C"]);
const DomainIdSchema = z.enum(DOMAIN_IDS as [DomainId, ...DomainId[]]);

const GetAssessmentItemsSchema = z.object({ domainId: DomainIdSchema, tier: TierSchema });

export const getAssessmentItems = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetAssessmentItemsSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const items = await db.assessmentItem.findMany({
      where: { domainId: data.domainId, tier: data.tier },
      orderBy: [{ level: "asc" }, { order: "asc" }],
    });
    return { items };
  });

const SubmitItemResponsesSchema = z.object({
  assessmentId: z.string().uuid(),
  responses: z.array(
    z.object({ itemId: z.string().uuid(), responseValue: z.number().int().min(1).max(5) }),
  ),
});

export const submitItemResponses = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitItemResponsesSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    await Promise.all(
      data.responses.map((r) =>
        db.itemResponse.upsert({
          where: { assessmentId_itemId: { assessmentId: data.assessmentId, itemId: r.itemId } },
          create: {
            assessmentId: data.assessmentId,
            itemId: r.itemId,
            responseValue: r.responseValue,
          },
          update: { responseValue: r.responseValue, answeredAt: new Date() },
        }),
      ),
    );
    return { ok: true };
  });

const ComputeDomainLevelSchema = z.object({
  assessmentId: z.string().uuid(),
  domainId: DomainIdSchema,
  tier: TierSchema,
});

export const computeDomainLevel = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ComputeDomainLevelSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const items = await db.assessmentItem.findMany({
      where: { domainId: data.domainId, tier: data.tier },
      orderBy: { level: "asc" },
    });
    const responses = await db.itemResponse.findMany({
      where: { assessmentId: data.assessmentId, itemId: { in: items.map((i) => i.id) } },
    });
    const responseByItemId = new Map(responses.map((r) => [r.itemId, r.responseValue]));

    const byLevel: LevelResponses = {};
    for (const item of items) {
      const value = responseByItemId.get(item.id);
      if (value !== undefined) byLevel[item.level as 1 | 2 | 3 | 4 | 5] = value;
    }

    return {
      computedLevel: computeCumulativeLevel(byLevel),
      answeredCount: responses.length,
      totalCount: items.length,
    };
  });

const ConfirmDomainLevelSchema = z.object({
  assessmentId: z.string().uuid(),
  domainId: DomainIdSchema,
  computedLevel: z.number().int().min(0).max(5),
  confirmedLevel: z.number().int().min(0).max(5),
});

export const confirmDomainLevel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ConfirmDomainLevelSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const score = await db.assessmentScore.upsert({
      where: {
        assessmentId_domainId: { assessmentId: data.assessmentId, domainId: data.domainId },
      },
      create: {
        assessmentId: data.assessmentId,
        domainId: data.domainId,
        level: data.confirmedLevel,
        computedLevel: data.computedLevel,
      },
      update: { level: data.confirmedLevel, computedLevel: data.computedLevel },
    });
    return { score };
  });
