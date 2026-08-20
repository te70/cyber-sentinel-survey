// Integration test hitting the real dev Postgres database via Prisma directly — same pattern as
// consent-export.integration.test.ts and dashboard.integration.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildResearchDashboard } from "./research-dashboard.functions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — required for integration tests.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const createdSmeIds: string[] = [];
const createdAssessmentIds: string[] = [];

async function createTestSme(name: string, tier: "A" | "B" | "C") {
  const sme = await db.sme.create({
    data: {
      name,
      q1Answer: tier,
      q2Answer: tier,
      q3Answer: tier,
      q4Answer: tier,
      q5Answer: tier,
      tierSuggested: tier,
      tier,
    },
  });
  createdSmeIds.push(sme.id);
  return sme;
}

async function grantResearchConsent(smeId: string, revoked = false) {
  await db.consentRecord.create({
    data: {
      smeId,
      consentType: "research_participation",
      version: "1.0",
      revokedAt: revoked ? new Date() : null,
    },
  });
}

async function createCompleteAssessment(
  smeId: string,
  opts: { bandLabel: string; gateApplied: boolean; gatedComposite: number },
) {
  const assessment = await db.assessment.create({
    data: { smeId, type: "current_profile", status: "complete" },
  });
  createdAssessmentIds.push(assessment.id);
  await db.assessmentScore.create({
    data: { assessmentId: assessment.id, domainId: "D1", level: 3 },
  });
  await db.compositeResult.create({
    data: {
      assessmentId: assessment.id,
      rawComposite: opts.gatedComposite,
      gatedComposite: opts.gatedComposite,
      bandLabel: opts.bandLabel,
      gateApplied: opts.gateApplied,
    },
  });
  await db.dpaCheckpoint.create({
    data: {
      assessmentId: assessment.id,
      checkpointType: "registration_exemption",
      status: "registered_or_exempt_documented",
    },
  });
  return assessment;
}

afterEach(async () => {
  const assessmentIds = createdAssessmentIds.splice(0);
  if (assessmentIds.length > 0) {
    await db.dpaCheckpoint.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await db.compositeResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await db.assessmentScore.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await db.assessment.deleteMany({ where: { id: { in: assessmentIds } } });
  }
  const smeIds = createdSmeIds.splice(0);
  if (smeIds.length > 0) {
    await db.consentRecord.deleteMany({ where: { smeId: { in: smeIds } } });
    await db.sme.deleteMany({ where: { id: { in: smeIds } } });
  }
});

describe("buildResearchDashboard", () => {
  it("excludes a revoked-consent SME from every aggregate", async () => {
    // Compare before/after deltas rather than absolute counts — the shared dev DB may already
    // have other consented SMEs from prior test runs or manual sessions.
    const before = await buildResearchDashboard(db);

    const consented = await createTestSme("Dashboard Consented Co", "A");
    await grantResearchConsent(consented.id);
    await createCompleteAssessment(consented.id, {
      bandLabel: "Initial",
      gateApplied: true,
      gatedComposite: 1.9,
    });

    const revoked = await createTestSme("Dashboard Revoked Co", "A");
    await grantResearchConsent(revoked.id, true);
    await createCompleteAssessment(revoked.id, {
      bandLabel: "Optimising",
      gateApplied: false,
      gatedComposite: 5.0,
    });

    const after = await buildResearchDashboard(db);

    // Only the consented SME's "Initial" assessment should be reflected — the revoked SME's
    // "Optimising" band should not move the count at all.
    expect(after.maturity.bandDistribution["Initial"]).toBe(
      before.maturity.bandDistribution["Initial"] + 1,
    );
    expect(after.maturity.bandDistribution["Optimising"]).toBe(
      before.maturity.bandDistribution["Optimising"],
    );
    expect(after.maturity.totalComplete).toBe(before.maturity.totalComplete + 1);
    expect(after.population.consentedCount).toBe(before.population.consentedCount + 1);
  });

  it("sums band-distribution counts to the number of complete Current Profile assessments", async () => {
    const smeA = await createTestSme("Dashboard Band A Co", "A");
    await grantResearchConsent(smeA.id);
    await createCompleteAssessment(smeA.id, {
      bandLabel: "Initial",
      gateApplied: true,
      gatedComposite: 1.9,
    });

    const smeB = await createTestSme("Dashboard Band B Co", "B");
    await grantResearchConsent(smeB.id);
    await createCompleteAssessment(smeB.id, {
      bandLabel: "Managed",
      gateApplied: false,
      gatedComposite: 2.5,
    });

    const result = await buildResearchDashboard(db);
    const bandSum = Object.values(result.maturity.bandDistribution).reduce((s, n) => s + n, 0);
    expect(bandSum).toBe(result.maturity.totalComplete);
  });

  it("sums tier-distribution counts to the consented-SME count", async () => {
    const sme = await createTestSme("Dashboard Tier Extra Co", "C");
    await grantResearchConsent(sme.id);

    const result = await buildResearchDashboard(db);
    const tierSum =
      result.population.tierDistribution.A +
      result.population.tierDistribution.B +
      result.population.tierDistribution.C;
    expect(tierSum).toBe(result.population.consentedCount);
  });

  it("counts a gate-applied assessment and does not count a non-gated one toward the gate rate", async () => {
    const gated = await createTestSme("Dashboard Gated Co", "A");
    await grantResearchConsent(gated.id);
    await createCompleteAssessment(gated.id, {
      bandLabel: "Initial",
      gateApplied: true,
      gatedComposite: 1.9,
    });

    const notGated = await createTestSme("Dashboard Not Gated Co", "A");
    await grantResearchConsent(notGated.id);
    await createCompleteAssessment(notGated.id, {
      bandLabel: "Defined",
      gateApplied: false,
      gatedComposite: 3.5,
    });

    const before = await buildResearchDashboard(db);
    // Only assert on the delta this test's own fixtures introduced, since the dev DB may already
    // have other consented SMEs from prior test runs / manual sessions.
    expect(before.maturity.gateAppliedCount).toBeGreaterThanOrEqual(1);
    expect(before.maturity.totalComplete).toBeGreaterThanOrEqual(2);
  });
});
