import {
  type Animatable,
  createMotion,
  easings,
  type Motion,
  type ReducedMotionSource,
} from "@web-games/kit";
import { FLIP_MS, STAMP_FALL_MS, STAMP_STAGGER_MS, TOAST_SLIDE_MS } from "./timing";

export interface GameMotion {
  readonly reduced: boolean;
  /** An object is picked up: it grows a little and lifts off the desk. */
  pickUp(target: Animatable): Promise<void>;
  /** The object is turned over (Web Animations API, a quarter turn out and back). */
  flip(target: Animatable): Promise<void>;
  /** A pin drops onto the board and settles. */
  pinDrop(target: Animatable): Promise<void>;
  /** A link line draws itself from the clue towards the card. */
  linkDraw(target: Animatable): Promise<void>;
  /** The rubber stamp falls, lands with a thud and bounces slightly. */
  stampFall(target: Animatable): Promise<void>;
  /** Earned stamps appear one after another, 140 ms apart. */
  stampReveal(targets: readonly Animatable[]): Promise<void>;
  /** A toast slides in from above. */
  toastSlide(target: Animatable): Promise<void>;
}

export const PICK_FRAMES: Keyframe[] = [
  { transform: "scale(1) translateY(0)" },
  { transform: "scale(1.06) translateY(-6px)" },
];
export const FLIP_FRAMES: Keyframe[] = [
  { transform: "rotateY(0deg)" },
  { transform: "rotateY(90deg)", offset: 0.5 },
  { transform: "rotateY(0deg)" },
];
export const PIN_FRAMES: Keyframe[] = [
  { transform: "translateY(-14px) scale(1.3)", opacity: 0 },
  { transform: "translateY(0) scale(1)", opacity: 1 },
];
export const LINK_FRAMES: Keyframe[] = [
  { transform: "scaleX(0)", transformOrigin: "left center", opacity: 0.4 },
  { transform: "scaleX(1)", transformOrigin: "left center", opacity: 1 },
];
const TILT = "rotate(var(--lp-tilt, -4deg))";
export const STAMP_FRAMES: Keyframe[] = [
  { transform: `translateY(-120px) scale(1.6) ${TILT}`, opacity: 0 },
  { transform: `translateY(0) scale(1) ${TILT}`, opacity: 1, offset: 0.7 },
  { transform: `translateY(-6px) scale(1.02) ${TILT}`, offset: 0.85 },
  { transform: `translateY(0) scale(1) ${TILT}`, opacity: 1 },
];
export const STAMP_ICON_FRAMES: Keyframe[] = [
  { transform: "scale(0.2)", opacity: 0 },
  { transform: "scale(1)", opacity: 1 },
];
export const TOAST_FRAMES: Keyframe[] = [
  { translate: "0 -24px", opacity: 0 },
  { translate: "0 0", opacity: 1 },
];

export function createGameMotion(
  reducedMotion: ReducedMotionSource = false,
  motion: Motion = createMotion(reducedMotion),
): GameMotion {
  return {
    get reduced() {
      return motion.reduced;
    },
    pickUp: (target) =>
      motion.spring(target, PICK_FRAMES, { stiffness: 260, damping: 18, fill: "forwards" }),
    flip: (target) =>
      motion.tween(target, FLIP_FRAMES, { duration: FLIP_MS, easing: easings.easeInOut }),
    pinDrop: (target) => motion.spring(target, PIN_FRAMES, { stiffness: 300, damping: 14 }),
    linkDraw: (target) =>
      motion.tween(target, LINK_FRAMES, { duration: 260, easing: easings.easeOut }),
    stampFall: (target) =>
      motion.tween(target, STAMP_FRAMES, { duration: STAMP_FALL_MS, easing: easings.easeOut }),
    async stampReveal(targets) {
      await Promise.all(
        targets.map((target, index) =>
          motion.spring(target, STAMP_ICON_FRAMES, {
            delay: index * STAMP_STAGGER_MS,
            stiffness: 240,
            damping: 14,
          }),
        ),
      );
    },
    toastSlide: (target) =>
      motion.tween(target, TOAST_FRAMES, { duration: TOAST_SLIDE_MS, easing: easings.easeOut }),
  };
}
