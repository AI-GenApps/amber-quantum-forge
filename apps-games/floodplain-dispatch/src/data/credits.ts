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

/** One entry per file in `public/audio/LICENSES.md`; a test keeps them equal. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [
  {
    name: "ui-tap.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "ui-back.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "ui-toggle.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "ui-open-sheet.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "place-canal.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "place-barrier.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "place-pump.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "place-gate.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "place-reservoir.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "remove-piece.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "rotate-pump.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "invalid.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "run-start.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "water-loop.ogg",
    licence: "CC0",
    source: "https://opengameart.org/content/sea-and-river-wave-sounds",
    note: "Snabisch (user snabisch on OpenGameArt)",
  },
  {
    name: "surge-warning.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "house-supplied.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "field-irrigated.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "house-flooded.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/digital-audio",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "star-1.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "star-2.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "star-3.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "result-fail.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/digital-audio",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "region-unlock.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "theme-unlock.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "streak-up.ogg",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
    note: "Kenney (Kenney Vleugels)",
  },
  {
    name: "music-menu.ogg",
    licence: "CC0",
    source: "https://opengameart.org/content/calm-ambient-3-lifewave-2k",
    note: "The Cynic Project (cynicmusic)",
  },
  {
    name: "music-play.ogg",
    licence: "CC0",
    source: "https://opengameart.org/content/another-august",
    note: "The Cynic Project (cynicmusic)",
  },
];

/** Task 06 appends one entry per integrated art slot. */
export const ART_CREDITS: readonly CreditEntry[] = [];
