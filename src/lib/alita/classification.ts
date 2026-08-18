// Implementation Tier self-classification — Model_Architecture.docx.pdf, Section 4.1
// (questions, verbatim) and Section 4 (the Tier A/B/C criteria table each answer maps to).

export type Tier = "A" | "B" | "C";

export interface ClassificationOption {
  label: string;
  tier: Tier;
}

export interface ClassificationQuestion {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  text: string;
  options: ClassificationOption[];
}

export const CLASSIFICATION_QUESTIONS: ClassificationQuestion[] = [
  {
    id: "q1",
    text: "How many people work in the business, including you?",
    options: [
      { label: "Just me, or 1–4 people", tier: "A" },
      { label: "5–20 people", tier: "B" },
      { label: "More than 20, or we have a dedicated IT/security setup", tier: "C" },
    ],
  },
  {
    id: "q2",
    text: "Who manages your IT/technical systems — you, an outsourced provider, or an in-house person/team?",
    options: [
      { label: "Me / no one formally, self-taught", tier: "A" },
      { label: "An outsourced provider", tier: "B" },
      { label: "An in-house person or team", tier: "C" },
    ],
  },
  {
    id: "q3",
    text: "Where does most of your business happen — social media/WhatsApp, a mix of platforms and your own systems, or your own custom software/systems?",
    options: [
      { label: "Social media apps (WhatsApp, Instagram, TikTok) ARE the business", tier: "A" },
      { label: "Business systems plus outsourced cloud/IT services", tier: "B" },
      { label: "Custom software, cloud infrastructure, multiple integrated systems", tier: "C" },
    ],
  },
  {
    id: "q4",
    text: "What kind of customer or business information do you store?",
    options: [
      { label: "Names/contacts only", tier: "A" },
      { label: "Payment or booking details", tier: "B" },
      {
        label: "Sensitive personal data — health, HR, or ID records — or data at scale",
        tier: "C",
      },
    ],
  },
  {
    id: "q5",
    text: "Have you used or been required to follow any formal security or data protection standard before?",
    options: [
      { label: "No", tier: "A" },
      { label: "Indirectly, through a provider or client", tier: "B" },
      { label: "Yes, directly", tier: "C" },
    ],
  },
];

export type ClassificationAnswers = Record<ClassificationQuestion["id"], Tier>;

const TIER_ORDER: Tier[] = ["A", "B", "C"];

/**
 * Suggests an Implementation Tier from the 5 classification answers. Always overridable
 * by the SME (Section 4.1's P20 case) — this is the *suggestion* only.
 *
 * The source spec doesn't define a derivation algorithm, so this is a provisional,
 * documented heuristic (same treatment as the researcher-set weights/gate): the mode
 * (most frequent tier) across the 5 answers, tying toward the lower tier. Lower-tie-break
 * keeps the default suggestion conservative, since the model already supports opting
 * *up* via override rather than down.
 */
export function suggestTier(answers: ClassificationAnswers): Tier {
  const counts: Record<Tier, number> = { A: 0, B: 0, C: 0 };
  for (const tier of Object.values(answers)) counts[tier]++;

  let best: Tier = "A";
  for (const tier of TIER_ORDER) {
    if (counts[tier] > counts[best]) best = tier;
  }
  return best;
}
