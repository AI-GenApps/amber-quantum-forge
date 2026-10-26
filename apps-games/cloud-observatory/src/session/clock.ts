import { localDateKey } from "@web-games/kit";

export interface Clock {
  now(): number;
  dateKey(): string;
}

export function createClock(now: () => number = () => Date.now()): Clock {
  return {
    now,
    dateKey: () => localDateKey(new Date(now())),
  };
}

export interface FakeClock extends Clock {
  set(ms: number): void;
  advance(ms: number): void;
  advanceDays(days: number): void;
  setDateKey(key: string | null): void;
}

const DAY_MS = 86_400_000;

export function createFakeClock(startMs: number): FakeClock {
  let current = startMs;
  let override: string | null = null;
  return {
    now: () => current,
    dateKey: () => override ?? new Date(current).toISOString().slice(0, 10),
    set(ms) {
      current = ms;
    },
    advance(ms) {
      current += ms;
    },
    advanceDays(days) {
      current += days * DAY_MS;
    },
    setDateKey(key) {
      override = key;
    },
  };
}
