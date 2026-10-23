import { useEffect, useRef, useState } from "preact/hooks";
import type { FrameScheduler } from "../app/game-loop";

export const COUNT_UP_MS = 900;

/** Eases from 0 to `target` over `durationMs` of frame time; returns `target` at once when reduced. */
export function useCountUp(
  target: number,
  reduced: boolean,
  frames: FrameScheduler,
  durationMs = COUNT_UP_MS,
): number {
  const [value, setValue] = useState(reduced ? target : 0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || target <= 0) {
      setValue(target);
      return undefined;
    }
    start.current = null;
    let id = 0;
    const step = (timeMs: number): void => {
      start.current ??= timeMs;
      const progress = Math.min(1, (timeMs - start.current) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(progress >= 1 ? target : target * eased);
      if (progress < 1) id = frames.request(step);
    };
    setValue(0);
    id = frames.request(step);
    return () => frames.cancel(id);
  }, [target, reduced, frames, durationMs]);

  return value;
}
