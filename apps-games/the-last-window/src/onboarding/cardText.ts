import {
  LATE_CUSTOMERS_BASE,
  PATIENCE_TABLE,
  PORTIONS_PER_KIND,
  WEATHER_RULES,
} from "@web-games/the-last-window-core";
import type { CardId } from "./flags";

export interface CardDef {
  title: string;
  lines: readonly string[];
}

const rain = WEATHER_RULES.rain;
const lastPatience = PATIENCE_TABLE[PATIENCE_TABLE.length - 1]?.seconds ?? 0;

/** First-time cards. Numbers come from the core constants. */
export const CARDS: Readonly<Record<CardId, CardDef>> = {
  stock: {
    title: "Planning the shelves",
    lines: [
      `Each pastry you shelve costs coins up front and gives you ${PORTIONS_PER_KIND} portions for the shift.`,
      "Books are free. Pick the ones whose moods your regulars like.",
    ],
  },
  rain: {
    title: "A rainy shift",
    lines: [
      `Rain brings ${rain.extraCustomers} extra customer and ${rain.patienceSeconds} extra seconds of patience.`,
      "Stay warm and keep the kettle on.",
    ],
  },
  scene: {
    title: "An evening story",
    lines: [
      "Regulars you have made happy stay to talk. Tap the text to turn the page.",
      "Stories have no timer. Take your time.",
    ],
  },
  choice: {
    title: "Your choice",
    lines: [
      "Some stories ask you something. Neither answer is wrong.",
      "Your answers lean each friendship towards one of two endings.",
    ],
  },
  decor: {
    title: "A new touch",
    lines: [
      "Decor shows in every shift and helps in one small way.",
      "Check the Journal to see which effects you have.",
    ],
  },
  late: {
    title: "Late Shifts",
    lines: [
      `A Late Shift is a fresh evening every day, about ${LATE_CUSTOMERS_BASE} customers and growing.`,
      `Patience starts around ${lastPatience} seconds. Play on consecutive days to build a streak.`,
    ],
  },
};
