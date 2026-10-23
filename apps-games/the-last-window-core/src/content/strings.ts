import type { Outcome, Weather } from "../types";

export const GAME_TITLE = "The Last Window";
export const TAGLINE = "Keep the lamp lit in a harbour cafe-bookshop.";

export const OPENING_NOTE: readonly string[] = [
  "To whoever has the keys now,",
  "The shop is small, the stools are low, and the lamp in the window must be lit every evening.",
  "Late boats look for it. So do lonely people. Keep the lamp lit, and the kettle on. The rest will follow.",
  "Marit",
];

export const JOURNAL_TABS = { stories: "Stories", diary: "Shop Diary" } as const;

export const OUTCOME_WORDS: Readonly<Record<Outcome, string>> = {
  delighted: "Delighted",
  satisfied: "Satisfied",
  disappointed: "Disappointed",
  left: "Left",
};

export const WEATHER_NAMES: Readonly<Record<Weather, string>> = {
  morning: "Morning",
  evening: "Evening",
  rain: "Rain",
};

export const SECTION_LABELS = {
  regulars: "Regulars",
  unfinished: "Story unfinished",
  finaleTitle: "Lantern Night",
  speakerYou: "You",
} as const;
