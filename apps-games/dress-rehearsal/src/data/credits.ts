export interface CreditEntry {
  readonly name: string;
  readonly role: string;
  readonly licence: string;
  readonly source: string;
}

export const FONT_CREDITS: readonly CreditEntry[] = [
  {
    name: "Playfair Display",
    role: "Display type",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/playfairdisplay",
  },
  {
    name: "DM Sans",
    role: "Body type",
    licence: "SIL Open Font License 1.1",
    source: "https://github.com/google/fonts/tree/main/ofl/dmsans",
  },
];

/** Extended by the audio task with one entry per shipped file. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [];

/** Extended by the art task with one entry per accepted designer image. */
export const ART_CREDITS: readonly CreditEntry[] = [];
