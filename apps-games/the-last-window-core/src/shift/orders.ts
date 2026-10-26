import { FAVOURITE_PCT, REGULAR_MOOD_PICK_PCT } from "../constants";
import type { Prng } from "../prng";
import { moodsCoveredBy } from "../rules/items";
import { weatherRules } from "../rules/weather";
import type { Customer, MoodId, Order, Unlocked, Weather } from "../types";

function pickWithFavourite<T>(
  rng: Prng,
  favourite: T | null,
  pool: readonly T[],
  isRegular: boolean,
): T {
  if (isRegular && favourite !== null) {
    const roll = rng.int(100) < FAVOURITE_PCT;
    if (roll && pool.includes(favourite)) return favourite;
  }
  return rng.pick(pool);
}

function pickMood(rng: Prng, customer: Customer, covered: readonly MoodId[]): MoodId {
  const likes = customer.likes;
  if (likes === null) return rng.pick(covered);
  const wanted = likes.moods.filter((mood) => covered.includes(mood));
  const first = wanted[0];
  const second = wanted[1];
  if (first !== undefined && second !== undefined) {
    return rng.int(100) < REGULAR_MOOD_PICK_PCT ? first : second;
  }
  if (first !== undefined) return first;
  return rng.pick(covered);
}

export function generateOrder(
  rng: Prng,
  customer: Customer,
  unlocked: Unlocked,
  weather: Weather,
  shelfEmpty: boolean,
): Order {
  const rules = weatherRules(weather);
  const likes = customer.likes;
  const regular = customer.kind === "regular" && likes !== null;
  const drink = pickWithFavourite(rng, likes?.drink ?? null, unlocked.drinks, regular);
  let pastry: Order["pastry"] = null;
  if (!shelfEmpty && unlocked.pastries.length > 0 && rng.int(100) < rules.pastryChancePct) {
    pastry = pickWithFavourite(rng, likes?.pastry ?? null, unlocked.pastries, regular);
  }
  let mood: MoodId | null = null;
  if (unlocked.books.length > 0 && rng.int(100) < rules.bookChancePct) {
    mood = pickMood(rng, customer, moodsCoveredBy(unlocked.books));
  }
  return { drink, pastry, mood };
}
