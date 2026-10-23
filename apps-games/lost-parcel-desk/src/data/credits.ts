export interface CreditEntry {
  name: string;
  author: string;
  licence: string;
  source: string;
}

/** Bundled fonts. Both families are SIL Open Font License 1.1. */
export const FONT_CREDITS: readonly CreditEntry[] = [
  {
    name: "Courier Prime",
    author: "The Courier Prime Project Authors (Quote-Unquote Apps)",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/courierprime",
  },
  {
    name: "IBM Plex Sans",
    author: "IBM Corp.",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/ibmplexsans",
  },
];

/** Task 05 appends one entry per CC0 audio file. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [];

/** Task 06 appends the reviewed designer art. */
export const ART_CREDITS: readonly CreditEntry[] = [];
