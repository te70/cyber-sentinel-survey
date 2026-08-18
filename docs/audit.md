# Phase 0 Audit — "Alita/CMAM conversion" brief vs. actual repo state

Date: 2026-08-18

## Summary

The brief describes converting *"the existing commercial NestJS + Next.js + Supabase tool"*
into an academic CMAM assessment product ("Alita"). **That description does not match this
repository.** This repo is not a commercial SaaS product — it is **Tetrasec**, a live USIU-A
MSc research instrument: a perception/data-collection survey targeting 330 verified responses
from Nairobi digital SMEs, paying a KSh 50 M-Pesa reward per completed response, with a small
NestJS microservice dedicated to fraud-prevention on that reward program. Building "Alita" as
specified in the brief is effectively a **new, much larger product**, not a strip-down of
existing commercial scope.

## Actual stack

| Layer | Reality | Brief assumed |
|---|---|---|
| Frontend | TanStack Start (React 19, file-based routes, SSR) + Tailwind v4 | Next.js |
| Backend/data | TanStack Start server functions (`*.functions.ts`) + Prisma → Postgres, plus Supabase (auth + a legacy migration) | NestJS API |
| Secondary service | `fraud-engine/` — standalone NestJS + TypeORM microservice, port 3001 | (assumed part of the main app) |
| DB | Two schema sources: `prisma/schema.prisma` (`responses`, `payout_attempts`) and `supabase/migrations/*.sql` (legacy + fraud-engine schema) | single Supabase schema |

## What the app actually does today

- `/`, `/how-it-works`, `/screening` → eligibility gate (sector, size, phone regex `^(07|01)\d{8}$`), consent.
- `/survey` → 10-step paginated flow: Section A (org profile), B1–B6 (Likert agreement statements
  that *thematically* map to the CMAM domains — Governance, Risk Mgmt, Access Control, Incident
  Response, Recovery, Awareness), B7 (threat exposure), Section C (adoption-barrier statements),
  Section D (TAM-style usability/perception questions about the survey/model itself — this is a
  **validation instrument for the model**, not the model's delivery tool).
- `/surveys/report` → an already-built results screen with its own scoring: `scoreDomain()` (%
  yes-answers per B-domain), `overallScore()` (simple average, not weighted), `getTier()` (5 bands:
  Initial/Developing/Defined/Managed/Optimising by score cutoffs), and `findGaps()`/`findBarriers()`
  driving a recommendations list keyed to a fixed `B_RECS` content dictionary branded **"Tetrasec"**
  (service upsells like "Tetrasec Policy Starter Pack").
- `surveys-admin/` → researcher dashboard (progress vs. 330, export).
- `tools/` → free-standing SME tools (invoice, compliance, contracts, tax) — unrelated to CMAM.
- `fraud-engine/` → OTP verification, timing/duplicate signal checks, website/WHOIS enrichment,
  a fraud score + routing, M-Pesa B2C payout queue/scheduler, manual review API. This exists
  solely to stop fake survey submissions from draining the reward budget — it is **not** a
  billing/subscription system and has nothing to do with "plan-tier gating."

## Gap vs. the Alita/CMAM brief

None of the following exist yet and would need to be built from scratch, not repurposed:

- SME **Tier** (A/B/C) self-classification (5-question instrument) — no equivalent exists.
  Today's `getTier()` returns a maturity **band** derived from score, which is closer to the
  brief's "Level" concept, not its "Tier" concept. Reusing the name `tier` for two different
  ideas is exactly the collision Section 2 of the architecture doc warns against — the existing
  `getTier()` naming should **not** carry over as-is.
- Six fixed **domains with weights** (0.15/0.12/0.15/0.25/0.18/0.15) and NIST CSF mapping stored
  as data — today's `B_DOMAINS` array has no weights and no NIST mapping.
- **Annex A descriptor content** (108 rows: 6 domains × 6 levels × 3 tiers) — does not exist.
  Today's content is 36 Likert *statements* (6 per B-domain) with a fixed yes/no recommendation
  dictionary (`B_RECS`), not level-by-tier descriptor text.
- Weighted **composite scoring with the D4 awareness gate** (`MIN(rawComposite, 1.9)` when
  D4 < 2) — does not exist. Today's scoring is an unweighted average of percentages, no gate.
- **Current vs. Target profile** distinction, gap-priority tagging — does not exist. Today's
  report is single-pass only.
- `dpa_checkpoints` as independently queryable scored items (registration exemption in D1,
  72h breach notification in D5) — does not exist as structured data; DPA appears only as
  Likert statement text (e.g. B1's Kenya DPA item) and in `B_RECS` recommendation copy.
- Radar/hexagon chart of six domain levels — `report.tsx` was not read in full for chart type;
  confirm before assuming reuse.
- No billing/subscription/multi-tenant SaaS code exists anywhere to strip (Phase 1 as written
  doesn't apply).

## What's genuinely reusable

- Auth shell (`_authenticated/`, `auth.tsx`), layout/design system (`components/ui/*`,
  `components/surveys/*`), Tailwind v4 token setup in `styles.css`.
- Prisma + Postgres pattern for new tables (`smes`, `domains`, `descriptors`, `assessments`, etc.
  from Phase 2 of the brief) — fits the existing `prisma/schema.prisma` approach better than
  inventing a parallel Supabase-only schema.
- Server-function pattern (`createServerFn`) as the API layer — there is no NestJS API in the
  main app to add REST endpoints to; Phase 6 endpoints would be TanStack server functions, not
  NestJS controllers, unless a new NestJS module is deliberately introduced.

## Uncommitted working-tree state (pre-existing, not made by this session)

At the start of this session the working tree already had unstaged changes, unrelated to the
Alita brief:

- Full deletion of `fraud-engine/` (all source files, config, lockfile).
- Deletion of `src/routes/complete.tsx` and `src/routes/surveys/complete.tsx`, with `/survey.tsx`
  now routing completion to `/surveys/report` instead.
- Modified `screening.tsx` (duplicate/ineligible messages both collapsed to a single generic
  "You are not qualified" message), `survey.functions.ts` (website scanner hardening), and
  `report.tsx`/`section-c.tsx`/`section-d.tsx`.

This looks like separate, real in-progress work on the live Tetrasec survey (not related to
today's brief) sitting uncommitted. **It has not been touched or reverted by this audit.**

## Recommendation

Given the brief's core premises (NestJS+Next.js commercial app with billing to strip) don't
hold, Phases 1 and 1a onward can't be executed as literally written. Alita is closer to a
**net-new product** that could live alongside Tetrasec in this repo (reusing auth/design
system/Prisma patterns) than a strip-and-rename of existing scope. Confirming direction with
the user before starting Phase 1.
