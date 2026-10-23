import { FINALE_DAY } from "../constants";
import { DAYS } from "./days";
import { REGULARS } from "./regulars";

export interface Visit {
  regularId: number;
  day: number;
  visit: number;
}

export function visitDaysFor(regularId: number): number[] {
  return DAYS.filter(
    (entry) => entry.day < FINALE_DAY && entry.regularsDue.includes(regularId),
  ).map((entry) => entry.day);
}

export function visitNumber(regularId: number, day: number): number | null {
  const index = visitDaysFor(regularId).indexOf(day);
  return index < 0 ? null : index + 1;
}

export function visitsOnDay(day: number): Visit[] {
  const entry = DAYS.find((candidate) => candidate.day === day);
  if (entry === undefined) return [];
  return entry.regularsDue.map((regularId) => ({
    regularId,
    day,
    visit: visitNumber(regularId, day) ?? 0,
  }));
}

export function finaleRegulars(): number[] {
  return REGULARS.map((regular) => regular.id);
}

export function campaignVisits(): Visit[] {
  return DAYS.flatMap((entry) => visitsOnDay(entry.day));
}
