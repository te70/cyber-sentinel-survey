# DPA compliance — Alita, the tool itself

This tracks compliance for **Alita as a data controller/processor** (it collects business
names and the 5 classification answers from SMEs who use it). This is separate from the D1
Governance checkpoint the tool *scores* in each SME's own assessment — don't conflate the two.

## Researcher's own ODPC registration/exemption status

`Status: [TO BE CONFIRMED BY RESEARCHER]`

This is a placeholder, not a claim. Check applicability at odpc.go.ke against the small-business
exemption test used throughout the model (turnover under KES 5M and fewer than 10 employees,
unless a mandatory-registration sector applies), then replace this line with the actual
registration number or documented exemption basis.

## What Alita collects

- Business name (free text, as entered on the intake screen).
- The 5 Section 4.1 classification answers (headcount band, IT delivery model, digital
  footprint, data-sensitivity band, prior framework exposure) — none of these are personal data
  about an individual; they describe the business.
- Six domain maturity levels (0–5) per assessment, and an optional target profile.
- Lightweight usage events (`domain_viewed` / `domain_scored`) for pilot analytics — no free-text
  content, just which domain and when.

No phone numbers, national ID numbers, or payment details are collected by Alita itself (unlike
the retired Tetrasec survey, which handled M-Pesa numbers for its reward mechanism — that data
remains in the historical `responses` table, untouched, and is out of scope for this document).

## Consent

A plain-language consent notice is shown on the intake screen (`/alita/start`) before any
classification questions are asked, stating what is collected and that Alita is a USIU-A
research tool.

## Known limitation: no per-SME access control

Assessment, results, and gap-analysis pages are addressed by id (like a shareable link) — there
is no login system restricting who can view a given SME's data. This is an accepted trade-off
for a researcher-run pilot with a known, small set of participating SMEs, **not** something to
carry into any public or multi-tenant deployment without adding real access control first.
