import { CAMPAIGN_DAYS } from "../constants";
import { DAYS, getDay, getRegular, REGULARS } from "../content";
import { BOOKS, DRINKS, PASTRIES } from "../rules/items";
import type { DecorId, RegularDue, Unlocked } from "../types";

export interface DayUnlockList {
  drinks: Unlocked["drinks"];
  pastries: Unlocked["pastries"];
  books: Unlocked["books"];
  decor: readonly DecorId[];
}

export function unlockedAtDay(day: number): Unlocked {
  if (day > CAMPAIGN_DAYS) {
    return {
      drinks: DRINKS.map((entry) => entry.id),
      pastries: PASTRIES.map((entry) => entry.id),
      books: BOOKS.map((entry) => entry.id),
    };
  }
  const drinks: Unlocked["drinks"][number][] = [];
  const pastries: Unlocked["pastries"][number][] = [];
  const books: Unlocked["books"][number][] = [];
  for (const entry of DAYS.filter((candidate) => candidate.day <= day)) {
    drinks.push(...entry.unlocks.drinks);
    pastries.push(...entry.unlocks.pastries);
    books.push(...entry.unlocks.books);
  }
  return { drinks, pastries, books };
}

export function unlocksForDay(day: number): DayUnlockList {
  if (day < 1 || day > CAMPAIGN_DAYS) return { drinks: [], pastries: [], books: [], decor: [] };
  return getDay(day).unlocks;
}

export function dueForDay(day: number): RegularDue[] {
  return getDay(day).regularsDue.map((regularId) => ({
    regularId,
    likes: getRegular(regularId).likes,
  }));
}

export function allRegularsDue(): RegularDue[] {
  return REGULARS.map((regular) => ({ regularId: regular.id, likes: regular.likes }));
}
