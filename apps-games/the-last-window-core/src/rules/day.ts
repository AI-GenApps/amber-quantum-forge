import { SHIFT_TICKS } from "../constants";

export function shiftLengthForDay(day: number): number {
  if (day <= 4) return SHIFT_TICKS.short;
  if (day <= 9) return SHIFT_TICKS.medium;
  return SHIFT_TICKS.long;
}

export const LATE_SHIFT_TICKS = SHIFT_TICKS.long;
