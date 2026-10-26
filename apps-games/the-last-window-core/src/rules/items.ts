import { STEP_TICKS } from "../constants";
import type {
  BookId,
  DrinkId,
  DrinkToken,
  MoodId,
  PastryId,
  PastryToken,
  StepToken,
} from "../types";

export interface DrinkRule {
  id: DrinkId;
  name: string;
  steps: readonly DrinkToken[];
  price: number;
}

export interface PastryRule {
  id: PastryId;
  name: string;
  steps: readonly PastryToken[];
  price: number;
  stockCost: number;
}

export interface BookRule {
  id: BookId;
  title: string;
  moods: readonly [MoodId, MoodId];
  price: number;
}

export const MOODS: readonly MoodId[] = [
  "comforting",
  "adventurous",
  "wistful",
  "funny",
  "curious",
];

export const DRINK_TOKENS: readonly DrinkToken[] = [
  "cup",
  "brew",
  "steam",
  "pour",
  "leaves",
  "water",
  "honey",
  "cocoa",
];

export const PASTRY_TOKENS: readonly PastryToken[] = ["plate", "warm", "glaze", "dust", "cream"];

export const DRINKS: readonly DrinkRule[] = [
  { id: "drink-1", name: "Harbour Black", steps: ["cup", "brew", "pour"], price: 4 },
  { id: "drink-2", name: "Tide Latte", steps: ["cup", "brew", "steam", "pour"], price: 5 },
  { id: "drink-3", name: "Fog Tea", steps: ["cup", "leaves", "water"], price: 4 },
  {
    id: "drink-4",
    name: "Honey Chamomile",
    steps: ["cup", "leaves", "water", "honey"],
    price: 5,
  },
  { id: "drink-5", name: "Lamplight Cocoa", steps: ["cup", "cocoa", "steam", "pour"], price: 5 },
  {
    id: "drink-6",
    name: "Midnight Mocha",
    steps: ["cup", "brew", "cocoa", "steam", "pour"],
    price: 6,
  },
];

export const PASTRIES: readonly PastryRule[] = [
  { id: "pastry-1", name: "Salted Butter Roll", steps: ["plate", "warm"], price: 3, stockCost: 1 },
  {
    id: "pastry-2",
    name: "Cinnamon Knot",
    steps: ["plate", "warm", "dust"],
    price: 4,
    stockCost: 1,
  },
  { id: "pastry-3", name: "Pear Tart", steps: ["plate", "warm", "glaze"], price: 5, stockCost: 2 },
  {
    id: "pastry-4",
    name: "Lemon Cream Bun",
    steps: ["plate", "cream", "dust"],
    price: 4,
    stockCost: 1,
  },
  {
    id: "pastry-5",
    name: "Ginger Loaf",
    steps: ["plate", "warm", "glaze", "dust"],
    price: 5,
    stockCost: 2,
  },
];

export const BOOKS: readonly BookRule[] = [
  { id: "book-1", title: "The Lamplighter's Almanac", moods: ["comforting", "curious"], price: 6 },
  { id: "book-2", title: "Salt and Sparrows", moods: ["wistful", "comforting"], price: 6 },
  {
    id: "book-3",
    title: "The Cartographer's Daughter",
    moods: ["adventurous", "curious"],
    price: 7,
  },
  {
    id: "book-4",
    title: "Seven Ways to Lose an Umbrella",
    moods: ["funny", "wistful"],
    price: 7,
  },
  { id: "book-5", title: "The Gull Who Wanted a Hat", moods: ["funny", "adventurous"], price: 7 },
];

export function drinkRule(id: DrinkId): DrinkRule {
  const rule = DRINKS.find((entry) => entry.id === id);
  if (!rule) throw new RangeError(`unknown drink ${id}`);
  return rule;
}

export function pastryRule(id: PastryId): PastryRule {
  const rule = PASTRIES.find((entry) => entry.id === id);
  if (!rule) throw new RangeError(`unknown pastry ${id}`);
  return rule;
}

export function bookRule(id: BookId): BookRule {
  const rule = BOOKS.find((entry) => entry.id === id);
  if (!rule) throw new RangeError(`unknown book ${id}`);
  return rule;
}

export function stepDuration(token: StepToken): number {
  switch (token) {
    case "brew":
      return STEP_TICKS.brew;
    case "steam":
      return STEP_TICKS.steam;
    case "water":
      return STEP_TICKS.water;
    case "warm":
      return STEP_TICKS.warm;
    default:
      return 0;
  }
}

export function bookCarriesMood(id: BookId, mood: MoodId): boolean {
  return bookRule(id).moods.includes(mood);
}

export function moodsCoveredBy(books: readonly BookId[]): MoodId[] {
  return MOODS.filter((mood) => books.some((id) => bookCarriesMood(id, mood)));
}
