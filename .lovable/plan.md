# Cybersecurity Maturity Survey — Build Plan

A full-stack survey app for USIU-A MSc research, targeting 330 verified responses from Nairobi digital SMEs, with M-Pesa reward disbursement and an admin dashboard.

## Stack decisions

- **Frontend:** TanStack Start + React + Tailwind v4 (project default). Routes in `src/routes/`.
- **Backend:** Lovable Cloud (Supabase under the hood) — database, auth, server functions. I'll enable this on build.
- **M-Pesa Daraja:** Implemented as TanStack server functions (token fetch, B2C payout) + a public route `/api/public/daraja/result` for the async B2C result callback. Secrets stored via the secrets tool.
- **Admin auth:** Lovable Cloud email/password + a `user_roles` table with an `admin` role (the brief's single shared password is insecure — I'll replace it with a proper admin login; see Open question 1).

## Routes

- `/` — landing: title, USIU-A placeholder logo, description, eligibility requirements, live `X of 330` counter, "Start Survey" CTA (hidden when target reached), consent banner on first visit (localStorage flag).
- `/screening` — 4 gate questions + M-Pesa phone input (regex `^(07|01)\d{8}$`). On pass: hash phone (SHA-256), dedup check, issue short-lived session JWT, create `responses` row with `screened_in=true`.
- `/survey` — paginated, sticky progress bar "Section X of 8". Pages: A, B1, B2, B3, B4, B5, B6, B7, C, D. Auto-save jsonb per section on Next. Likert rows collapse to vertical stacks <640px. Reverse-phrased D1 items flagged with a visible note.
- `/complete` — success screen, triggers B2C payout server fn, shows masked phone + payout status; fallback message on failure.
- `/_authenticated/admin` — dashboard: progress vs 330, completed/partial/screened-out counts, filterable table (sector, size, payout status), masked phone display, CSV export (anonymised, no phones), manual retry for failed payouts.

## Database (migration)

`responses` table with columns from the brief (`phone_hash` unique, `section_a`–`section_d` jsonb, `mpesa_payout_status`, `mpesa_transaction_id`, timestamps, `screened_in`, `completed`).
`payout_attempts` table for audit log of every Daraja call (request id, status, raw response).
`app_role` enum (`admin`) + `user_roles` table + `has_role()` security-definer function (per platform pattern).

RLS: `responses` is server-only (all reads/writes go through server fns using service role after JWT validation); no anon policies. `user_roles` readable by authenticated user for self.

## Fraud prevention

- Phone hash dedup on screening (block if any row with same hash has `completed=true`).
- Max 1 partial per phone: second incomplete attempt returns a resume token tied to existing row.
- Session JWT (HS256, 2h expiry, signed with server secret) carries `response_id` + `phone_hash`; every section save validates it.
- Payout server fn checks `mpesa_payout_status != 'sent'` before calling Daraja (1 payout per response ever).

## M-Pesa Daraja integration

- `getDarajaToken()` server fn — OAuth token cache in-memory per request.
- `sendB2C({ phone, amount, responseId })` server fn — called from `/complete` after marking `completed=true`.
- `/api/public/daraja/result` — receives async result, updates `mpesa_payout_status` + `mpesa_transaction_id`. Verifies the call by matching `ConversationID` to a pending `payout_attempts` row.
- Secrets needed: `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_B2C_INITIATOR_NAME`, `DARAJA_B2C_SECURITY_CREDENTIAL`, `DARAJA_B2C_SHORTCODE`, `SURVEY_SESSION_SECRET`. Result URL is derived from the deployed domain.

## Design

Navy `#0F2044` + electric green `#00C853` accent + white, tokens in `src/styles.css` via `@theme`. Inter via `<link>` in `__root.tsx`. Card-based survey layout, sticky progress bar, ARIA labels, inline red validation on Next.

## Build order

1. Enable Lovable Cloud, run schema migration, add Daraja secrets.
2. Design tokens + root layout + landing page with live counter.
3. Screening flow (gate + phone + dedup + session JWT issuance).
4. Survey pages A → D with auto-save server fn.
5. Completion + Daraja B2C payout + result callback route.
6. Admin auth gate + dashboard + CSV export + retry.

## Open questions

1. **Admin access:** The brief specifies a single `ADMIN_PASSWORD` env var, but that's a known privilege-escalation pattern. I'd like to use Lovable Cloud auth (email/password) with you as the first admin user (added via `user_roles`). OK to proceed that way?
2. **Daraja credentials:** Do you have **production** Daraja B2C credentials approved by Safaricom, or should I wire it for the **sandbox** first (test shortcode 600000, test MSISDNs) so the flow is verifiable before go-live?
3. **Consent record:** Should the "I Agree & Continue" consent be just a client-side flag, or recorded server-side per response (timestamp + IP) for IRB audit?
