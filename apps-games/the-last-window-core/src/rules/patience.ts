import {
  LATE_PATIENCE_FLOOR_SECONDS,
  LATE_PATIENCE_START_SECONDS,
  LATE_PATIENCE_STEP_SHIFTS,
  PATIENCE_TABLE,
  RELAXED_MULTIPLIER,
  TICK_MS,
} from "../constants";
import type { DecorEffects, Weather } from "../types";
import { weatherRules } from "./weather";

function withWeatherAndDecor(base: number, weather: Weather, decor: DecorEffects): number {
  const rain = weather === "rain";
  return (
    base +
    weatherRules(weather).patienceSeconds +
    decor.patienceSeconds +
    (rain ? decor.rainPatienceSeconds : 0)
  );
}

export function baseSecondsForDay(day: number): number {
  const row = PATIENCE_TABLE.find((entry) => day >= entry.fromDay && day <= entry.toDay);
  if (!row) throw new RangeError(`no patience row for day ${day}`);
  return row.seconds;
}

export function patienceSeconds(day: number, weather: Weather, decor: DecorEffects): number {
  return withWeatherAndDecor(baseSecondsForDay(day), weather, decor);
}

export function lateBaseSeconds(lateShiftsDone: number): number {
  const base = LATE_PATIENCE_START_SECONDS - Math.floor(lateShiftsDone / LATE_PATIENCE_STEP_SHIFTS);
  return Math.max(LATE_PATIENCE_FLOOR_SECONDS, base);
}

export function latePatienceSeconds(
  lateShiftsDone: number,
  weather: Weather,
  decor: DecorEffects,
): number {
  return withWeatherAndDecor(lateBaseSeconds(lateShiftsDone), weather, decor);
}

export function patienceTicks(seconds: number, relaxed: boolean): number {
  const ticks = seconds * (1000 / TICK_MS);
  return Math.floor(relaxed ? ticks * RELAXED_MULTIPLIER : ticks);
}
