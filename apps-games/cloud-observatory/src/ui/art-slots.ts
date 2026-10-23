export const EMBLEM_IDS = [
  "lyre",
  "whale",
  "archer",
  "crown",
  "serpent",
  "lantern",
  "ship",
  "fox",
  "key",
  "harp",
  "tower",
  "owl",
] as const;

export const INSTRUMENT_SLOT_IDS = [
  "telescope",
  "lens",
  "prism",
  "orrery",
  "star-map",
  "beacon",
  "archive",
  "aurora-coil",
] as const;

export const LORE_SLOT_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export type EmblemId = (typeof EMBLEM_IDS)[number];
export type InstrumentSlotId = (typeof INSTRUMENT_SLOT_IDS)[number];

export type ArtSlot =
  | "icon"
  | "key-art"
  | "observatory-building"
  | "sky-far"
  | "nebula-mid"
  | "horizon-hills"
  | "feature-graphic"
  | `emblem-${EmblemId}`
  | `instrument-${InstrumentSlotId}`
  | `lore-${(typeof LORE_SLOT_NUMBERS)[number]}`;

export const ART_SLOTS: readonly ArtSlot[] = [
  "icon",
  "key-art",
  "observatory-building",
  ...EMBLEM_IDS.map((id): ArtSlot => `emblem-${id}`),
  "sky-far",
  "nebula-mid",
  "horizon-hills",
  ...INSTRUMENT_SLOT_IDS.map((id): ArtSlot => `instrument-${id}`),
  ...LORE_SLOT_NUMBERS.map((n): ArtSlot => `lore-${n}`),
  "feature-graphic",
];

export interface SlotSpec {
  /** Display size in CSS px; the bundled file is 2x. */
  readonly width: number;
  readonly height: number;
  readonly label: string;
  /** Decorative slots render alt="" and aria-hidden. */
  readonly decorative: boolean;
}

const FULL_BLEED = { width: 390, height: 585 } as const;

export function slotSpec(slot: ArtSlot): SlotSpec {
  if (slot.startsWith("emblem-")) {
    return { width: 144, height: 144, label: `${slot.slice(7)} emblem`, decorative: true };
  }
  if (slot.startsWith("instrument-")) {
    return { width: 112, height: 112, label: `${slot.slice(11)} instrument`, decorative: true };
  }
  if (slot.startsWith("lore-")) {
    return { width: 300, height: 450, label: "chapter illustration", decorative: true };
  }
  switch (slot) {
    case "icon":
      return { width: 512, height: 512, label: "Cloud Observatory icon", decorative: true };
    case "key-art":
      return {
        width: 360,
        height: 540,
        label: "A rooftop observatory under a deep blue sky of gold stars",
        decorative: false,
      };
    case "observatory-building":
      return {
        width: 320,
        height: 320,
        label: "The rooftop observatory with its brass dome",
        decorative: false,
      };
    case "sky-far":
    case "nebula-mid":
    case "horizon-hills":
      return { ...FULL_BLEED, label: slot, decorative: true };
    default:
      return { width: 768, height: 512, label: "Cloud Observatory feature art", decorative: true };
  }
}

export const emblemSlot = (constellationId: string): ArtSlot =>
  `emblem-${constellationId}` as ArtSlot;
export const instrumentSlot = (instrumentId: string): ArtSlot =>
  `instrument-${instrumentId}` as ArtSlot;
export const loreSlot = (chapter: number): ArtSlot => `lore-${chapter}` as ArtSlot;
