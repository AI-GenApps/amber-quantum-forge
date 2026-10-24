import { AUDIO_CREDITS } from "./audioCredits";

export type CreditGroup = "fonts" | "audio" | "art";

export interface CreditEntry {
  group: CreditGroup;
  name: string;
  author: string;
  licence: string;
  source: string;
}

/** Fonts (task 04) and audio (task 05); task 06 appends the art rows. */
export const CREDITS: readonly CreditEntry[] = [
  {
    group: "fonts",
    name: "Young Serif",
    author: "The Young Serif Project Authors",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/youngserif",
  },
  {
    group: "fonts",
    name: "Nunito Sans",
    author: "The Nunito Sans Project Authors",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/nunitosans",
  },
  ...AUDIO_CREDITS,
];

export function creditsFor(group: CreditGroup): CreditEntry[] {
  return CREDITS.filter((entry) => entry.group === group);
}
