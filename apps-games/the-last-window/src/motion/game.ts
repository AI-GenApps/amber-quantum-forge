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
  /** A customer slides in from the door side. */
  customerArrive(target: Animatable): Promise<void>;
  /** One beat of the patience bar; called every second while a customer has under 10 s left. */
  patiencePulse(target: Animatable): Promise<void>;
  /** Steam rises off the cup. */
  steamRise(target: Animatable): Promise<void>;
  /** The coin chip pops when a payment lands. */
  coinPop(target: Animatable): Promise<void>;
  /** A heart fills when a friendship level is reached. */
  heartFill(target: Animatable): Promise<void>;
  /** The next story page turns in. */
  pageTurn(target: Animatable): Promise<void>;
  /** Earned stars appear one after another, 120 ms apart. */
  starReveal(targets: readonly Animatable[]): Promise<void>;
  /** A sheet rises from the bottom edge. */
  sheetSlide(target: Animatable): Promise<void>;
}

export const ARRIVE_FRAMES: Keyframe[] = [
  { transform: "translateX(-28px)", opacity: 0 },
  { transform: "translateX(0)", opacity: 1 },
];
export const PULSE_FRAMES: Keyframe[] = [
  { transform: "scale(1)" },
  { transform: "scale(1.08)" },
  { transform: "scale(1)" },
];
export const STEAM_FRAMES: Keyframe[] = [
  { transform: "translateY(6px)", opacity: 0.9 },
  { transform: "translateY(-18px)", opacity: 0 },
];
export const COIN_FRAMES: Keyframe[] = [
  { transform: "scale(0.5)", opacity: 0 },
  { transform: "scale(1)", opacity: 1 },
];
export const HEART_FRAMES: Keyframe[] = [
  { transform: "scale(0.3)", opacity: 0.4 },
  { transform: "scale(1)", opacity: 1 },
];
export const PAGE_FRAMES: Keyframe[] = [
  { transform: "translateX(32px)", opacity: 0 },
  { transform: "translateX(0)", opacity: 1 },
];
export const STAR_FRAMES: Keyframe[] = [
  { transform: "scale(0.2) rotate(-24deg)", opacity: 0 },
  { transform: "scale(1) rotate(0deg)", opacity: 1 },
];
export const SHEET_FRAMES: Keyframe[] = [
  { transform: "translateY(36px)", opacity: 0.4 },
  { transform: "translateY(0)", opacity: 1 },
];

export function createGameMotion(
  reducedMotion: ReducedMotionSource = false,
  motion: Motion = createMotion(reducedMotion),
): GameMotion {
  return {
    get reduced() {
      return motion.reduced;
    },
    customerArrive: (target) =>
      motion.tween(target, ARRIVE_FRAMES, { duration: 320, easing: easings.easeOut }),
    patiencePulse: (target) => motion.tween(target, PULSE_FRAMES, { duration: 420 }),
    steamRise: (target) =>
      motion.tween(target, STEAM_FRAMES, { duration: 1100, easing: easings.easeOut }),
    coinPop: (target) => motion.spring(target, COIN_FRAMES, { stiffness: 320, damping: 14 }),
    heartFill: (target) => motion.spring(target, HEART_FRAMES, { stiffness: 260, damping: 12 }),
    pageTurn: (target) =>
      motion.tween(target, PAGE_FRAMES, { duration: 280, easing: easings.easeOut }),
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
    sheetSlide: (target) =>
      motion.tween(target, SHEET_FRAMES, { duration: 220, easing: easings.easeOut }),
  };
}
