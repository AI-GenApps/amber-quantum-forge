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

/** One entry per file in `public/audio/LICENSES.md`; a test keeps them equal. */
export const AUDIO_CREDITS: readonly CreditEntry[] = [
  {
    name: "ui-tap.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-back.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-toggle.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-open-sheet.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "ui-tab.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "item-pick.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "item-place.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/impact-sounds",
  },
  {
    name: "item-swap.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "item-remove.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "item-invalid.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "rule-met.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/digital-audio",
  },
  {
    name: "rule-broken.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/digital-audio",
  },
  {
    name: "look-complete.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "finish-look.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "star-1.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "star-2.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "star-3.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "result-miss.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "hint-use.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "coin-gain.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/rpg-audio",
  },
  {
    name: "unlock.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "streak-up.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/music-jingles",
  },
  {
    name: "export-shutter.ogg",
    role: "themightyglider (user themightyglider on OpenGameArt)",
    licence: "CC0",
    source: "https://opengameart.org/content/camera",
  },
  {
    name: "frame-select.ogg",
    role: "Kenney (Kenney Vleugels)",
    licence: "CC0 1.0",
    source: "https://kenney.nl/assets/interface-sounds",
  },
  {
    name: "music-menu.ogg",
    role: "Pro Sensory (Alex McCulloch)",
    licence: "CC0",
    source: "https://opengameart.org/content/mocha-frapp",
  },
  {
    name: "music-style.ogg",
    role: "Pro Sensory (Alex McCulloch)",
    licence: "CC0",
    source: "https://opengameart.org/content/one-step-at-a-time",
  },
];

/** Extended by the art task with one entry per accepted designer image. */
export const ART_CREDITS: readonly CreditEntry[] = [];
