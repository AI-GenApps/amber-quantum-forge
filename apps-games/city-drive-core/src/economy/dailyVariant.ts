import type { MissionDef, Tiers } from "../missions/types";
import { Rng } from "../traffic/rng";

export type VariantStep = 0 | 1 | 2;

/** The seeded twist on a catalog mission: how much tighter the par times are and how busy the roads. */
export interface DailyVariant {
  parStep: VariantStep;
  trafficStep: VariantStep;
}

/** Share of the time limit added to the "time left" bar of a delivery, per par step. */
export const PAR_TIGHTEN_FRACTION: Readonly<Record<VariantStep, number>> = {
  0: 0,
  1: 0.04,
  2: 0.08,
};

/** Extra AI cars per traffic step. */
export const TRAFFIC_AGENTS_PER_STEP = 2;

const STEPS = [0, 1, 2] as const;

/** FNV-1a over the UTF-16 code units, so a text always gives the same 32-bit seed. */
export function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function dailyVariantFor(date: string): DailyVariant {
  const rng = new Rng(hashText(`variant:${date}`));
  return {
    parStep: STEPS[rng.int(3)] as VariantStep,
    trafficStep: STEPS[rng.int(3)] as VariantStep,
  };
}

function tightened<T>(tiers: Tiers<T>, change: (t: T) => T): Tiers<T> {
  return { "1": change(tiers["1"]), "2": change(tiers["2"]), "3": change(tiers["3"]) };
}

/**
 * The mission with its par times tightened for the day. Time trials need a faster finish and
 * deliveries need more time left. Neither moves past what the validation autopilot achieved, so the
 * three-star bar stays passable. Other mission types are returned unchanged.
 */
export function applyDailyVariant(mission: MissionDef, variant: DailyVariant): MissionDef {
  const tighten = PAR_TIGHTEN_FRACTION[variant.parStep];
  if (tighten === 0) return mission;
  const autopilot = mission.validation?.autopilot_time_s;
  if (mission.type === "time_trial") {
    return {
      ...mission,
      stars: tightened(mission.stars, (s) => {
        const floor = autopilot === undefined ? s.max_time_s * (1 - tighten) : autopilot;
        return {
          max_time_s: Math.min(s.max_time_s, Math.max(floor, s.max_time_s * (1 - tighten))),
        };
      }),
    };
  }
  if (mission.type === "delivery") {
    const limit = mission.params.time_limit_s;
    return {
      ...mission,
      stars: tightened(mission.stars, (s) => {
        const ceiling = autopilot === undefined ? s.min_time_left_s : limit - autopilot;
        const wanted = s.min_time_left_s + limit * tighten;
        return { ...s, min_time_left_s: Math.max(s.min_time_left_s, Math.min(wanted, ceiling)) };
      }),
    };
  }
  return mission;
}

/** AI cars for the daily: the district's count plus the traffic step. */
export function dailyTrafficAgents(base: number, variant: DailyVariant): number {
  return base + TRAFFIC_AGENTS_PER_STEP * variant.trafficStep;
}
