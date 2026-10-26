import type { ComponentChildren } from "preact";

/** Gold line glyphs on a soft navy disc, viewBox 0 0 112 112. */
const GLYPHS: Readonly<Record<string, () => ComponentChildren>> = {
  telescope: () => (
    <>
      <path class="co-gl" d="M24 70 L78 34 L86 46 L32 82 Z" />
      <path class="co-gl" d="M70 38 L76 30 L90 40 L84 48" />
      <path class="co-gl" d="M44 72 L34 98 M52 66 L62 98 M48 70 L48 98" />
      <circle class="co-gl-dot" cx="94" cy="22" r="3" />
    </>
  ),
  lens: () => (
    <>
      <circle class="co-gl" cx="56" cy="56" r="26" />
      <circle class="co-gl" cx="56" cy="56" r="14" />
      <path class="co-gl" d="M44 46 Q50 40 58 40" />
      <path class="co-gl" d="M20 94 H92 M30 94 V82 M82 94 V82" />
    </>
  ),
  prism: () => (
    <>
      <path class="co-gl" d="M56 22 L88 78 H24 Z" />
      <path class="co-gl" d="M8 60 L40 62 M72 62 L104 40 M72 68 L104 62 M72 74 L104 84" />
    </>
  ),
  orrery: () => (
    <>
      <circle class="co-gl" cx="56" cy="56" r="10" />
      <ellipse class="co-gl" cx="56" cy="56" rx="38" ry="18" />
      <ellipse class="co-gl" cx="56" cy="56" rx="24" ry="40" />
      <circle class="co-gl-dot" cx="94" cy="56" r="5" />
      <circle class="co-gl-dot" cx="56" cy="16" r="4" />
    </>
  ),
  "star-map": () => (
    <>
      <rect class="co-gl" x="22" y="20" width="68" height="72" rx="4" />
      <path class="co-gl" d="M22 34 H90 M34 20 V92" />
      <path
        class="co-gl"
        d="M64 44 L68 54 L79 55 L71 62 L73 73 L64 67 L55 73 L57 62 L49 55 L60 54 Z"
      />
    </>
  ),
  beacon: () => (
    <>
      <path class="co-gl" d="M46 96 L50 46 H62 L66 96 Z" />
      <path class="co-gl" d="M44 46 H68 L64 34 H48 Z" />
      <path class="co-gl" d="M14 30 L36 38 M98 30 L76 38 M56 8 V26" />
    </>
  ),
  archive: () => (
    <>
      <rect class="co-gl" x="20" y="22" width="72" height="72" rx="3" />
      <path class="co-gl" d="M20 46 H92 M20 70 H92" />
      <path
        class="co-gl"
        d="M30 30 V42 M40 30 V42 M50 30 V42 M30 54 V66 M40 54 V66 M30 78 V90 M40 78 V90 M50 78 V90 M62 78 V90"
      />
    </>
  ),
  "aurora-coil": () => (
    <>
      <path class="co-gl" d="M40 94 V30 M72 94 V30" />
      <path
        class="co-gl"
        d="M34 40 Q56 30 78 40 M34 54 Q56 44 78 54 M34 68 Q56 58 78 68 M34 82 Q56 72 78 82"
      />
      <path class="co-gl" d="M10 22 Q30 6 52 20 M60 20 Q82 6 102 22" />
    </>
  ),
};

export function InstrumentPlaceholder({ id }: { id: string }) {
  const glyph = GLYPHS[id] ?? GLYPHS.telescope;
  return (
    <>
      <defs>
        <radialGradient id={`co-disc-${id}`} cx="50%" cy="40%" r="65%">
          <stop offset="0" stop-color="#22335C" />
          <stop offset="1" stop-color="#101A33" />
        </radialGradient>
      </defs>
      <circle cx="56" cy="56" r="52" fill={`url(#co-disc-${id})`} class="co-disc-ring" />
      {glyph?.()}
    </>
  );
}
