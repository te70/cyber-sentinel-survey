import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DOMAIN_IDS, type DomainId } from "./domains";

const TierSchema = z.enum(["A", "B", "C"]);
const DomainIdSchema = z.enum(DOMAIN_IDS as [DomainId, ...DomainId[]]);

const GetLessonsSchema = z.object({
  domainId: DomainIdSchema.optional(),
  tier: TierSchema.optional(),
});

export const getLessons = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetLessonsSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const lessons = await db.lesson.findMany({
      where: { domainId: data.domainId, tier: data.tier },
      include: { domain: true },
      orderBy: [{ domainId: "asc" }, { sortOrder: "asc" }],
    });
    return { lessons };
  });

const GetLessonSchema = z.object({ lessonId: z.string().uuid() });

export const getLesson = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetLessonSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const lesson = await db.lesson.findUniqueOrThrow({
      where: { id: data.lessonId },
      include: {
        domain: true,
        toolRecommendation: true,
        quizQuestions: { orderBy: { sortOrder: "asc" } },
      },
    });
    // Never ship correct answers to the client before grading.
    return {
      lesson: {
        ...lesson,
        quizQuestions: lesson.quizQuestions.map(({ correctIndex: _correctIndex, ...q }) => q),
      },
    };
  });

const SubmitQuizAnswersSchema = z.object({
  smeId: z.string().uuid(),
  lessonId: z.string().uuid(),
  answers: z.array(z.number().int().min(0)),
});

export const submitQuizAnswers = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitQuizAnswersSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const questions = await db.quizQuestion.findMany({
      where: { lessonId: data.lessonId },
      orderBy: { sortOrder: "asc" },
    });

    if (questions.length === 0 || data.answers.length !== questions.length) {
      return { ok: false as const, error: "Answers don't match the number of questions." };
    }

    const results = questions.map((q, i) => ({
      questionId: q.id,
      correct: data.answers[i] === q.correctIndex,
      correctIndex: q.correctIndex,
    }));
    const score = results.filter((r) => r.correct).length / results.length;

    await db.trainingCompletion.upsert({
      where: { smeId_lessonId: { smeId: data.smeId, lessonId: data.lessonId } },
      create: { smeId: data.smeId, lessonId: data.lessonId, quizScore: score },
      update: { quizScore: score, completedAt: new Date() },
    });

    return { ok: true as const, score, results };
  });

const GetTrainingCompletionsSchema = z.object({ smeId: z.string().uuid() });

export const getTrainingCompletions = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetTrainingCompletionsSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const completions = await db.trainingCompletion.findMany({ where: { smeId: data.smeId } });
    return { completions };
  });
