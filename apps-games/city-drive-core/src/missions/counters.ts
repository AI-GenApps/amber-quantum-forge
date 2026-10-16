import { FIXED_DT } from "../physics/clock";
import type { LanePointRef, MissionSample, Objective, ObjectiveKind, Stars } from "./types";

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds / FIXED_DT);
}

export function ticksToSeconds(ticks: number): number {
  return ticks * FIXED_DT;
}

/**
 * Highest star level whose test passes, checked from three down. A completed mission is always
 * worth at least one star, so level one is the floor and never tested.
 */
export function pickStars(meets: (level: "2" | "3") => boolean): Stars {
  if (meets("3")) return 3;
  if (meets("2")) return 2;
  return 1;
}

/** Fixed-step clock, time limit and damage count shared by every mission type. */
export class Counters {
  ticks = 0;
  damage = 0;
  private readonly limitTicks: number;

  constructor(limitS: number) {
    this.limitTicks = secondsToTicks(limitS);
  }

  advance(sample: MissionSample): void {
    this.ticks++;
    this.damage += sample.hits;
  }

  get elapsedS(): number {
    return ticksToSeconds(this.ticks);
  }

  get timeLeftTicks(): number {
    return Math.max(0, this.limitTicks - this.ticks);
  }

  get timeLeftS(): number {
    return ticksToSeconds(this.timeLeftTicks);
  }

  /** True when at least `seconds` remain (compared in whole steps, so boundaries are exact). */
  hasTimeLeft(seconds: number): boolean {
    return this.timeLeftTicks >= secondsToTicks(seconds);
  }

  /** True when the mission has taken `seconds` or less. */
  tookAtMost(seconds: number): boolean {
    return this.ticks <= secondsToTicks(seconds);
  }

  /** Time is up once the step count passes the limit; reaching the goal on the last step still wins. */
  get timedOut(): boolean {
    return this.ticks > this.limitTicks;
  }
}

export interface Stop {
  kind: ObjectiveKind;
  label: string;
  x: number;
  z: number;
  radius: number;
  lane: LanePointRef;
}

/** An ordered list of places to reach. */
export class StopSequence {
  private index = 0;

  constructor(private readonly stops: readonly Stop[]) {}

  get done(): number {
    return this.index;
  }

  get total(): number {
    return this.stops.length;
  }

  get finished(): boolean {
    return this.index >= this.stops.length;
  }

  current(): Objective | undefined {
    return this.stops[this.index];
  }

  /** Move on when the car is inside the current stop's radius. Returns true when one was reached. */
  update(sample: MissionSample): boolean {
    const stop = this.stops[this.index];
    if (!stop) return false;
    const dx = sample.position.x - stop.x;
    const dz = sample.position.z - stop.z;
    if (dx * dx + dz * dz > stop.radius * stop.radius) return false;
    this.index++;
    return true;
  }
}
