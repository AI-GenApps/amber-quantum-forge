import { NEED_STEPS } from "../constants";
import type { SeasonMetrics } from "../types";

export interface Shortfall {
  penalty: number;
  flooded: number[];
  unmet: number[];
}

export function shortfall(metrics: SeasonMetrics): Shortfall {
  let penalty = 0;
  const flooded: number[] = [];
  const unmet: number[] = [];
  for (const house of metrics.houses) {
    if (house.suppliedSteps < NEED_STEPS) {
      penalty += 1 + (NEED_STEPS - house.suppliedSteps) / NEED_STEPS;
      unmet.push(house.index);
    }
    if (house.floodedSteps > 0) {
      penalty += 2 + Math.min(house.floodedSteps, 12) / 12;
      flooded.push(house.index);
    }
  }
  for (const field of metrics.fields) {
    if (field.wetSteps < NEED_STEPS) {
      penalty += 1 + (NEED_STEPS - field.wetSteps) / NEED_STEPS;
      unmet.push(field.index);
    }
  }
  return { penalty, flooded, unmet };
}
