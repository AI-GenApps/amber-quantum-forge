export type TickSource = (listener: (deltaMs: number) => void) => () => void;

export interface TickTimers {
  now(): number;
  setInterval(handler: () => void, ms: number): number;
  clearInterval(id: number): void;
}

const browserTimers: TickTimers = {
  now: () => performance.now(),
  setInterval: (handler, ms) => globalThis.setInterval(handler, ms) as unknown as number,
  clearInterval: (id) => globalThis.clearInterval(id),
};

/** Emits the time since the previous tick, capped at two intervals so a suspended page adds nothing. */
export function createIntervalTick(
  intervalMs = 1000,
  timers: TickTimers = browserTimers,
): TickSource {
  return (listener) => {
    let last = timers.now();
    const id = timers.setInterval(() => {
      const now = timers.now();
      const delta = Math.min(now - last, intervalMs * 2);
      last = now;
      if (delta > 0) listener(delta);
    }, intervalMs);
    return () => timers.clearInterval(id);
  };
}
