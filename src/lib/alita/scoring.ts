// CMAM scoring engine — pure functions, no HTTP/DB concerns.
// Formula transcribed from Model_Architecture.docx.pdf, Section 10.1.

import { DOMAIN_IDS, DOMAIN_WEIGHTS, type DomainId } from "./domains";

// Researcher-set provisional values (Section 12.3) — likely to change after expert panel
// review. Changing the model's gate behaviour should only ever require editing these two
// constants, never the logic below.
export const AWARENESS_GATE_THRESHOLD = 2;
export const AWARENESS_GATE_CAP = 1.9;

export const BAND_THRESHOLDS: { max: number; label: string }[] = [
  { max: 0.9, label: "Non-existent" },
  { max: 1.9, label: "Initial" },
  { max: 2.9, label: "Managed" },
  { max: 3.9, label: "Defined" },
  { max: 4.9, label: "Quantitatively Managed" },
  { max: 5.0, label: "Optimising" },
];

export type DomainScores = Record<DomainId, number>;

export function calculateRawComposite(scores: DomainScores): number {
  return DOMAIN_IDS.reduce((sum, id) => sum + DOMAIN_WEIGHTS[id] * scores[id], 0);
}

export function applyAwarenessGate(
  rawComposite: number,
  d4Level: number,
): { composite: number; gated: boolean } {
  if (d4Level < AWARENESS_GATE_THRESHOLD) {
    return { composite: Math.min(rawComposite, AWARENESS_GATE_CAP), gated: true };
  }
  return { composite: rawComposite, gated: false };
}

export function getBandLabel(composite: number): string {
  const band = BAND_THRESHOLDS.find((b) => composite <= b.max);
  return band ? band.label : BAND_THRESHOLDS[BAND_THRESHOLDS.length - 1].label;
}
