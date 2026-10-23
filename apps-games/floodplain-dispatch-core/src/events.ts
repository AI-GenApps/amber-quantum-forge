import type { EventType, MapDef } from "./types";

function activeDelta(def: MapDef, type: EventType, week: number): number {
  let total = 0;
  for (const event of def.events) {
    if (event.type === type && week >= event.week && week < event.week + event.weeks) {
      total += event.delta;
    }
  }
  return total;
}

export function inletRate(def: MapDef, inletIndex: number, week: number): number {
  const base = def.inlets[inletIndex] ?? 0;
  return Math.max(0, base + activeDelta(def, "surge", week) - activeDelta(def, "drought", week));
}

export function baseTide(def: MapDef, week: number): number {
  const tide = def.tide;
  if (!tide || tide.period < 1) return 0;
  const phase = ((week % tide.period) + tide.period) % tide.period;
  const rising = 2 * phase <= tide.period;
  const span = rising ? phase : tide.period - phase;
  return Math.floor((2 * tide.amp * span) / tide.period);
}

export function tideLevel(def: MapDef, week: number): number {
  if (!def.tide) return 0;
  return baseTide(def, week) + activeDelta(def, "storm-tide", week);
}
