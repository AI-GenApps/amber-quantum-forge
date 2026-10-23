import type { Motion } from "@web-games/kit";

export const WIN_STEP_MS = 32;
export const WIN_LOOP_GAP_MS = 220;
export const WIN_PULSE_MS = 320;
export const WIN_MAX_MS = 2200;

export interface WinStep {
  cell: number;
  delayMs: number;
  durationMs: number;
}

export interface WinTimeline {
  steps: WinStep[];
  totalMs: number;
}

/**
 * Pure timeline of the win sequence: loops light one after another, cells ripple along each loop.
 * Reduced motion yields no steps at all. The whole sequence is squeezed to fit `WIN_MAX_MS`.
 */
export function winTimeline(
  loops: readonly (readonly number[])[],
  reducedMotion: boolean,
): WinTimeline {
  if (reducedMotion) return { steps: [], totalMs: 0 };
  const raw: WinStep[] = [];
  loops.forEach((cells, loopIndex) => {
    cells.forEach((cell, k) => {
      raw.push({
        cell,
        delayMs: loopIndex * WIN_LOOP_GAP_MS + k * WIN_STEP_MS,
        durationMs: WIN_PULSE_MS,
      });
    });
  });
  const end = raw.reduce((max, step) => Math.max(max, step.delayMs + step.durationMs), 0);
  const scale = end > WIN_MAX_MS ? WIN_MAX_MS / end : 1;
  const steps = raw.map((step) => ({
    cell: step.cell,
    delayMs: Math.round(step.delayMs * scale),
    durationMs: Math.max(1, Math.round(step.durationMs * scale)),
  }));
  const totalMs = steps.reduce((max, step) => Math.max(max, step.delayMs + step.durationMs), 0);
  return { steps, totalMs };
}

const PULSE: Keyframe[] = [{ opacity: 0.55 }, { opacity: 1 }];

/** Plays the timeline on the board's cell elements; resolves when the last pulse ends. */
export async function playWinSequence(
  root: ParentNode,
  timeline: WinTimeline,
  motion: Pick<Motion, "tween" | "reduced">,
): Promise<void> {
  if (motion.reduced || timeline.steps.length === 0) return;
  const jobs: Array<Promise<void>> = [];
  for (const step of timeline.steps) {
    const el = root.querySelector<SVGGElement>(`[data-cell="${step.cell}"] .ll-tile`);
    if (!el) continue;
    jobs.push(
      motion.tween(el as unknown as HTMLElement, PULSE, {
        duration: step.durationMs,
        delay: step.delayMs,
      }),
    );
  }
  await Promise.all(jobs);
}
