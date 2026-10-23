import { type Animatable, easings, type Motion } from "@web-games/kit";

export const PULSE_MS = 220;
export const WASH_MS = 900;
export const FADE_MS = 360;
export const ECLIPSE_PHASES = {
  dimMs: 700,
  ringMs: 1100,
  returnMs: 600,
} as const;

type Target = Animatable | null | undefined;

/** A short swell on whatever was just bought. Does nothing when motion is reduced. */
export function purchasePulse(motion: Motion, target: Target): Promise<void> {
  if (motion.reduced || !target) return Promise.resolve();
  return motion.tween(
    target,
    [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }],
    { duration: PULSE_MS, easing: easings.easeOut },
  );
}

/** A soft gold wash over the chart when the last star is joined. */
export function goldWash(motion: Motion, target: Target): Promise<void> {
  if (motion.reduced || !target) return Promise.resolve();
  return motion.tween(target, [{ opacity: 0 }, { opacity: 0.42, offset: 0.35 }, { opacity: 0 }], {
    duration: WASH_MS,
    easing: easings.easeInOut,
  });
}

/** Chapter card and similar: fade and rise into place. */
export function fadeIn(motion: Motion, target: Target, durationMs = FADE_MS): Promise<void> {
  if (motion.reduced || !target) return Promise.resolve();
  return motion.tween(
    target,
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: durationMs, easing: easings.easeOut },
  );
}

export interface EclipseTargets {
  readonly root: Target;
  readonly disc: Target;
  readonly text: Target;
}

/**
 * The Eclipse in three beats over `ECLIPSE_PHASES` (2.4 s): the sky dims, a ring of light grows
 * around the dark disc, then everything returns. Slow, one fade per beat, no flashing.
 */
export async function playEclipse(motion: Motion, targets: EclipseTargets): Promise<void> {
  const { dimMs, ringMs, returnMs } = ECLIPSE_PHASES;
  const { root, disc, text } = targets;
  if (motion.reduced) return;
  if (root) {
    await motion.tween(root, [{ opacity: 0 }, { opacity: 1 }], { duration: dimMs });
  }
  const ring = disc
    ? motion.tween(
        disc,
        [
          { transform: "scale(0.35)", opacity: 0.4 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: ringMs, easing: easings.easeInOut },
      )
    : Promise.resolve();
  const words = text
    ? motion.tween(text, [{ opacity: 0 }, { opacity: 1 }], { duration: ringMs, delay: 200 })
    : Promise.resolve();
  await Promise.all([ring, words]);
  if (root) {
    await motion.tween(root, [{ opacity: 1 }, { opacity: 0 }], { duration: returnMs });
  }
}
