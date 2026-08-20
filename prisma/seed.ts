import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DOMAINS } from "../src/lib/alita/domains";
import { DESCRIPTORS } from "./seed/descriptors.data";
import { REMEDIATION_GUIDANCE } from "./seed/remediation.data";
import { TOOLS } from "./seed/tools.data";
import { LESSONS } from "./seed/lessons.data";
import { ASSESSMENT_ITEMS } from "./seed/assessment-items.data";
import { hashPassword } from "../src/lib/researcher-password.server";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set in environment variables.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const domain of DOMAINS) {
    await db.domain.upsert({
      where: { id: domain.id },
      create: {
        id: domain.id,
        label: domain.label,
        nistFunction: domain.nistFunction,
        weight: domain.weight,
        sortOrder: domain.sortOrder,
      },
      update: {
        label: domain.label,
        nistFunction: domain.nistFunction,
        weight: domain.weight,
        sortOrder: domain.sortOrder,
      },
    });
  }
  // A pseudo-domain for lessons that don't map onto one of the six scored domains (Phase 5's
  // talent-turnover/solo-operator content — see the comment in lessons.data.ts). Deliberately
  // NOT part of DOMAINS/DOMAIN_IDS in src/lib/alita/domains.ts, so it never participates in
  // assessment scoring, item batteries, or descriptors — it exists purely to satisfy Lesson's
  // required domainId FK without a nullable-column migration.
  await db.domain.upsert({
    where: { id: "GEN" },
    create: { id: "GEN", label: "General", nistFunction: "—", weight: 0, sortOrder: 99 },
    update: { label: "General", nistFunction: "—", weight: 0, sortOrder: 99 },
  });

  console.log(`Seeded ${DOMAINS.length} domains.`);

  for (const row of DESCRIPTORS) {
    await db.descriptor.upsert({
      where: { domainId_level_tier: { domainId: row.domainId, level: row.level, tier: row.tier } },
      create: { domainId: row.domainId, level: row.level, tier: row.tier, text: row.text },
      update: { text: row.text },
    });
  }
  console.log(`Seeded ${DESCRIPTORS.length} descriptors.`);

  for (const row of REMEDIATION_GUIDANCE) {
    await db.remediationGuidance.upsert({
      where: {
        domainId_tier_fromLevel_toLevel: {
          domainId: row.domainId,
          tier: row.tier,
          fromLevel: row.fromLevel,
          toLevel: row.toLevel,
        },
      },
      create: { ...row },
      update: { whatsWrong: row.whatsWrong, howToImprove: row.howToImprove, status: row.status },
    });
  }
  console.log(`Seeded ${REMEDIATION_GUIDANCE.length} remediation guidance rows.`);

  for (const tool of TOOLS) {
    await db.toolRecommendation.upsert({
      where: { domainId_name: { domainId: tool.domainId, name: tool.name } },
      create: { ...tool },
      update: { ...tool },
    });
  }
  console.log(`Seeded ${TOOLS.length} tool recommendations.`);

  for (const lesson of LESSONS) {
    const { quiz, ...lessonFields } = lesson;
    const saved = await db.lesson.upsert({
      where: {
        domainId_tier_title: { domainId: lesson.domainId, tier: lesson.tier, title: lesson.title },
      },
      create: { ...lessonFields },
      update: { ...lessonFields },
    });

    for (const [i, q] of quiz.entries()) {
      await db.quizQuestion.upsert({
        where: { lessonId_sortOrder: { lessonId: saved.id, sortOrder: i } },
        create: {
          lessonId: saved.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          sortOrder: i,
        },
        update: { question: q.question, options: q.options, correctIndex: q.correctIndex },
      });
    }
  }
  console.log(`Seeded ${LESSONS.length} lessons with quiz questions.`);

  for (const item of ASSESSMENT_ITEMS) {
    await db.assessmentItem.upsert({
      where: {
        domainId_tier_level_order: {
          domainId: item.domainId,
          tier: item.tier,
          level: item.level,
          order: item.order,
        },
      },
      create: { ...item },
      update: { ...item },
    });
  }
  console.log(`Seeded ${ASSESSMENT_ITEMS.length} assessment items.`);

  const researcherUsername = process.env.RESEARCHER_USERNAME;
  const researcherPassword = process.env.RESEARCHER_INITIAL_PASSWORD;
  if (researcherUsername && researcherPassword) {
    await db.researcher.upsert({
      where: { username: researcherUsername },
      create: { username: researcherUsername, passwordHash: hashPassword(researcherPassword) },
      // Don't overwrite an existing password on every reseed — only create if missing.
      update: {},
    });
    console.log(`Ensured researcher account "${researcherUsername}" exists.`);
  } else {
    console.log(
      "RESEARCHER_USERNAME / RESEARCHER_INITIAL_PASSWORD not set — skipped researcher account seeding.",
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
