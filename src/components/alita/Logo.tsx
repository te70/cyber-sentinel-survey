// The Growing Shield mark — a rounded shield/leaf hybrid (not sharp or militaristic), with a
// marigold sprout and a fine diamond-lattice fill in the lower half. Deliberately not a padlock
// or shield-with-checkmark: reads as protection *and* growth, tying to the training/awareness
// narrative rather than pure lockdown security. Self-contained (its own local defs) so it works
// standalone anywhere, independent of the shared pattern library in patterns.tsx.

interface AlitaMarkProps {
  className?: string;
  size?: number;
}

export function AlitaMark({ className, size = 44 }: AlitaMarkProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <clipPath id="alita-mark-shield-clip">
          <path d="M22 2 C30 6 38 7 44 7 C44 24 40 38 22 44 C4 38 0 24 0 7 C6 7 14 6 22 2 Z" />
        </clipPath>
        <pattern id="alita-mark-mini-diamond" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M5 0 L10 5 L5 10 L0 5 Z"
            fill="none"
            stroke="var(--kitenge-emerald)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <path
        d="M22 2 C30 6 38 7 44 7 C44 24 40 38 22 44 C4 38 0 24 0 7 C6 7 14 6 22 2 Z"
        fill="var(--primary)"
      />
      <path
        d="M22 2 C30 6 38 7 44 7 C44 24 40 38 22 44 C4 38 0 24 0 7 C6 7 14 6 22 2 Z"
        fill="none"
        stroke="var(--kitenge-terracotta)"
        strokeWidth="1.4"
        opacity="0.5"
      />
      <g clipPath="url(#alita-mark-shield-clip)">
        <rect
          x="0"
          y="20"
          width="44"
          height="24"
          fill="url(#alita-mark-mini-diamond)"
          opacity="0.9"
        />
      </g>
      <path
        d="M22 10 C24 18 30 20 30 20 C30 20 24 22 22 30 C20 22 14 20 14 20 C14 20 20 18 22 10 Z"
        fill="var(--kitenge-marigold)"
      />
    </svg>
  );
}

interface AlitaLogoProps {
  className?: string;
  markSize?: number;
  wordmarkClassName?: string;
}

export function AlitaLogo({ className, markSize = 36, wordmarkClassName }: AlitaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <AlitaMark size={markSize} />
      {/* This app has no theme toggle today (the .dark tokens in styles.css are unused
          boilerplate), so — like every other page here — this resolves via the light-mode
          tokens only; no dark: variant to keep it consistent with the rest of the app. */}
      <span className={`font-extrabold text-kitenge-terracotta ${wordmarkClassName ?? "text-lg"}`}>
        Alita
      </span>
    </div>
  );
}
