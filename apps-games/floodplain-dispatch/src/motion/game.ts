import {
  type Animatable,
  createMotion,
  easings,
  type Motion,
  type ReducedMotionSource,
} from "@web-games/kit";
import { STAR_STAGGER_MS } from "../audio/events";

export interface GameMotion {
  readonly reduced: boolean;
  /** Ring that pulses out of a freshly placed piece. */
  placementPop(target: Animatable): Promise<void>;
  /** Small bounce on a count chip when its number changes. */
  badgePop(target: Animatable): Promise<void>;
  /** Sheet rising from the bottom edge. */
  sheetSlide(target: Animatable): Promise<void>;
  /** Earned stars appear one after another, 120 ms apart. */
  starReveal(targets: readonly Animatable[]): Promise<void>;
  /** Highlight of the current week on the forecast bar. */
  weekPulse(target: Animatable): Promise<void>;
}

export const POP_FRAMES: Keyframe[] = [
  { transform: "scale(0.7)", opacity: 0.9 },
  { transform: "scale(1.35)", opacity: 0 },
];
export const BADGE_FRAMES: Keyframe[] = [{ transform: "scale(0.82)" }, { transform: "scale(1)" }];
export const SHEET_FRAMES: Keyframe[] = [
  { transform: "translateY(36px)", opacity: 0.4 },
  { transform: "translateY(0)", opacity: 1 },
];
export const STAR_FRAMES: Keyframe[] = [
  { transform: "scale(0.2) rotate(-24deg)", opacity: 0 },
  { transform: "scale(1) rotate(0deg)", opacity: 1 },
];
export const PULSE_FRAMES: Keyframe[] = [{ opacity: 0.35 }, { opacity: 1 }];

export function createGameMotion(
  reducedMotion: ReducedMotionSource = false,
  motion: Motion = createMotion(reducedMotion),
): GameMotion {
  return {
    get reduced() {
      return motion.reduced;
    },
    placementPop: (target) => motion.spring(target, POP_FRAMES, { stiffness: 260, damping: 16 }),
    badgePop: (target) => motion.spring(target, BADGE_FRAMES, { stiffness: 320, damping: 14 }),
    sheetSlide: (target) =>
      motion.tween(target, SHEET_FRAMES, { duration: 220, easing: easings.easeOut }),
    async starReveal(targets) {
      await Promise.all(
        targets.map((target, index) =>
          motion.spring(target, STAR_FRAMES, {
            delay: index * STAR_STAGGER_MS,
            stiffness: 240,
            damping: 14,
          }),
        ),
      );
    },
    weekPulse: (target) => motion.tween(target, PULSE_FRAMES, { duration: 260 }),
  };
}
