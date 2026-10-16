/** Runs `fn` once after `ms` and returns a function that cancels it. Injected so tests control time. */
export type Scheduler = (fn: () => void, ms: number) => () => void;

/**
 * The timer functions every JavaScript host has. Core is built without DOM or Node types
 * (`tsconfig.build.json` has `types: []`), so it names the two functions it needs here. They are
 * looked up on each call, so fake timers installed by tests are honoured.
 */
interface HostTimers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const timeoutScheduler: Scheduler = (fn, ms) => {
  const timers = globalThis as unknown as HostTimers;
  const handle = timers.setTimeout(fn, ms);
  return () => timers.clearTimeout(handle);
};
