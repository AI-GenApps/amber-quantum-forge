import type { Direction, Placement, SeasonEvent } from "../types";

export function c(x: number, y: number): Placement {
  return { x, y, kind: "canal" };
}

export function b(x: number, y: number): Placement {
  return { x, y, kind: "barrier" };
}

export function p(x: number, y: number, dir: Direction): Placement {
  return { x, y, kind: "pump", dir };
}

export function g(x: number, y: number, opensWeek: number, closesWeek: number): Placement {
  return { x, y, kind: "gate", opensWeek, closesWeek };
}

export function r(x: number, y: number): Placement {
  return { x, y, kind: "reservoir" };
}

export function surge(delta: number, week: number, weeks: number): SeasonEvent {
  return { type: "surge", week, weeks, delta };
}

export function drought(delta: number, week: number, weeks: number): SeasonEvent {
  return { type: "drought", week, weeks, delta };
}

export function stormTide(delta: number, week: number, weeks: number): SeasonEvent {
  return { type: "storm-tide", week, weeks, delta };
}
