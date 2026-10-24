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
  sfx("customer-arrive", 0.6),
  sfx("seat-select", 0.5),
  sfx("step-tap", 0.6),
  sfx("step-wrong", 0.7),
  sfx("step-brew", 0.5),
  sfx("step-steam", 0.5),
  sfx("step-pour", 0.6),
  sfx("oven-start", 0.6),
  sfx("oven-ready", 0.7),
  sfx("book-pick", 0.7),
  sfx("serve", 0.7),
  sfx("coin", 0.6),
  sfx("delighted", 0.7),
  sfx("disappointed", 0.6),
  sfx("customer-left", 0.6),
  sfx("patience-warning", 0.6),
  sfx("shift-start", 0.7),
  sfx("shift-end", 0.7),
  sfx("star-1", 0.8),
  sfx("star-2", 0.8),
  sfx("star-3", 0.8),
  sfx("scene-open", 0.6),
  sfx("choice-pick", 0.6),
  sfx("friendship-up", 0.8),
  sfx("ending", 0.8),
  sfx("decor-buy", 0.7),
  sfx("unlock", 0.8),
  sfx("streak-up", 0.8),
  { id: "rain-loop", file: "rain-loop.ogg", kind: "loop", gain: 1, loop: true },
  { id: "music-menu", file: "music-menu.ogg", kind: "music", gain: 1, loop: true },
  { id: "music-shift", file: "music-shift.ogg", kind: "music", gain: 1, loop: true },
  { id: "music-story", file: "music-story.ogg", kind: "music", gain: 1, loop: true },
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

export type MusicId = "music-menu" | "music-shift" | "music-story";
export const RAIN_LOOP = "rain-loop" as const satisfies SoundId;
