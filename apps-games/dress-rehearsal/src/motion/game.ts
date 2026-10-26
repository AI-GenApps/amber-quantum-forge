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
  /** Small bounce on a slot when a piece lands in it. */
  landingPop(target: Animatable): Promise<void>;
  /** A rule chip turns over when it flips between met and not met. */
  chipFlip(target: Animatable): Promise<void>;
  /** The harmony bar eases from its old fill to the new one. */
  meterEase(target: Animatable, from: number, to: number): Promise<void>;
  /** Sheet rising from the bottom edge. */
  sheetSlide(target: Animatable): Promise<void>;
  /** Earned stars appear one after another, 120 ms apart. */
  starReveal(targets: readonly Animatable[]): Promise<void>;
  /** The export preview fades in when the frame changes. */
  frameFade(target: Animatable): Promise<void>;
}

export const LANDING_FRAMES: Keyframe[] = [{ transform: "scale(0.9)" }, { transform: "scale(1)" }];
export const CHIP_FRAMES: Keyframe[] = [
  { transform: "rotateX(80deg)", opacity: 0.4 },
  { transform: "rotateX(0deg)", opacity: 1 },
];
export const SHEET_FRAMES: Keyframe[] = [
  { transform: "translateY(36px)", opacity: 0.4 },
  { transform: "translateY(0)", opacity: 1 },
];
export const STAR_FRAMES: Keyframe[] = [
  { transform: "scale(0.2) rotate(-24deg)", opacity: 0 },
  { transform: "scale(1) rotate(0deg)", opacity: 1 },
];
export const FRAME_FADE_FRAMES: Keyframe[] = [{ opacity: 0.2 }, { opacity: 1 }];

export function meterFrames(from: number, to: number): Keyframe[] {
  const scale = (value: number): string => `scaleX(${Math.min(1, Math.max(0, value / 100))})`;
  return [{ transform: scale(from) }, { transform: scale(to) }];
}

export function createGameMotion(
  reducedMotion: ReducedMotionSource = false,
  motion: Motion = createMotion(reducedMotion),
): GameMotion {
  return {
    get reduced() {
      return motion.reduced;
    },
    landingPop: (target) => motion.spring(target, LANDING_FRAMES, { stiffness: 320, damping: 14 }),
    chipFlip: (target) => motion.tween(target, CHIP_FRAMES, { duration: 220 }),
    meterEase: (target, from, to) =>
      motion.tween(target, meterFrames(from, to), { duration: 320, easing: easings.easeOut }),
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
    frameFade: (target) => motion.tween(target, FRAME_FADE_FRAMES, { duration: 180 }),
  };
}
