export type FrameCallback = (now: number) => void;

/** Opaque handle returned by `request`; browsers give a number, timers may give an object. */
export type FrameHandle = unknown;

export interface Scheduler {
  request(callback: FrameCallback): FrameHandle;
  cancel(handle: FrameHandle): void;
}

/** requestAnimationFrame in the browser; a coarse timer where the API is missing. */
export function browserScheduler(): Scheduler {
  if (typeof requestAnimationFrame === "function") {
    return {
      request: (callback) => requestAnimationFrame(callback),
      cancel: (handle) => cancelAnimationFrame(handle as number),
    };
  }
  return {
    request: (callback) => setTimeout(() => callback(performance.now()), 16),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

export interface ManualScheduler extends Scheduler {
  /** Runs frames of `frameMs` until `ms` of fake time passed. Returns the frames run. */
  advance(ms: number, frameMs?: number): number;
  readonly now: number;
  readonly pending: boolean;
}

/** Test scheduler: time only moves when `advance` is called. */
export function createManualScheduler(): ManualScheduler {
  let now = 0;
  let next = 1;
  let queue: { handle: number; callback: FrameCallback } | null = null;
  return {
    get now() {
      return now;
    },
    get pending() {
      return queue !== null;
    },
    request(callback) {
      const handle = next++;
      queue = { handle, callback };
      return handle;
    },
    cancel(handle) {
      if (queue?.handle === handle) queue = null;
    },
    advance(ms, frameMs = 16) {
      let frames = 0;
      let left = ms;
      while (left > 0) {
        const step = Math.min(frameMs, left);
        left -= step;
        now += step;
        const job = queue;
        queue = null;
        if (job) {
          job.callback(now);
          frames += 1;
        }
      }
      return frames;
    },
  };
}
