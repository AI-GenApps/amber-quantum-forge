import { BOOKS } from "../rules/items";
import { stockCost, suggestStock, validateStockPlan } from "../rules/stock";
import type { RegularDue, ShelfSlots, StockError, StockPlan, Unlocked } from "../types";
import { ownedEffects } from "./decor";
import type { Profile } from "./profileTypes";
import { dueForDay, unlockedAtDay } from "./unlocks";

export type StockPurchase =
  | { ok: true; profile: Profile; plan: StockPlan; cost: number }
  | { ok: false; errors: StockError[] };

function unique<T>(items: readonly T[]): T[] {
  return items.filter((item, index) => items.indexOf(item) === index);
}

export function normalizePlan(plan: StockPlan, unlocked: Unlocked, slots: ShelfSlots): StockPlan {
  const pastries = unique(plan.pastries);
  const books =
    unlocked.books.length <= slots.books
      ? BOOKS.filter((book) => unlocked.books.includes(book.id)).map((book) => book.id)
      : unique(plan.books);
  return { pastries, books };
}

export function buyStock(
  profile: Profile,
  plan: StockPlan,
  day: number = profile.day,
): StockPurchase {
  const unlocked = unlockedAtDay(day);
  const slots = ownedEffects(profile).shelfSlots;
  const clean = normalizePlan(plan, unlocked, slots);
  const errors = validateStockPlan(clean, unlocked, slots, profile.coins);
  if (errors.length > 0) return { ok: false, errors };
  const cost = stockCost(clean);
  return {
    ok: true,
    plan: clean,
    cost,
    profile: { ...profile, coins: profile.coins - cost, stock: clean },
  };
}

function affordable(plan: StockPlan, coins: number): StockPlan {
  const pastries = plan.pastries.slice();
  while (pastries.length > 0 && stockCost({ pastries, books: plan.books }) > coins) {
    pastries.pop();
  }
  return { pastries, books: plan.books };
}

export function defaultStockPlan(
  profile: Profile,
  day: number = profile.day,
  due?: readonly RegularDue[],
): StockPlan {
  const unlocked = unlockedAtDay(day);
  const slots = ownedEffects(profile).shelfSlots;
  const pool = due ?? (day >= 1 && day <= 14 ? dueForDay(day) : []);
  const suggestion = suggestStock(pool, unlocked, slots);
  const keepPastries = profile.stock.pastries
    .filter((id) => unlocked.pastries.includes(id))
    .slice(0, slots.pastries);
  const keepBooks = profile.stock.books
    .filter((id) => unlocked.books.includes(id))
    .slice(0, slots.books);
  const remembered = keepPastries.length > 0 || keepBooks.length > 0;
  const chosen: StockPlan = remembered
    ? { pastries: keepPastries, books: keepBooks.length > 0 ? keepBooks : suggestion.books }
    : suggestion;
  return affordable(normalizePlan(chosen, unlocked, slots), profile.coins);
}
