import { easings, type Motion } from "@web-games/kit";
import { playWinSequence, winTimeline } from "../board/winSequence";

type Player = Pick<Motion, "tween" | "spring" | "reduced">;
type Target = HTMLElement | SVGElement;

const ORIGIN = { transformBox: "fill-box", transformOrigin: "center" } as const;

/** Keyframes of every preset. The last frame of each is what reduced motion applies at once. */
export const FRAMES = {
  tilePop: [
    { transform: "scale(0.78)", ...ORIGIN },
    { transform: "scale(1)", ...ORIGIN },
  ],
  loopGlow: [{ filter: "brightness(1.8)" }, { filter: "none" }],
  lanternBloom: [
    { transform: "scale(1.32)", filter: "brightness(1.6)", ...ORIGIN },
    { transform: "scale(1)", filter: "none", ...ORIGIN },
  ],
  screenEnter: [
    { opacity: 0, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0)" },
  ],
  sheetEnter: [
    { opacity: 0, transform: "translateY(24px)" },
    { opacity: 1, transform: "translateY(0)" },
  ],
  starPop: [
    { opacity: 0, transform: "scale(0.3) rotate(-25deg)", ...ORIGIN },
    { opacity: 1, transform: "scale(1) rotate(0deg)", ...ORIGIN },
  ],
  flameFlicker: [
    { transform: "scale(1, 0.92)", opacity: 0.85, ...ORIGIN },
    { transform: "scale(1, 1.08)", opacity: 1, ...ORIGIN },
    { transform: "scale(1, 1)", opacity: 1, ...ORIGIN },
  ],
} as const satisfies Record<string, Keyframe[]>;

export const LOOP_GLOW_STEP_MS = 28;
export const STAR_POP_STEP_MS = 140;
export const FLICKER_PERIOD_MS = 3200;

const frames = (key: keyof typeof FRAMES): Keyframe[] => FRAMES[key].map((frame) => ({ ...frame }));

function cellTargets(root: ParentNode, cells: readonly number[], selector: string): Target[] {
  const out: Target[] = [];
  for (const cell of cells) {
    const el = root.querySelector<SVGElement>(`[data-cell="${cell}"] ${selector}`);
    if (el) out.push(el);
  }
  return out;
}

/** A tile settles into its cell with a short spring. */
export async function tilePop(
  motion: Player,
  root: ParentNode,
  cells: readonly number[],
): Promise<void> {
  const jobs = cellTargets(root, cells, ".ll-tile").map((el) =>
    motion.spring(el as unknown as HTMLElement, frames("tilePop"), { stiffness: 420, damping: 18 }),
  );
  await Promise.all(jobs);
}

/** A glow runs along a freshly closed loop, one cell after another in path order. */
export async function loopGlow(
  motion: Player,
  root: ParentNode,
  loops: readonly (readonly number[])[],
): Promise<void> {
  const jobs: Array<Promise<void>> = [];
  for (const loop of loops) {
    loop.forEach((cell, k) => {
      const [el] = cellTargets(root, [cell], ".ll-tile");
      if (!el) return;
      jobs.push(
        motion.tween(el as unknown as HTMLElement, frames("loopGlow"), {
          duration: 360,
          delay: k * LOOP_GLOW_STEP_MS,
          easing: easings.easeOut,
        }),
      );
    });
  }
  await Promise.all(jobs);
}

/** A lantern blooms when its loop closes. */
export async function lanternBloom(
  motion: Player,
  root: ParentNode,
  cells: readonly number[],
): Promise<void> {
  const jobs = cellTargets(root, cells, ".ll-lantern").map((el) =>
    motion.spring(el as unknown as HTMLElement, frames("lanternBloom"), {
      stiffness: 180,
      damping: 12,
    }),
  );
  await Promise.all(jobs);
}

/** The win cascade: every lit loop pulses in turn (timeline from `winTimeline`). */
export async function winCascade(
  motion: Player,
  root: ParentNode,
  loops: readonly (readonly number[])[],
): Promise<void> {
  await playWinSequence(root, winTimeline(loops, motion.reduced), motion);
}

export function screenEnter(motion: Player, el: Target): Promise<void> {
  return motion.tween(el as unknown as HTMLElement, frames("screenEnter"), { duration: 200 });
}

export function sheetEnter(motion: Player, el: Target): Promise<void> {
  return motion.tween(el as unknown as HTMLElement, frames("sheetEnter"), {
    duration: 220,
    easing: easings.easeOut,
  });
}

/** Earned stars pop in one after another. */
export async function starPop(motion: Player, stars: readonly Target[]): Promise<void> {
  const jobs = stars.map((el, index) =>
    motion.spring(el as unknown as HTMLElement, frames("starPop"), {
      stiffness: 260,
      damping: 14,
      delay: index * STAR_POP_STEP_MS,
    }),
  );
  await Promise.all(jobs);
}

/** One flame flicker; the Home screen repeats it every `FLICKER_PERIOD_MS`. */
export function flameFlicker(motion: Player, el: Target): Promise<void> {
  return motion.tween(el as unknown as HTMLElement, frames("flameFlicker"), {
    duration: 900,
    easing: easings.easeInOut,
  });
}
