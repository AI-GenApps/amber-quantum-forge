export type SlotKind = "sfx" | "loop" | "music";

export interface AudioSlot {
  id: string;
  /** File name inside `public/audio/`, or null when the slot ships silent. */
  file: string | null;
  kind: SlotKind;
  /** Per-play gain, 0..1. */
  gain: number;
  loop: boolean;
  /** Required when `file` is null: why the slot is silent. */
  silent?: string;
}

const sfx = <const I extends string>(id: I, gain = 0.8) => ({
  id,
  file: `${id}.ogg`,
  kind: "sfx" as const,
  gain,
  loop: false as const,
});

export const AUDIO_SLOTS = [
  sfx("ui-tap", 0.5),
  sfx("ui-back", 0.5),
  sfx("ui-toggle", 0.5),
  sfx("ui-open-sheet", 0.5),
  sfx("parcel-open"),
  sfx("object-open", 0.7),
  sfx("object-flip", 0.7),
  sfx("zoom-toggle", 0.6),
  sfx("clue-found", 0.7),
  sfx("clue-pin"),
  sfx("clue-unpin", 0.7),
  sfx("clue-link", 0.7),
  sfx("clue-unlink", 0.6),
  sfx("hint-use"),
  sfx("accuse"),
  sfx("wrong-guess"),
  sfx("stamp-thud"),
  { id: "typewriter", file: "typewriter.ogg", kind: "loop", gain: 1, loop: true },
  sfx("stamp-1"),
  sfx("stamp-2"),
  sfx("stamp-3"),
  sfx("ledger-found"),
  sfx("map-fill", 0.7),
  sfx("achievement"),
  sfx("chapter-unlock"),
  sfx("theme-unlock"),
  sfx("streak-up"),
  { id: "music-desk", file: "music-desk.ogg", kind: "music", gain: 1, loop: true },
  { id: "music-case", file: "music-case.ogg", kind: "music", gain: 1, loop: true },
] as const satisfies readonly AudioSlot[];

export type SoundId = (typeof AUDIO_SLOTS)[number]["id"];

export const SOUND_IDS: readonly SoundId[] = AUDIO_SLOTS.map((slot) => slot.id);

export const AUDIO_DIR = "/audio" as const;

export function audioUrl(file: string): string {
  return `${AUDIO_DIR}/${file}`;
}

export function slotById(id: SoundId): AudioSlot {
  const slot = AUDIO_SLOTS.find((entry) => entry.id === id);
  if (!slot) throw new Error(`Unknown sound slot ${id}`);
  return slot;
}

export function loadableSlots(slots: readonly AudioSlot[] = AUDIO_SLOTS): AudioSlot[] {
  return slots.filter((slot) => slot.file !== null);
}

export const MUSIC_DESK: SoundId = "music-desk";
export const MUSIC_CASE: SoundId = "music-case";
export const TYPEWRITER: SoundId = "typewriter";
