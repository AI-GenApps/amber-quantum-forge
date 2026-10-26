import { addDays, dailySeedOf, weekdayOf } from "../../src";

export const EPOCH = "2026-01-01";

export function dateRange(days: number, from: string = EPOCH): string[] {
  return Array.from({ length: days }, (_, index) => addDays(from, index));
}

export function seedAndWeekday(dateKey: string): [number, number] {
  return [dailySeedOf(dateKey), weekdayOf(dateKey)];
}
