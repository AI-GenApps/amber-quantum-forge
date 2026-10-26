import { PORTIONS_PER_KIND } from "../constants";
import type {
  BookId,
  PastryId,
  RegularDue,
  ShelfSlots,
  StockError,
  StockPlan,
  Unlocked,
} from "../types";
import { BOOKS, bookCarriesMood, pastryRule } from "./items";

export function stockCost(plan: StockPlan): number {
  const kinds = plan.pastries.filter((id, index) => plan.pastries.indexOf(id) === index);
  return kinds.reduce((sum, id) => sum + pastryRule(id).stockCost * PORTIONS_PER_KIND, 0);
}

export function validateStockPlan(
  plan: StockPlan,
  unlocked: Unlocked,
  slots: ShelfSlots,
  coins: number,
): StockError[] {
  const errors: StockError[] = [];
  if (plan.pastries.length > slots.pastries) {
    errors.push({ code: "TOO_MANY_PASTRIES", id: null });
  }
  if (plan.books.length > slots.books) {
    errors.push({ code: "TOO_MANY_BOOKS", id: null });
  }
  for (const id of plan.pastries) {
    if (!unlocked.pastries.includes(id)) errors.push({ code: "LOCKED_ITEM", id });
  }
  for (const id of plan.books) {
    if (!unlocked.books.includes(id)) errors.push({ code: "LOCKED_ITEM", id });
  }
  if (plan.books.length === 0 && unlocked.books.length > 0) {
    errors.push({ code: "NEED_A_BOOK", id: null });
  }
  if (stockCost(plan) > coins) errors.push({ code: "CANNOT_AFFORD", id: null });
  return errors;
}

export function shelfBooks(
  plan: StockPlan,
  unlocked: Unlocked,
  slots: ShelfSlots,
): readonly BookId[] {
  if (unlocked.books.length <= slots.books)
    return BOOKS.filter((b) => unlocked.books.includes(b.id)).map((b) => b.id);
  return plan.books.filter((id, index) => plan.books.indexOf(id) === index);
}

export function suggestStock(
  dueRegulars: readonly RegularDue[],
  unlocked: Unlocked,
  slots: ShelfSlots,
): StockPlan {
  const pastries: PastryId[] = [];
  for (const due of dueRegulars) {
    const id = due.likes.pastry;
    if (unlocked.pastries.includes(id) && !pastries.includes(id)) pastries.push(id);
  }
  const books = suggestBooks(dueRegulars, unlocked, slots);
  return { pastries: pastries.slice(0, slots.pastries), books };
}

function suggestBooks(
  dueRegulars: readonly RegularDue[],
  unlocked: Unlocked,
  slots: ShelfSlots,
): BookId[] {
  const available = BOOKS.filter((book) => unlocked.books.includes(book.id));
  if (available.length <= slots.books) return available.map((book) => book.id);
  const scored = available.map((book, index) => {
    let score = 0;
    for (const due of dueRegulars) {
      for (const mood of due.likes.moods) {
        if (bookCarriesMood(book.id, mood)) score += 1;
      }
    }
    return { id: book.id, score, index };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, slots.books).map((entry) => entry.id);
}
