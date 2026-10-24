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

/** One entry per CC0 audio file; `test/audio-assets.test.ts` proves they match `public/audio/LICENSES.md`. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [
  {
    name: "ui-tap.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-back.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-toggle.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-open-sheet.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "parcel-open.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "object-open.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "object-flip.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "zoom-toggle.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "clue-found.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "clue-pin.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
  },
  {
    name: "clue-unpin.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
  },
  {
    name: "clue-link.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "clue-unlink.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "hint-use.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "accuse.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
  },
  {
    name: "wrong-guess.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/digital-audio",
  },
  {
    name: "stamp-thud.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
  },
  {
    name: "typewriter.ogg",
    author: "unicaegames (user unicaegames on OpenGameArt)",
    licence: "CC0",
    source: "https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes",
  },
  {
    name: "stamp-1.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "stamp-2.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "stamp-3.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "ledger-found.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "map-fill.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "achievement.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "chapter-unlock.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "theme-unlock.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "streak-up.ogg",
    author: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "music-desk.ogg",
    author: "The Cynic Project (cynicmusic)",
    licence: "CC0",
    source: "https://opengameart.org/content/calm-piano-1-vaporware",
  },
  {
    name: "music-case.ogg",
    author: "The Cynic Project (cynicmusic)",
    licence: "CC0",
    source: "https://opengameart.org/content/another-august",
  },
];

/** Task 06 appends the reviewed designer art. */
export const ART_CREDITS: readonly CreditEntry[] = [];
