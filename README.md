# Alita

A cybersecurity maturity self-assessment tool for Nairobi digital SMEs, built at USIU-A as part
of the Cybersecurity Maturity Assessment Model (CMAM) thesis. An SME classifies itself into one
of three Implementation Tiers, works through six maturity domains in that tier's language
register, and gets back a weighted composite score, a radar chart of its six domain levels, and
a ranked action list from a Current-vs-Target gap analysis.

The model itself (weights, the Awareness & Training gate, the 108 Annex A descriptor cells) is
documented in the companion architecture spec and Annex A documents — this repo is its
implementation, not a redefinition of it.

---

## Stack

TanStack Start (React + SSR), Tailwind v4, Prisma → PostgreSQL.

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- A PostgreSQL database (a Supabase project's direct connection string works)

---

## Setup

```bash
cp .env.example .env   # set DATABASE_URL
npm install
npx prisma migrate dev # or: npx prisma db push
npx prisma db seed     # seeds the 6 domains + 108 Annex A descriptors
npm run dev            # http://localhost:5173
```

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run test      # vitest — scoring engine + descriptor seed integrity
npm run lint       # eslint
npm run db:seed    # re-seed domains/descriptors
```

---

## Project structure

```
src/
├── routes/
│   ├── index.tsx              # Landing page
│   ├── alita/
│   │   ├── start.tsx          # Org Profile intake + tier classification
│   │   ├── assessment.$assessmentId.tsx  # Current/Target profile flow
│   │   ├── results.$assessmentId.tsx     # Radar chart + composite band
│   │   └── gaps.$smeId.tsx    # Gap analysis / action list
│   └── tools/                 # Standalone free SME tools (invoice, DPA checker, contracts, VAT)
├── components/alita/          # AssessmentShell, DomainRadarChart
├── components/ui/             # shadcn primitives (restyled with Alita's design tokens)
└── lib/alita/
    ├── domains.ts             # 6 domains, weights, NIST CSF mapping (single source of truth)
    ├── scoring.ts             # Composite formula + Awareness gate (pure functions, unit-tested)
    ├── classification.ts      # 5-question Tier self-classification
    └── alita.functions.ts     # Server functions (API layer)

prisma/
├── schema.prisma
└── seed/descriptors.data.ts   # 108 Annex A descriptor cells, verbatim
```

`docs/audit.md` and `docs/dpa-compliance.md` have more background on this repo's history and
data-handling posture.

---

## Notes

- The historical `responses` table (from a prior, now-retired data-collection survey run in this
  same repo) is intentionally left in `prisma/schema.prisma` even though no current code
  references it — it holds real collected research data and is kept queryable.
- No authentication/access-control layer exists yet; see `docs/dpa-compliance.md`'s "known
  limitation" note before any multi-tenant or public deployment.
