import type { ComponentChildren } from "preact";

/** Watercolour-style vignettes drawn with gradients and line work, viewBox 0 0 300 450. */
const SCENES: Readonly<
  Record<number, { top: string; bottom: string; body: () => ComponentChildren }>
> = {
  1: {
    top: "#1E2D5E",
    bottom: "#7A5A58",
    body: () => (
      <>
        <path class="co-hill" d="M0 330 L70 300 L130 316 L210 284 L300 320 V450 H0 Z" />
        <rect class="co-gl-fill" x="132" y="262" width="36" height="26" />
        <path class="co-gl" d="M150 262 L186 238 M186 238 L194 250" />
        <circle class="co-gl-dot" cx="60" cy="70" r="3" />
        <circle class="co-gl-dot" cx="220" cy="110" r="2.5" />
        <circle class="co-gl-dot" cx="130" cy="150" r="2" />
      </>
    ),
  },
  2: {
    top: "#2A2440",
    bottom: "#5A3F2E",
    body: () => (
      <>
        <circle class="co-gl" cx="96" cy="250" r="54" />
        <circle class="co-gl" cx="96" cy="250" r="30" />
        <circle class="co-gl" cx="204" cy="320" r="40" />
        <path class="co-gl" d="M150 100 Q150 140 120 170 M150 100 Q150 140 180 170" />
        <ellipse class="co-gl" cx="150" cy="96" rx="22" ry="8" />
        <path class="co-hill" d="M0 400 H300 V450 H0 Z" />
      </>
    ),
  },
  3: {
    top: "#1B2342",
    bottom: "#3F3524",
    body: () => (
      <>
        <path class="co-gl" d="M30 440 V120 Q150 40 270 120 V440" />
        <path class="co-gl" d="M60 440 V150 M90 440 V135 M210 440 V135 M240 440 V150" />
        <path class="co-gl" d="M100 230 H200 M100 280 H200 M100 330 H200" />
        <circle class="co-gl-dot" cx="150" cy="190" r="5" />
      </>
    ),
  },
  4: {
    top: "#13203F",
    bottom: "#33455E",
    body: () => (
      <>
        <path class="co-wash" d="M0 150 Q80 100 150 150 T300 120 V210 Q220 250 150 210 T0 230 Z" />
        <circle class="co-gl-dot" cx="70" cy="60" r="3" />
        <circle class="co-gl-dot" cx="210" cy="90" r="2.5" />
        <circle class="co-gl-dot" cx="240" cy="40" r="2" />
        <path class="co-hill" d="M0 380 L90 350 L190 372 L300 340 V450 H0 Z" />
      </>
    ),
  },
  5: {
    top: "#090E1E",
    bottom: "#1B1F36",
    body: () => (
      <>
        <circle cx="150" cy="170" r="62" fill="#050813" />
        <circle class="co-gl" cx="150" cy="170" r="66" style={{ strokeWidth: 6 }} />
        <circle class="co-gl" cx="150" cy="170" r="82" style={{ opacity: 0.4 }} />
        <path class="co-hill" d="M0 390 H300 V450 H0 Z" />
        <circle class="co-gl-dot" cx="150" cy="372" r="6" />
      </>
    ),
  },
  6: {
    top: "#28365F",
    bottom: "#C48F6A",
    body: () => (
      <>
        <circle class="co-gl-dot" cx="196" cy="110" r="7" />
        <path class="co-gl" d="M196 90 V130 M176 110 H216" />
        <path class="co-hill" d="M0 340 Q100 300 190 330 T300 316 V450 H0 Z" />
        <path class="co-gl" d="M110 360 L150 340 M150 340 L150 352" />
      </>
    ),
  },
};

export function LorePlaceholder({ chapter }: { chapter: number }) {
  const scene = SCENES[chapter] ?? SCENES[1];
  if (!scene) return null;
  return (
    <>
      <defs>
        <linearGradient id={`co-lore-${chapter}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={scene.top} />
          <stop offset="1" stop-color={scene.bottom} />
        </linearGradient>
      </defs>
      <rect width="300" height="450" fill={`url(#co-lore-${chapter})`} />
      {scene.body()}
      <rect x="6" y="6" width="288" height="438" class="co-gl co-gl--thin" />
    </>
  );
}
