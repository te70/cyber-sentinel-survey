// Muted-sage → deep-teal single-hue progression for maturity Levels 0–5, so a low score
// reads as "early stage" rather than a red-alarm traffic light (brief's T10 concern).
// Same hue family as the --chart-1..5 tokens in styles.css.

const LEVEL_COLORS = [
  "oklch(0.95 0.015 150)", // 0 — Non-existent
  "oklch(0.89 0.03 155)", // 1 — Initial
  "oklch(0.8 0.06 165)", // 2 — Managed
  "oklch(0.68 0.09 172)", // 3 — Defined
  "oklch(0.58 0.1 178)", // 4 — Quantitatively Managed
  "oklch(0.42 0.09 185)", // 5 — Optimising
];

export function levelColor(level: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(level)));
  return LEVEL_COLORS[clamped];
}

// Levels 4-5 are dark enough to need light text on top of the fill.
export function levelTextIsLight(level: number): boolean {
  return level >= 4;
}
