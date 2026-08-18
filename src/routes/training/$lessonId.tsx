import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getLesson, submitQuizAnswers } from "@/lib/alita/training.functions";

const SearchSchema = z.object({ smeId: z.string().uuid().optional() });

export const Route = createFileRoute("/training/$lessonId")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: LessonScreen,
});

interface QuizQuestionView {
  id: string;
  question: string;
  options: string[];
}

interface LessonView {
  id: string;
  title: string;
  explanation: string;
  example: string;
  quizQuestions: QuizQuestionView[];
  toolRecommendation: { name: string; url: string } | null;
}

function LessonScreen() {
  const { lessonId } = Route.useParams();
  const { smeId } = Route.useSearch();
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    results: { questionId: string; correct: boolean }[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLesson({ data: { lessonId } }).then(({ lesson: l }) => setLesson(l as LessonView));
  }, [lessonId]);

  async function handleSubmit() {
    if (!lesson || !smeId) return;
    const orderedAnswers = lesson.quizQuestions.map((q) => answers[q.id]);
    if (orderedAnswers.some((a) => a === undefined)) return;

    setSubmitting(true);
    const res = await submitQuizAnswers({ data: { smeId, lessonId, answers: orderedAnswers } });
    setSubmitting(false);
    if (res.ok) {
      setResult({
        score: res.score,
        results: lesson.quizQuestions.map((q, i) => ({
          questionId: q.id,
          correct: res.results[i].correct,
        })),
      });
    }
  }

  if (!lesson) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading lesson…
      </div>
    );
  }

  const allAnswered = lesson.quizQuestions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{lesson.explanation}</p>

        <Card className="mt-4 bg-secondary/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Example
          </p>
          <p className="mt-1 text-sm text-foreground">{lesson.example}</p>
        </Card>

        {lesson.toolRecommendation && (
          <a
            href={lesson.toolRecommendation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            Related tool: {lesson.toolRecommendation.name} →
          </a>
        )}

        <h2 className="mt-8 text-lg font-semibold text-foreground">Quick check</h2>
        <div className="mt-3 space-y-5">
          {lesson.quizQuestions.map((q, i) => (
            <Card key={q.id} data-testid={`quiz-question-${i}`} className="p-4">
              <p className="font-medium text-foreground">
                {i + 1}. {q.question}
              </p>
              <RadioGroup
                className="mt-3"
                value={answers[q.id]?.toString() ?? ""}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: Number(v) }))}
                disabled={!!result}
              >
                {q.options.map((opt, optIndex) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 hover:bg-secondary/50"
                  >
                    <RadioGroupItem value={optIndex.toString()} className="mt-0.5" />
                    <span className="text-sm text-foreground">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
              {result && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    result.results.find((r) => r.questionId === q.id)?.correct
                      ? "text-success"
                      : "text-attention"
                  }`}
                >
                  {result.results.find((r) => r.questionId === q.id)?.correct
                    ? "Correct"
                    : "Not quite"}
                </p>
              )}
            </Card>
          ))}
        </div>

        {!result ? (
          smeId ? (
            <Button
              className="mt-6 w-full"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? "Checking…" : "Check my answers"}
            </Button>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Open this lesson from your results page to save your progress.
            </p>
          )
        ) : (
          <Card className="mt-6 p-4 text-sm text-foreground">
            You got {Math.round(result.score * lesson.quizQuestions.length)} of{" "}
            {lesson.quizQuestions.length} correct. Nice work — this is saved to your progress.
          </Card>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" asChild className="flex-1">
            <Link to="/training" search={{ smeId }}>
              Back to Training Hub
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
