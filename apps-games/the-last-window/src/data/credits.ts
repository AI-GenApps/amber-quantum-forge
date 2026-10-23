export type CreditGroup = "fonts" | "audio" | "art";

export interface CreditEntry {
  group: CreditGroup;
  name: string;
  author: string;
  licence: string;
  source: string;
}

/** Fonts are shipped by task 04; tasks 05 (audio) and 06 (art) append their rows here. */
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
];

export function creditsFor(group: CreditGroup): CreditEntry[] {
  return CREDITS.filter((entry) => entry.group === group);
}
