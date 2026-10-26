import {
  DELIGHTED_PATIENCE_PCT,
  FP_DELIGHTED,
  FP_PER_SERVE_MAX,
  FP_SATISFIED,
  SATISFIED_MATCH_PCT,
  SCORE_BOOK_OTHER_MOOD,
  SCORE_EXACT,
  SCORE_MISSING,
  SCORE_PASTRY_SUBSTITUTE,
  SUBSTITUTE_MIN_PAYMENT,
  TIP_DELIGHTED_PCT,
  TIP_SATISFIED_PCT,
  WRONG_MOOD_BOOK_PAYMENT,
} from "../constants";
import { bookCarriesMood, bookRule, drinkRule, pastryRule } from "../rules/items";
import type {
  BookId,
  DecorEffects,
  DrinkId,
  Face,
  MoodId,
  Order,
  Outcome,
  PastryId,
  Scores,
  Tray,
} from "../types";

export function scoreDrink(requested: DrinkId, delivered: DrinkId | null): number {
  return delivered === requested ? SCORE_EXACT : SCORE_MISSING;
}

export function scorePastry(requested: PastryId | null, delivered: PastryId | null): number | null {
  if (requested === null) return null;
  if (delivered === null) return SCORE_MISSING;
  return delivered === requested ? SCORE_EXACT : SCORE_PASTRY_SUBSTITUTE;
}

export function scoreBook(requested: MoodId | null, delivered: BookId | null): number | null {
  if (requested === null) return null;
  if (delivered === null) return SCORE_MISSING;
  return bookCarriesMood(delivered, requested) ? SCORE_EXACT : SCORE_BOOK_OTHER_MOOD;
}

export function scoreTray(order: Order, tray: Tray): Scores {
  return {
    drink: scoreDrink(order.drink, tray.drink),
    pastry: scorePastry(order.pastry, tray.pastry),
    book: scoreBook(order.mood, tray.book),
  };
}

export function matchTotals(scores: Scores): { sum: number; max: number } {
  let sum = scores.drink;
  let max = SCORE_EXACT;
  if (scores.pastry !== null) {
    sum += scores.pastry;
    max += SCORE_EXACT;
  }
  if (scores.book !== null) {
    sum += scores.book;
    max += SCORE_EXACT;
  }
  return { sum, max };
}

export function classifyOutcome(
  sum: number,
  max: number,
  ticksLeft: number,
  ticksTotal: number,
): Outcome {
  if (sum === max && ticksLeft * 100 >= DELIGHTED_PATIENCE_PCT * ticksTotal) return "delighted";
  if (sum * 100 >= SATISFIED_MATCH_PCT * max) return "satisfied";
  return "disappointed";
}

export function paymentFor(order: Order, tray: Tray, decor: DecorEffects): number {
  let total = 0;
  if (tray.drink !== null && tray.drink === order.drink) {
    total += drinkRule(tray.drink).price + decor.drinkBonus;
  }
  if (order.pastry !== null && tray.pastry !== null) {
    const price = pastryRule(tray.pastry).price;
    total +=
      tray.pastry === order.pastry
        ? price
        : Math.max(SUBSTITUTE_MIN_PAYMENT, Math.floor(price / 2));
  }
  if (order.mood !== null && tray.book !== null) {
    total += bookCarriesMood(tray.book, order.mood)
      ? bookRule(tray.book).price + decor.bookBonus
      : WRONG_MOOD_BOOK_PAYMENT;
  }
  return total;
}

export function tipPercent(outcome: Outcome, decor: DecorEffects): number {
  if (outcome === "delighted") return TIP_DELIGHTED_PCT + decor.tipBonusPoints;
  if (outcome === "satisfied") return TIP_SATISFIED_PCT + decor.tipBonusPoints;
  return 0;
}

export function tipFor(payment: number, outcome: Outcome, decor: DecorEffects): number {
  return Math.floor((payment * tipPercent(outcome, decor) + 99) / 100);
}

export function fpFor(outcome: Outcome, regular: boolean, decor: DecorEffects): number {
  if (!regular) return 0;
  if (outcome === "delighted") return Math.min(FP_PER_SERVE_MAX, FP_DELIGHTED + decor.fpBonus);
  if (outcome === "satisfied") return FP_SATISFIED;
  return 0;
}

export function faceFor(outcome: Outcome): Face {
  return outcome === "delighted" || outcome === "satisfied" ? "happy" : "sad";
}
