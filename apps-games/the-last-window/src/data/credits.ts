import { AUDIO_CREDITS } from "./audioCredits";

export type CreditGroup = "fonts" | "audio" | "art";

export interface CreditEntry {
  group: CreditGroup;
  name: string;
  author: string;
  licence: string;
  source: string;
}

const ART_GROUPS = [
  "Key art and interiors",
  "Regulars (24 busts)",
  "Drinks, pastries and books",
  "Decor objects",
] as const;

/** Fonts, art and audio rows; the audio rows come from `audioCredits.ts`. */
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
  ...ART_GROUPS.map(
    (name): CreditEntry => ({
      group: "art",
      name,
      author: "MobileGamesDesigner thread",
      licence: "Owned by the project",
      source: "Commissioned for The Last Window and reviewed before release",
    }),
  ),
  ...AUDIO_CREDITS,
];

export function creditsFor(group: CreditGroup): CreditEntry[] {
  return CREDITS.filter((entry) => entry.group === group);
}
