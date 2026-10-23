/** The 17 event ids of `content-plan.md` section 10, each mapped to one file under `public/audio`. */
export const SOUND_IDS = [
  "ui-tap",
  "ui-back",
  "sheet-open",
  "tile-place",
  "tile-rotate",
  "tile-erase",
  "loop-close",
  "lantern-lit",
  "conflict",
  "hint",
  "undo",
  "win-1",
  "win-2",
  "win-3",
  "daily-done",
  "chapter-unlock",
  "freeze-used",
] as const;

export type SoundId = (typeof SOUND_IDS)[number];

export interface SoundSpec {
  /** File name under `public/audio`. */
  file: string;
  /** Per-play gain, 0 to 1. */
  volume: number;
}

export const SOUNDS: Readonly<Record<SoundId, SoundSpec>> = {
  "ui-tap": { file: "ui-tap.mp3", volume: 0.7 },
  "ui-back": { file: "ui-back.mp3", volume: 0.7 },
  "sheet-open": { file: "sheet-open.mp3", volume: 0.6 },
  "tile-place": { file: "tile-place.mp3", volume: 0.8 },
  "tile-rotate": { file: "tile-rotate.mp3", volume: 0.7 },
  "tile-erase": { file: "tile-erase.mp3", volume: 0.7 },
  "loop-close": { file: "loop-close.mp3", volume: 0.8 },
  "lantern-lit": { file: "lantern-lit.mp3", volume: 0.7 },
  conflict: { file: "conflict.mp3", volume: 0.5 },
  hint: { file: "hint.mp3", volume: 0.7 },
  undo: { file: "undo.mp3", volume: 0.6 },
  "win-1": { file: "win-1.mp3", volume: 0.8 },
  "win-2": { file: "win-2.mp3", volume: 0.8 },
  "win-3": { file: "win-3.mp3", volume: 0.8 },
  "daily-done": { file: "daily-done.mp3", volume: 0.8 },
  "chapter-unlock": { file: "chapter-unlock.mp3", volume: 0.8 },
  "freeze-used": { file: "freeze-used.mp3", volume: 0.7 },
};

/** The optional calm music loop (CC0, OpenGameArt). */
export const MUSIC_ID = "calm-loop";
export const MUSIC_FILE = "calm-loop.mp3";
export const MUSIC_BUS_VOLUME = 0.35;
export const MUSIC_FADE_MS = 1200;

export const AUDIO_BASE = "/audio/";

export function audioUrl(file: string): string {
  return `${AUDIO_BASE}${file}`;
}

export function winSoundFor(stars: number): "win-1" | "win-2" | "win-3" {
  return stars >= 3 ? "win-3" : stars === 2 ? "win-2" : "win-1";
}
