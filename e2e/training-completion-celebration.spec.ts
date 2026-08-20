import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { completeIntake, waitForHydration } from "./helpers";

// Completing all ~28 Tier A lessons through the real UI would take an impractically long time for
// an e2e test, so completion rows for every Tier A lesson are seeded directly via Prisma — the
// point under test is the Training Hub/dashboard's rendering of the "all done" state, not the
// per-lesson completion flow itself (already covered by training-completion.spec.ts).

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — required for this test.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

test("Training Hub and dashboard celebrate once every tier lesson is completed", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Training Celebration Test Co" });

  const url = new URL(page.url());
  const assessmentId = url.pathname.split("/").pop()!;
  const assessment = await db.assessment.findUniqueOrThrow({ where: { id: assessmentId } });
  const smeId = assessment.smeId;

  const tierALessons = await db.lesson.findMany({ where: { tier: "A" } });
  expect(tierALessons.length).toBeGreaterThan(0);
  await db.trainingCompletion.createMany({
    data: tierALessons.map((l) => ({ smeId, lessonId: l.id, quizScore: 1 })),
    skipDuplicates: true,
  });

  await page.goto(`/training?smeId=${smeId}`);
  await waitForHydration(page);
  await expect(page.getByText("All training complete")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/every lesson available to you/)).toBeVisible();
  await expect(page.getByRole("link", { name: "njengat1@usiu.ac.ke" })).toBeVisible();

  await page.goto(`/alita/dashboard/${smeId}`);
  await waitForHydration(page);
  await expect(page.getByText("All training complete")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: "Review lessons" })).toBeVisible();

  await db.trainingCompletion.deleteMany({ where: { smeId } });
});
