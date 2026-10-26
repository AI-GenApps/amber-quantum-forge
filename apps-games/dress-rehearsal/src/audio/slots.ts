export type SlotKind = "sfx" | "music";

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

const music = <const I extends string>(id: I) => ({
  id,
  file: `${id}.ogg`,
  kind: "music" as const,
  gain: 1,
  loop: true as const,
});

export const AUDIO_SLOTS = [
  sfx("ui-tap", 0.5),
  sfx("ui-back", 0.5),
  sfx("ui-toggle", 0.5),
  sfx("ui-open-sheet", 0.5),
  sfx("ui-tab", 0.5),
  sfx("item-pick", 0.6),
  sfx("item-place", 0.8),
  sfx("item-swap", 0.7),
  sfx("item-remove", 0.6),
  sfx("item-invalid", 0.7),
  sfx("rule-met", 0.6),
  sfx("rule-broken", 0.6),
  sfx("look-complete", 0.7),
  sfx("finish-look", 0.8),
  sfx("star-1"),
  sfx("star-2"),
  sfx("star-3"),
  sfx("result-miss", 0.7),
  sfx("hint-use", 0.7),
  sfx("coin-gain", 0.6),
  sfx("unlock"),
  sfx("streak-up"),
  sfx("export-shutter", 0.8),
  sfx("frame-select", 0.5),
  music("music-menu"),
  music("music-style"),
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
export const MUSIC_STYLE: SoundId = "music-style";
