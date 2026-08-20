// Cumulative (Guttman-style) scoring for the multi-item domain assessment battery.
// Pure functions, no HTTP/DB concerns — mirrors scoring.ts's pattern.
//
// Deliberately NOT a sum/average: the model's levels are staged and cumulative (CMMI/C2M2-style)
// — you can't credibly be "Defined" without also doing what "Managed" requires. A respondent's
// domain level is the highest level L such that every level from 1 through L was endorsed,
// unbroken from the bottom. This is what keeps the instrument consistent with what the model
// actually claims levels mean (Section 5 of the architecture doc) rather than borrowing
// 16personalities' summed-trait scoring wholesale.

// Researcher-set provisional value (same treatment as the gate threshold/cap and domain
// weights elsewhere in this model) — likely to change after expert panel review or pilot data.
export const ENDORSEMENT_THRESHOLD = 4;

export type LevelResponses = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

/**
 * Highest level L such that levels 1..L were all endorsed (response >= ENDORSEMENT_THRESHOLD),
 * unbroken from the bottom. A missing/unanswered level is treated identically to a
 * below-threshold response — it can never inflate the computed level, whether the gap is a
 * genuine "not there yet" or simply an incomplete battery.
 */
export function computeCumulativeLevel(responses: LevelResponses): number {
  let level = 0;
  for (let l = 1; l <= 5; l++) {
    const value = responses[l as 1 | 2 | 3 | 4 | 5];
    if (value === undefined || value < ENDORSEMENT_THRESHOLD) break;
    level = l;
  }
  return level;
}
