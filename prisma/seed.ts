import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DOMAINS } from "../src/lib/alita/domains";
import { DESCRIPTORS } from "./seed/descriptors.data";
import { REMEDIATION_GUIDANCE } from "./seed/remediation.data";
import { TOOLS } from "./seed/tools.data";
import { LESSONS } from "./seed/lessons.data";

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
