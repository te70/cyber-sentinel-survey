import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PATTERN_IDS } from "@/components/alita/patterns";
import { SmePageHeader } from "@/components/alita/SmePageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import type { Tier } from "@/lib/alita/classification";
import { getLessons, getTrainingCompletions } from "@/lib/alita/training.functions";
import { getSme } from "@/lib/alita/alita.functions";

// Real researcher contact, same address used on the landing page's Contact section.
const RESEARCHER_EMAIL = "njengat1@usiu.ac.ke";

const SearchSchema = z.object({ smeId: z.string().uuid().optional() });

export const Route = createFileRoute("/training/")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: TrainingHub,
});

// D4 (the gate domain) leads the hub — most lessons live there and it's the thesis's central
// claim, so it shouldn't be buried alphabetically behind D1-D3.
const DOMAIN_ORDER: DomainId[] = ["D4", "D1", "D2", "D3", "D5", "D6"];

type Audience = "owner" | "staff" | "both";

interface LessonSummary {
  id: string;
  // "GEN" is the seeded pseudo-domain for lessons not tied to a scored domain (talent turnover,
  // solo-operator continuity) — see the comment in prisma/seed/lessons.data.ts.
  domainId: DomainId | "GEN";
  tier: Tier;
  title: string;
  sortOrder: number;
  audience: Audience;
}

const AUDIENCE_LABEL: Record<Audience, string> = { owner: "Owner", staff: "Staff", both: "" };

function LessonGroup({
  label,
  lessons,
  smeId,
  completedLessonIds,
}: {
  label: string;
  lessons: LessonSummary[];
  smeId: string | undefined;
  completedLessonIds: Set<string>;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <div className="mt-2 space-y-2">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to="/training/$lessonId"
            params={{ lessonId: lesson.id }}
            search={{ smeId }}
          >
            <Card className="flex items-center justify-between p-4 hover:bg-secondary/40">
              <span className="text-sm font-medium text-foreground">{lesson.title}</span>
              <div className="flex items-center gap-1.5">
                {lesson.audience !== "both" && (
                  <Badge variant="outline">{AUDIENCE_LABEL[lesson.audience]}</Badge>
                )}
                {completedLessonIds.has(lesson.id) && <Badge variant="secondary">Done</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CompletionCelebration() {
  return (
    <Card className="relative mt-6 overflow-hidden border-kitenge-emerald/40 p-5">
      <svg className="absolute inset-0" width="100%" height="100%" aria-hidden="true">
        <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.rings})`} opacity="0.12" />
      </svg>
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-kitenge-emerald">
          All training complete
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">
          You've been through every lesson available to you — nice work.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That's the full set for your tier. If you'd like to go further — a topic you want covered
          in more depth, or training for your team — reach out directly.
        </p>
        <a
          href={`mailto:${RESEARCHER_EMAIL}?subject=${encodeURIComponent("More training — Alita")}`}
          className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          {RESEARCHER_EMAIL}
        </a>
      </div>
    </Card>
  );
}

function TrainingHub() {
  const { smeId } = Route.useSearch();
  const [smeName, setSmeName] = useState<string | null>(null);
  const [smeTier, setSmeTier] = useState<Tier | null>(null);
  const [tier, setTier] = useState<Tier>("A");
  const [audienceFilter, setAudienceFilter] = useState<"owner" | "staff" | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);
  // Tracked separately from `lessons` (which is filtered by the audience toggle for display) so
  // "all done" reflects the SME's full tier set, not just whichever slice is currently shown.
  const [allTierLessonIds, setAllTierLessonIds] = useState<string[] | null>(null);

  function loadSmeData() {
    if (!smeId) return;
    setLoadError(false);
    getSme({ data: { smeId } })
      .then(({ sme }) => {
        setTier(sme.tier);
        setSmeName(sme.name);
        setSmeTier(sme.tier);
      })
      .catch(() => setLoadError(true));
    getTrainingCompletions({ data: { smeId } })
      .then(({ completions }) => setCompletedLessonIds(new Set(completions.map((c) => c.lessonId))))
      .catch(() => setLoadError(true));
  }

  useEffect(loadSmeData, [smeId]);

  function loadLessons() {
    setLoadError(false);
    setLessons(null);
    getLessons({ data: { tier, audience: audienceFilter ?? undefined } })
      .then(({ lessons: rows }) => setLessons(rows as LessonSummary[]))
      .catch(() => setLoadError(true));
  }

  useEffect(loadLessons, [tier, audienceFilter]);

  useEffect(() => {
    setAllTierLessonIds(null);
    getLessons({ data: { tier } })
      .then(({ lessons: rows }) => setAllTierLessonIds(rows.map((l) => l.id)))
      .catch(() => setLoadError(true));
  }, [tier]);

  const allTrainingComplete =
    !!smeId &&
    !!allTierLessonIds &&
    allTierLessonIds.length > 0 &&
    allTierLessonIds.every((id) => completedLessonIds.has(id));

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load the Training Hub. Please check your connection and try again.
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              loadSmeData();
              loadLessons();
            }}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        {smeId && smeName && smeTier && (
          <SmePageHeader smeId={smeId} name={smeName} tier={smeTier} />
        )}

        <h1 className="text-2xl font-bold text-foreground">Training Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Short lessons on the areas that matter most — a few minutes each.
        </p>

        {allTrainingComplete && <CompletionCelebration />}

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

        <div className="mt-2 flex gap-2">
          {(
            [
              { value: null, label: "Everyone" },
              { value: "owner", label: "Owner" },
              { value: "staff", label: "Staff" },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.label}
              size="sm"
              variant={audienceFilter === opt.value ? "default" : "outline"}
              onClick={() => setAudienceFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {!lessons && (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        )}

        {lessons &&
          DOMAIN_ORDER.map((domainId) => {
            const domain = DOMAINS.find((d) => d.id === domainId)!;
            const domainLessons = lessons
              .filter((l) => l.domainId === domainId)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (domainLessons.length === 0) return null;
            return (
              <LessonGroup
                key={domainId}
                label={domain.label}
                lessons={domainLessons}
                smeId={smeId}
                completedLessonIds={completedLessonIds}
              />
            );
          })}

        {lessons &&
          (() => {
            const generalLessons = lessons
              .filter((l) => l.domainId === "GEN")
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (generalLessons.length === 0) return null;
            return (
              <LessonGroup
                label="General"
                lessons={generalLessons}
                smeId={smeId}
                completedLessonIds={completedLessonIds}
              />
            );
          })()}

        <Button variant="outline" asChild className="mt-10 w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
