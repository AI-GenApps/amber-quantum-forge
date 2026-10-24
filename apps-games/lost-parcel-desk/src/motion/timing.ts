/** Stamps on the reveal appear one after another, 140 ms apart. */
export const STAMP_STAGGER_MS = 140 as const;
/** The rubber stamp falls, lands with a thud and bounces slightly. */
export const STAMP_FALL_MS = 520 as const;
/** The reveal text types at about 40 characters per second. */
export const TYPEWRITER_CPS = 40 as const;
export const TYPEWRITER_MS_PER_CHAR = Math.round(1000 / TYPEWRITER_CPS);
export const FLIP_MS = 420 as const;
export const TOAST_SLIDE_MS = 240 as const;
