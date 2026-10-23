export interface CreditEntry {
  name: string;
  licence: string;
  source: string;
  note?: string;
}

export const FONT_CREDITS: readonly CreditEntry[] = [
  {
    name: "Bricolage Grotesque",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque",
    note: "Display type. Copyright 2022 The Bricolage Grotesque Project Authors.",
  },
  {
    name: "Atkinson Hyperlegible",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegible",
    note: "Body type. Copyright 2020 Braille Institute of America, Inc.",
  },
];

/** Task 05 appends one entry per CC0 audio file. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [];

/** Task 06 appends one entry per integrated art slot. */
export const ART_CREDITS: readonly CreditEntry[] = [];
