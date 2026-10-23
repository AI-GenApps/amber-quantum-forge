import { DECOR, type DecorEffect, type DecorRule } from "../rules/decor";
import type { BookId, DecorId, DrinkId, MoodId, PastryId } from "../types";
import type { MoodText } from "./types";

export const DRINK_TEXT: Readonly<Record<DrinkId, string>> = {
  "drink-1": "Strong filter coffee, the colour of the deep channel.",
  "drink-2": "Coffee and steamed milk, in two slow layers.",
  "drink-3": "Smoky black tea with a long cool finish.",
  "drink-4": "Soft flowers and a spoon of honey.",
  "drink-5": "Thick cocoa, hot and sweet, for cold hands.",
  "drink-6": "Coffee, cocoa and steamed milk, for long nights.",
};

export const PASTRY_TEXT: Readonly<Record<PastryId, string>> = {
  "pastry-1": "Warm roll, flaky salt on top.",
  "pastry-2": "Twisted dough, dusted with cinnamon sugar.",
  "pastry-3": "Warm pear under a thin sweet glaze.",
  "pastry-4": "Soft bun, lemon cream, sugar dust.",
  "pastry-5": "Spiced loaf, glazed and dusted, Henrik's mother's recipe.",
};

export interface BookText {
  author: string;
  blurb: string;
}

export const BOOK_TEXT: Readonly<Record<BookId, BookText>> = {
  "book-1": {
    author: "Edda Pell",
    blurb: "A year of small facts about light, weather and tides.",
  },
  "book-2": { author: "Ines Ferro", blurb: "Short poems about leaving and coming home." },
  "book-3": {
    author: "Hal Mercer",
    blurb: "A girl finishes her father's unfinished map.",
  },
  "book-4": { author: "Posy Larch", blurb: "Comic essays about small bad luck." },
  "book-5": {
    author: "Bram Tully",
    blurb: "A picture-book style tale of a very determined gull.",
  },
};

export const MOOD_TEXT: readonly MoodText[] = [
  {
    id: "comforting",
    name: "Comforting",
    text: "Warm and familiar, like a blanket on a cold day.",
  },
  { id: "adventurous", name: "Adventurous", text: "Maps, journeys and a little brave trouble." },
  {
    id: "wistful",
    name: "Wistful",
    text: "Sweet and a bit sad, about places and people far away.",
  },
  { id: "funny", name: "Funny", text: "Light and silly, made to make you laugh out loud." },
  { id: "curious", name: "Curious", text: "Facts, puzzles and the joy of finding things out." },
];

export function moodText(id: MoodId): MoodText {
  const entry = MOOD_TEXT.find((mood) => mood.id === id);
  if (entry === undefined) throw new RangeError(`unknown mood ${id}`);
  return entry;
}

function effectSentence(effect: DecorEffect): string {
  switch (effect.kind) {
    case "patience":
      return `Every customer waits ${effect.seconds} seconds longer.`;
    case "bookPrice":
      return `Every book you sell earns ${effect.coins} extra coins.`;
    case "drinkPrice":
      return `Every drink you sell earns ${effect.coins} extra coin.`;
    case "pastrySlot":
      return `The pastry shelf holds ${effect.slots} more kind.`;
    case "bookSlot":
      return `The book shelf holds ${effect.slots} more book.`;
    case "fpOnDelighted":
      return `A delighted customer gives ${effect.points} extra friendship point.`;
    case "rainPatience":
      return `On rainy days every customer waits ${effect.seconds} seconds longer.`;
    case "tipPoints":
      return `Tips grow by ${effect.points} percentage points.`;
  }
}

const DECOR_LOOK: Readonly<Record<DecorId, string>> = {
  "decor-1": "Three patchwork cushions in lamp, teal and brick.",
  "decor-2": "A small brass desk lamp with a green glass shade.",
  "decor-3": "A terracotta pot of rosemary by the till.",
  "decor-4": "A domed glass stand with a pastry under it.",
  "decor-5": "A short wooden ladder on a brass rail.",
  "decor-6": "An old sea chart in a wooden frame.",
  "decor-7": "Brass tubes and a glass drop that ring in the rain.",
  "decor-8": "A brass-horn gramophone on a stool.",
};

export function decorDescription(rule: DecorRule): string {
  return `${DECOR_LOOK[rule.id]} ${effectSentence(rule.effect)}`;
}

export const DECOR_TEXT: Readonly<Record<DecorId, string>> = Object.fromEntries(
  DECOR.map((rule) => [rule.id, decorDescription(rule)]),
) as Record<DecorId, string>;
