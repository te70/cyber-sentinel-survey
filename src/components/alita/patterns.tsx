// Original geometric wax-print-inspired SVG patterns — generic motifs (diamonds, rings, zigzag,
// dots, triangle teeth), not a reproduction of any specific commercial fabric print or named
// symbol. Decorative accent layer only — see the usage notes on the --kitenge-* tokens in
// styles.css. Rendered once via <PatternDefs /> in the root layout so every route can reference
// `url(#p-diamond)` etc. without redeclaring the defs.

export const PATTERN_IDS = {
  diamond: "p-diamond",
  rings: "p-rings",
  zigzag: "p-zigzag",
  dots: "p-dots",
  teeth: "p-teeth",
} as const;

export function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <pattern id={PATTERN_IDS.diamond} width="36" height="36" patternUnits="userSpaceOnUse">
          <path
            d="M18 2 L34 18 L18 34 L2 18 Z"
            fill="none"
            stroke="var(--kitenge-terracotta)"
            strokeWidth="1.6"
            opacity="0.85"
          />
          <circle cx="18" cy="18" r="2.6" fill="var(--kitenge-marigold)" />
        </pattern>

        <pattern id={PATTERN_IDS.rings} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle
            cx="11"
            cy="11"
            r="8"
            fill="none"
            stroke="var(--kitenge-indigo)"
            strokeWidth="1.4"
          />
          <circle cx="11" cy="11" r="3.4" fill="var(--kitenge-emerald)" />
          <circle
            cx="33"
            cy="33"
            r="8"
            fill="none"
            stroke="var(--kitenge-indigo)"
            strokeWidth="1.4"
          />
          <circle cx="33" cy="33" r="3.4" fill="var(--kitenge-emerald)" />
          <circle
            cx="33"
            cy="11"
            r="3"
            fill="none"
            stroke="var(--kitenge-terracotta)"
            strokeWidth="1.4"
          />
          <circle
            cx="11"
            cy="33"
            r="3"
            fill="none"
            stroke="var(--kitenge-terracotta)"
            strokeWidth="1.4"
          />
        </pattern>

        <pattern id={PATTERN_IDS.zigzag} width="28" height="24" patternUnits="userSpaceOnUse">
          <polyline
            points="0,20 7,6 14,20 21,6 28,20"
            fill="none"
            stroke="var(--kitenge-terracotta)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points="0,24 7,10 14,24 21,10 28,24"
            fill="none"
            stroke="var(--kitenge-marigold)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.8"
          />
        </pattern>

        <pattern id={PATTERN_IDS.dots} width="32" height="32" patternUnits="userSpaceOnUse">
          <g fill="var(--kitenge-indigo)">
            <circle cx="8" cy="8" r="2.2" />
            <circle cx="14" cy="6" r="1.3" />
            <circle cx="6" cy="14" r="1.3" />
          </g>
          <g fill="var(--kitenge-emerald)">
            <circle cx="24" cy="24" r="2.2" />
            <circle cx="30" cy="22" r="1.3" />
            <circle cx="22" cy="30" r="1.3" />
          </g>
        </pattern>

        <pattern id={PATTERN_IDS.teeth} width="40" height="16" patternUnits="userSpaceOnUse">
          <polygon points="0,16 10,0 20,16" fill="var(--kitenge-terracotta)" />
          <polygon points="20,16 30,0 40,16" fill="var(--kitenge-marigold)" />
        </pattern>

        <clipPath id="alita-shield-clip">
          <path d="M22 2 C30 6 38 7 44 7 C44 24 40 38 22 44 C4 38 0 24 0 7 C6 7 14 6 22 2 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
