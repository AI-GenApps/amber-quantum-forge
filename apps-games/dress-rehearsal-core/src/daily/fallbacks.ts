import { challenge } from "../content/define";
import type { ChallengeDef } from "../content/types";
import { DAILY_CHAPTER_INDEX, tierFor } from "./tiers";

export const DAILY_FALLBACKS: readonly ChallengeDef[] = [
  challenge({
    id: "daily-fallback-mon",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "edie",
    slotSet: "C",
    rules: "era-min:now; include-piece:item-riviera-6",
    brief: "Edie Lindqvist: only modern pieces and wear the Straw Basket Tote.",
    reference: {
      accessory: "item-rainy-city-8",
      outer: "item-rainy-city-2",
      top: "item-riviera-1",
      bag: "item-riviera-6",
      bottom: "item-rainy-city-4",
      shoes: "item-riviera-5",
    },
  }),
  challenge({
    id: "daily-fallback-tue",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "mireille",
    slotSet: "C",
    rules: "warmth-min:5; include-colour:mint; include-piece:item-riviera-4",
    brief:
      "Mireille Vasseur: total warmth at least 5, include something mint and wear the Orange Wrap Skirt.",
    reference: {
      accessory: "item-riviera-8",
      outer: "item-rainy-city-2",
      top: "item-rainy-city-3",
      bag: "item-rainy-city-6",
      bottom: "item-riviera-4",
      shoes: "item-rainy-city-5",
    },
  }),
  challenge({
    id: "daily-fallback-wed",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "jun",
    slotSet: "F",
    rules: "include-piece:item-riviera-4; min-spend:460; palette-warm",
    brief: "Jun Aoki: wear the Orange Wrap Skirt, spend at least $460 and warm colours only.",
    reference: {
      accessory: "item-riviera-8",
      outer: "item-rainy-city-2",
      top: "item-rainy-city-3",
      bag: "item-riviera-6",
      bottom: "item-riviera-4",
      shoes: "item-riviera-5",
    },
  }),
  challenge({
    id: "daily-fallback-thu",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "tobias",
    slotSet: "F",
    rules: "formality-max:3; avoid-colour:sky; max-spend:360",
    brief: "Tobias Okafor: every piece formality 3 or less, nothing sky and spend at most $360.",
    reference: {
      accessory: "item-rainy-city-8",
      outer: "item-rainy-city-1",
      dress: "item-rainy-city-7",
      bag: "item-riviera-6",
      shoes: "item-riviera-5",
    },
  }),
  challenge({
    id: "daily-fallback-fri",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "ottoline",
    slotSet: "G",
    rules: "palette-warm; avoid-piece:item-rainy-city-8; max-spend:440",
    brief:
      "Dame Ottoline Frost: warm colours only, leave out the Black Compact Umbrella and spend at most $440.",
    reference: {
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
      outer: "item-rainy-city-1",
      top: "item-riviera-1",
      bag: "item-riviera-6",
      bottom: "item-rainy-city-4",
      shoes: "item-riviera-5",
    },
  }),
  challenge({
    id: "daily-fallback-sat",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "priya",
    slotSet: "G",
    rules: "max-spend:450; warmth-min:4; include-piece:item-rainy-city-3; avoid-colour:mint",
    brief:
      "Priya Raman: spend at most $450, total warmth at least 4, wear the Grey Wool Jumper and nothing mint.",
    reference: {
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
      outer: "item-rainy-city-1",
      top: "item-rainy-city-3",
      bag: "item-riviera-6",
      bottom: "item-riviera-3",
      shoes: "item-riviera-5",
    },
  }),
  challenge({
    id: "daily-fallback-sun",
    name: "Daily Fitting",
    chapterIndex: DAILY_CHAPTER_INDEX,
    clientId: "edie",
    slotSet: "G",
    rules: "avoid-piece:item-riviera-2; warmth-min:7; max-hues:1; max-spend:510",
    brief:
      "Edie Lindqvist: leave out the Sky Camp-Collar Shirt, total warmth at least 7, one colour at most and spend at most $510.",
    reference: {
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
      outer: "item-rainy-city-1",
      top: "item-riviera-1",
      bag: "item-riviera-6",
      bottom: "item-rainy-city-4",
      shoes: "item-rainy-city-5",
    },
  }),
];

export function fallbackFor(weekday: number): ChallengeDef {
  tierFor(weekday);
  const template = DAILY_FALLBACKS[weekday];
  if (template === undefined) throw new RangeError(`no fallback for weekday ${weekday}`);
  return template;
}
