/** Runs `fn` once after `ms` and returns a function that cancels it. Injected so tests control time. */
export type Scheduler = (fn: () => void, ms: number) => () => void;

export const timeoutScheduler: Scheduler = (fn, ms) => {
  const handle = setTimeout(fn, ms);
  return () => clearTimeout(handle);
};
