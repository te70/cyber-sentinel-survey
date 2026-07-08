# Tetrasec Cybersecurity Survey

A cybersecurity maturity assessment platform for Nairobi digital SMEs. Participants complete a short survey, receive an instant maturity score across six security domains, and earn a KSh 50 M-Pesa reward on completion.

The repository contains two independent applications:

| App | Tech | Directory |
|-----|------|-----------|
| Survey web app | TanStack Start (React + SSR), Tailwind v4, Supabase | `/` (root) |
| Fraud engine | NestJS, TypeORM, PostgreSQL | `fraud-engine/` |

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- A **Supabase** project (free tier works)
- A **PostgreSQL** database accessible to the fraud engine (can be the same Supabase project via the direct connection string)

---

## 1. Survey Web App

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` (exposed to the browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as `SUPABASE_PUBLISHABLE_KEY` (exposed to the browser) |
| `VITE_SUPABASE_PROJECT_ID` | Same as `SUPABASE_PROJECT_ID` (exposed to the browser) |
| `SURVEY_SESSION_SECRET` | A long random string used to sign session cookies (e.g. `openssl rand -hex 32`) |

### Database migrations

Apply the Supabase migration to set up the schema:

```bash
# Using the Supabase CLI (recommended)
npx supabase db push

# Or apply manually in the Supabase SQL editor:
# supabase/migrations/20260616150852_*.sql
```

### Install and run

```bash
# Install dependencies
npm install

# Development server (hot reload, runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Linting and formatting

```bash
npm run lint
npm run format
```

---

## 2. Fraud Engine

The fraud engine is a separate NestJS microservice that handles phone OTP verification, fraud scoring, and M-Pesa payouts. It runs on port `3001` by default.

### Environment variables

Create `fraud-engine/.env`:

```bash
cp fraud-engine/.env.example fraud-engine/.env   # if example exists
# or create it manually with the variables below
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string — `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret for signing OTP session tokens (use `openssl rand -hex 32`) |
| `AT_USERNAME` | Africa's Talking account username |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_ENVIRONMENT` | `sandbox` for testing, `production` for live SMS/payments |
| `AT_PAYMENT_PRODUCT` | Africa's Talking payment product name (e.g. `TetrasecSurveys`) |
| `FRAUD_BASE_SCORE` | Starting score before signals are applied (default: `60`) |
| `FRAUD_AUTO_PASS_THRESHOLD` | Score at or above which a submission is auto-approved (default: `70`) |
| `FRAUD_REVIEW_THRESHOLD` | Score below which a submission goes to manual review (default: `40`) |
| `FRAUD_HOLD_HOURS` | Hours to hold a payout before releasing it (default: `48`) |
| `SERPAPI_KEY` | Optional — SerpAPI key for Google search presence checks (falls back to DuckDuckGo if unset) |
| `NODE_ENV` | Must be `production` before any real M-Pesa payouts fire |

### Database schema

Apply the fraud engine migration to your PostgreSQL database:

```bash
# Run the SQL file directly against your database
psql "$DATABASE_URL" -f supabase/migrations/20260619000000_fraud_engine_schema.sql
```

### Install and run

```bash
cd fraud-engine

# Install dependencies
npm install

# Development (hot reload, runs on http://localhost:3001)
npm run start:dev

# Production build then start
npm run build
npm run start:prod
```

### Running tests

```bash
cd fraud-engine

# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:cov
```

All 69 unit tests should pass. The `[Nest] ERROR` lines printed during the test run are expected — they come from intentional error-path test cases.

---

## Project structure

```
.
├── src/
│   ├── routes/              # TanStack file-based routes
│   │   ├── index.tsx        # Home / landing page
│   │   ├── screening.tsx    # Eligibility + demographics
│   │   ├── how-it-works.tsx
│   │   ├── survey.tsx
│   │   ├── complete.tsx
│   │   ├── auth.tsx         # Admin login
│   │   ├── surveys/         # Authenticated survey sections (A–D, dashboard, report)
│   │   ├── surveys-admin/   # Admin views (queue, payouts, export)
│   │   └── tools/           # Free tools (invoice, compliance, contracts, tax)
│   ├── components/          # Shared UI components
│   ├── lib/survey/          # Schema definitions, server functions, session logic
│   └── styles.css           # Tailwind v4 theme tokens
│
├── fraud-engine/
│   └── src/
│       ├── otp/             # Phone OTP send + verify
│       ├── instant-checks/  # Real-time fraud signals (timing, duplicates, etc.)
│       ├── enrichment/      # Async enrichment (website, WHOIS, email, search)
│       ├── scorer/          # Fraud score computation and routing
│       ├── payout/          # M-Pesa payout queue and scheduler
│       ├── review/          # Manual review API
│       ├── survey/          # Survey submission intake
│       └── entities/        # TypeORM entity definitions
│
└── supabase/
    └── migrations/          # SQL migration files
```

---

## Key URLs (development)

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Survey home page |
| `http://localhost:3000/screening` | Eligibility check |
| `http://localhost:3000/how-it-works` | How it works |
| `http://localhost:3000/auth` | Admin login |
| `http://localhost:3000/tools/invoice` | Invoice generator |
| `http://localhost:3000/tools/compliance` | DPA compliance checker |
| `http://localhost:3000/tools/contracts` | Contract generator |
| `http://localhost:3000/tools/tax` | VAT calculator |
| `http://localhost:3001` | Fraud engine API |

---

## Notes

- **M-Pesa payouts** are gated behind `NODE_ENV=production` in the fraud engine. In any other environment, `releaseDuePayouts` returns early and `sendMpesaPayout` throws. This prevents accidental live payments during development.
- **Survey data** is stored client-side in `localStorage` under the keys `ts_survey_sectionA`, `ts_survey_sectionB`, `ts_survey_sectionC`, `ts_survey_sectionD`, and `ts_screening_demographics`. The server only maintains a signed session cookie to authenticate section saves.
- **Admin access** is at `/auth`. In development bypass mode, any login attempt succeeds without a real Supabase user.
