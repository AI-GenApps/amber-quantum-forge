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
  sfx("place-canal"),
  sfx("place-barrier"),
  sfx("place-pump"),
  sfx("place-gate"),
  sfx("place-reservoir"),
  sfx("remove-piece", 0.7),
  sfx("rotate-pump", 0.7),
  sfx("invalid", 0.7),
  sfx("run-start"),
  { id: "water-loop", file: "water-loop.ogg", kind: "loop", gain: 1, loop: true },
  sfx("surge-warning"),
  sfx("house-supplied", 0.6),
  sfx("field-irrigated", 0.6),
  sfx("house-flooded", 0.7),
  sfx("star-1"),
  sfx("star-2"),
  sfx("star-3"),
  sfx("result-fail"),
  sfx("region-unlock"),
  sfx("theme-unlock"),
  sfx("streak-up"),
  { id: "music-menu", file: "music-menu.ogg", kind: "music", gain: 1, loop: true },
  { id: "music-play", file: "music-play.ogg", kind: "music", gain: 1, loop: true },
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

export const MUSIC_MENU: SoundId = "music-menu";
export const MUSIC_PLAY: SoundId = "music-play";
export const WATER_LOOP: SoundId = "water-loop";
