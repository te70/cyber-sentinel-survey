import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import type { Tier } from "@/lib/alita/classification";
import { getLessons, getTrainingCompletions } from "@/lib/alita/training.functions";
import { getSme } from "@/lib/alita/alita.functions";

const SearchSchema = z.object({ smeId: z.string().uuid().optional() });

export const Route = createFileRoute("/training/")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: TrainingHub,
});

// D4 (the gate domain) leads the hub — most lessons live there and it's the thesis's central
// claim, so it shouldn't be buried alphabetically behind D1-D3.
const DOMAIN_ORDER: DomainId[] = ["D4", "D1", "D2", "D3", "D5", "D6"];

interface LessonSummary {
  id: string;
  domainId: DomainId;
  tier: Tier;
  title: string;
  sortOrder: number;
}

function TrainingHub() {
  const { smeId } = Route.useSearch();
  const [tier, setTier] = useState<Tier>("A");
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (smeId) {
      getSme({ data: { smeId } }).then(({ sme }) => setTier(sme.tier));
      getTrainingCompletions({ data: { smeId } }).then(({ completions }) =>
        setCompletedLessonIds(new Set(completions.map((c) => c.lessonId))),
      );
    }
  }, [smeId]);

  useEffect(() => {
    getLessons({ data: { tier } }).then(({ lessons: rows }) => setLessons(rows as LessonSummary[]));
  }, [tier]);

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Training Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Short lessons on the areas that matter most — a few minutes each.
        </p>

        <div className="mt-4 flex gap-2">
          {(["A", "B", "C"] as Tier[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tier === t ? "default" : "outline"}
              onClick={() => setTier(t)}
            >
              Tier {t}
            </Button>
          ))}
        </div>

        {!lessons && <p className="mt-8 text-sm text-muted-foreground">Loading lessons…</p>}

        {lessons &&
          DOMAIN_ORDER.map((domainId) => {
            const domain = DOMAINS.find((d) => d.id === domainId)!;
            const domainLessons = lessons
              .filter((l) => l.domainId === domainId)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (domainLessons.length === 0) return null;

            return (
              <section key={domainId} className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {domain.label}
                </h2>
                <div className="mt-2 space-y-2">
                  {domainLessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to="/training/$lessonId"
                      params={{ lessonId: lesson.id }}
                      search={{ smeId }}
                    >
                      <Card className="flex items-center justify-between p-4 hover:bg-secondary/40">
                        <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                        {completedLessonIds.has(lesson.id) && (
                          <Badge variant="secondary">Done</Badge>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

        <Button variant="outline" asChild className="mt-10 w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
