import { WEATHER_RULES, type WeatherRule } from "../constants";
import { createPrng } from "../prng";
import type { Weather } from "../types";

export const WEATHERS: readonly Weather[] = ["morning", "evening", "rain"];

export function weatherForDay(day: number): Weather {
  const rest = ((day % 3) + 3) % 3;
  if (rest === 1) return "morning";
  if (rest === 2) return "evening";
  return "rain";
}

export function weatherForSeed(seed: number): Weather {
  const index = createPrng(seed).fork("weather").int(WEATHERS.length);
  return WEATHERS[index] as Weather;
}

export function weatherRules(weather: Weather): WeatherRule {
  return WEATHER_RULES[weather];
}
