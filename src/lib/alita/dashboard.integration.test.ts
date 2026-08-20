// Integration test hitting the real dev Postgres database via Prisma directly — same pattern as
// consent-export.integration.test.ts. The dashboard aggregation is inherently DB-state logic
// (assessment progress, training completion counts), not meaningfully testable without a DB.
import { afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildSmeDashboard } from "./dashboard.functions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — required for integration tests.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const createdSmeIds: string[] = [];
const createdAssessmentIds: string[] = [];

async function createTestSme(name: string) {
  const sme = await db.sme.create({
    data: {
      name,
      q1Answer: "A",
      q2Answer: "A",
      q3Answer: "A",
      q4Answer: "A",
      q5Answer: "A",
      tierSuggested: "A",
      tier: "A",
    },
  });
  createdSmeIds.push(sme.id);
  return sme;
}

afterEach(async () => {
  const assessmentIds = createdAssessmentIds.splice(0);
  if (assessmentIds.length > 0) {
    await db.assessmentScore.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await db.compositeResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await db.assessment.deleteMany({ where: { id: { in: assessmentIds } } });
  }
  const smeIds = createdSmeIds.splice(0);
  if (smeIds.length > 0) {
    await db.trainingCompletion.deleteMany({ where: { smeId: { in: smeIds } } });
    await db.sme.deleteMany({ where: { id: { in: smeIds } } });
  }
});

describe("buildSmeDashboard", () => {
  it("reports confirmed-domain progress for an in-progress assessment", async () => {
    const sme = await createTestSme("Dashboard Progress Co");
    const assessment = await db.assessment.create({
      data: { smeId: sme.id, type: "current_profile", status: "in_progress" },
    });
    createdAssessmentIds.push(assessment.id);
    await db.assessmentScore.create({
      data: { assessmentId: assessment.id, domainId: "D1", level: 3 },
    });
    await db.assessmentScore.create({
      data: { assessmentId: assessment.id, domainId: "D2", level: 2 },
    });

    const result = await buildSmeDashboard(db, sme.id);
    const found = result.assessments.find((a) => a.id === assessment.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe("in_progress");
    expect(found!.confirmedDomains).toBe(2);
    expect(found!.totalDomains).toBe(6);
    expect(found!.composite).toBeNull();
  });

  it("includes the composite result for a complete assessment", async () => {
    const sme = await createTestSme("Dashboard Complete Co");
    const assessment = await db.assessment.create({
      data: { smeId: sme.id, type: "current_profile", status: "complete" },
    });
    createdAssessmentIds.push(assessment.id);
    await db.compositeResult.create({
      data: {
        assessmentId: assessment.id,
        rawComposite: 3.5,
        gatedComposite: 3.5,
        bandLabel: "Managed",
        gateApplied: false,
      },
    });

    const result = await buildSmeDashboard(db, sme.id);
    const found = result.assessments.find((a) => a.id === assessment.id);
    expect(found?.composite).toEqual({ bandLabel: "Managed", gatedComposite: 3.5 });
  });

  it("computes training completion percent only against the SME's own tier's lessons", async () => {
    const sme = await createTestSme("Dashboard Training Co");
    const tierALessons = await db.lesson.findMany({ where: { tier: "A" } });
    expect(tierALessons.length).toBeGreaterThan(0);

    await db.trainingCompletion.create({
      data: { smeId: sme.id, lessonId: tierALessons[0].id, quizScore: 1 },
    });

    const result = await buildSmeDashboard(db, sme.id);
    expect(result.training.completedCount).toBe(1);
    expect(result.training.totalCount).toBe(tierALessons.length);
    expect(result.training.percent).toBe(Math.round((1 / tierALessons.length) * 100));
  });
});
