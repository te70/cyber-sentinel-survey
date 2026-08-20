import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CONSENT_VERSION, PRIVACY_NOTICE_VERSION } from "./consent-content";

const SmeIdSchema = z.object({ smeId: z.string().uuid() });

const RecordConsentSchema = z.object({
  smeId: z.string().uuid(),
  privacyAccepted: z.literal(true),
  researchAccepted: z.literal(true),
});

export const recordConsent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RecordConsentSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    await db.consentRecord.createMany({
      data: [
        { smeId: data.smeId, consentType: "privacy_notice", version: PRIVACY_NOTICE_VERSION },
        {
          smeId: data.smeId,
          consentType: "research_participation",
          version: CONSENT_VERSION,
        },
      ],
    });
    return { ok: true };
  });

export const getConsentStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SmeIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const records = await db.consentRecord.findMany({
      where: { smeId: data.smeId },
      orderBy: { grantedAt: "desc" },
    });
    const latest = (type: "privacy_notice" | "research_participation") =>
      records.find((r) => r.consentType === type) ?? null;
    return {
      privacyNotice: latest("privacy_notice"),
      researchParticipation: latest("research_participation"),
    };
  });

const RevokeConsentSchema = z.object({
  smeId: z.string().uuid(),
  consentType: z.literal("research_participation"),
});

export const revokeConsent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RevokeConsentSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const active = await db.consentRecord.findFirst({
      where: { smeId: data.smeId, consentType: data.consentType, revokedAt: null },
      orderBy: { grantedAt: "desc" },
    });
    if (!active) return { ok: false as const, error: "No active consent to revoke." };
    await db.consentRecord.update({ where: { id: active.id }, data: { revokedAt: new Date() } });
    return { ok: true as const };
  });

export const deleteSmeAccount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SmeIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const { smeId } = data;

    const assessments = await db.assessment.findMany({ where: { smeId }, select: { id: true } });
    const assessmentIds = assessments.map((a) => a.id);

    await db.$transaction([
      db.deletionLog.create({ data: { smeId } }),
      db.trainingCompletion.deleteMany({ where: { smeId } }),
      db.remediationProgress.deleteMany({ where: { smeId } }),
      db.assessmentEvent.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.itemResponse.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.assessmentScore.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.compositeResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.dpaCheckpoint.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.actionItem.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
      db.assessment.deleteMany({ where: { smeId } }),
      db.consentRecord.deleteMany({ where: { smeId } }),
      db.smePseudonym.deleteMany({ where: { smeId } }),
      db.sme.delete({ where: { id: smeId } }),
    ]);

    return { ok: true };
  });
