import { MAX_TICK_SECONDS } from "../session/game-session";

export interface FrameScheduler {
  request(callback: (timeMs: number) => void): number;
  cancel(id: number): void;
}

export const browserFrames: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

export interface GameLoopOptions {
  readonly tick: (dtSeconds: number) => void;
  readonly frames: FrameScheduler;
  /** Multiplies game time per real second; only the dev `?devspeed=N` flag changes it. */
  readonly speed?: number;
  /** The session never ticks more often than this in real time. */
  readonly maxTicksPerSecond?: number;
}

export interface GameLoop {
  readonly running: boolean;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export const MAX_TICKS_PER_SECOND = 10;
const MAX_REAL_STEP_SECONDS = MAX_TICK_SECONDS;

/**
 * Drives `session.tick` from animation frames. Frame time is accumulated and flushed at most
 * `maxTicksPerSecond` times per second; a flush is split so no single tick exceeds the
 * session's 30 second step.
 */
export function createGameLoop(options: GameLoopOptions): GameLoop {
  const { tick, frames, speed = 1, maxTicksPerSecond = MAX_TICKS_PER_SECOND } = options;
  const interval = 1 / Math.max(1, maxTicksPerSecond);
  let handle: number | null = null;
  let last: number | null = null;
  let pending = 0;

  const flush = (): void => {
    let remaining = Math.min(pending, MAX_REAL_STEP_SECONDS) * speed;
    pending = 0;
    while (remaining > 1e-9) {
      const step = Math.min(remaining, MAX_TICK_SECONDS);
      tick(step);
      remaining -= step;
    }
  };

  const frame = (timeMs: number): void => {
    handle = null;
    if (last !== null) {
      const delta = (timeMs - last) / 1000;
      if (delta > 0) pending += delta;
    }
    last = timeMs;
    if (pending >= interval) flush();
    handle = frames.request(frame);
  };

  const begin = (): void => {
    if (handle !== null) return;
    last = null;
    handle = frames.request(frame);
  };

  const halt = (): void => {
    if (handle !== null) frames.cancel(handle);
    handle = null;
    last = null;
    pending = 0;
  };

  return {
    get running() {
      return handle !== null;
    },
    start: begin,
    resume: begin,
    pause: halt,
    stop: halt,
  };
}
