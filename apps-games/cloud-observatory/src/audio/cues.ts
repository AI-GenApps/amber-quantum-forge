import type { AudioManager } from "@web-games/kit";
import type { SfxId } from "../ui/feedback";

export interface CueDef {
  readonly id: SfxId;
  /** File name under `public/audio/`. */
  readonly file: string;
  /** Default gain, 0..1. */
  readonly volume: number;
  /** Playback-rate range; each play picks a value inside it so repeats do not sound identical. */
  readonly rate: readonly [number, number];
}

export const MUSIC_ID = "observatory-night";
export const MUSIC_FILE = "observatory-night.mp3";
export const MUSIC_FADE_MS = 600;
export const GATHER_MAX_PER_SECOND = 8;
export const AUDIO_BASE = "/audio/";

export const CUES: Readonly<Record<SfxId, CueDef>> = {
  gather: { id: "gather", file: "gather.mp3", volume: 0.5, rate: [0.94, 1.08] },
  buy: { id: "buy", file: "buy.mp3", volume: 0.7, rate: [1, 1] },
  upgrade: { id: "upgrade", file: "upgrade.mp3", volume: 0.7, rate: [1, 1] },
  "star-ok": { id: "star-ok", file: "star-ok.mp3", volume: 0.7, rate: [0.97, 1.05] },
  "star-miss": { id: "star-miss", file: "star-miss.mp3", volume: 0.55, rate: [1, 1] },
  "chart-done": { id: "chart-done", file: "chart-done.mp3", volume: 0.8, rate: [1, 1] },
  lore: { id: "lore", file: "lore.mp3", volume: 0.6, rate: [1, 1] },
  achievement: { id: "achievement", file: "achievement.mp3", volume: 0.8, rate: [1, 1] },
  eclipse: { id: "eclipse", file: "eclipse.mp3", volume: 0.9, rate: [1, 1] },
  comet: { id: "comet", file: "comet.mp3", volume: 0.8, rate: [1, 1] },
  click: { id: "click", file: "click.mp3", volume: 0.5, rate: [1, 1] },
  back: { id: "back", file: "back.mp3", volume: 0.5, rate: [1, 1] },
  welcome: { id: "welcome", file: "welcome.mp3", volume: 0.7, rate: [1, 1] },
};

export const CUE_IDS = Object.keys(CUES) as SfxId[];

export interface GameAudioOptions {
  /** URL prefix of the audio folder (default `/audio/`). */
  readonly base?: string;
  /** Milliseconds clock for the gather throttle. */
  readonly now?: () => number;
  /** 0..1 random source for rate jitter. */
  readonly random?: () => number;
}

export interface GameAudio {
  /** Resumes the audio context (needs a user gesture), then loads the files and starts the music. */
  unlock(): Promise<boolean>;
  /** Unlocks on the first user gesture on `target`; returns a function that removes the listeners. */
  installUnlock(target?: EventTarget, events?: readonly string[]): () => void;
  /** Plays one cue; unknown ids, locked audio and throttled repeats return false. */
  play(id: string): boolean;
  startMusic(): void;
  stopMusic(): void;
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown", "click"] as const;
const isCue = (id: string): id is SfxId => Object.hasOwn(CUES, id);

/** Cue table on top of the kit audio manager. A missing AudioContext makes everything a no-op. */
export function createGameAudio(manager: AudioManager, options: GameAudioOptions = {}): GameAudio {
  const base = options.base ?? AUDIO_BASE;
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? Math.random;
  const gatherTimes: number[] = [];
  let loading: Promise<void> | null = null;

  const loadAll = (): Promise<void> => {
    loading ??= (async () => {
      await Promise.all(CUE_IDS.map((id) => manager.load(id, `${base}${CUES[id].file}`)));
      await manager.load(MUSIC_ID, `${base}${MUSIC_FILE}`);
    })();
    return loading;
  };

  const throttled = (): boolean => {
    const t = now();
    while (gatherTimes.length > 0 && t - (gatherTimes[0] ?? t) >= 1000) gatherTimes.shift();
    if (gatherTimes.length >= GATHER_MAX_PER_SECOND) return true;
    gatherTimes.push(t);
    return false;
  };

  const audio: GameAudio = {
    async unlock() {
      const ok = await manager.unlock();
      if (!ok) return false;
      manager.playMusic(MUSIC_ID, { fadeMs: MUSIC_FADE_MS });
      void loadAll();
      return true;
    },
    installUnlock(target = globalThis.document, events = UNLOCK_EVENTS) {
      if (!target) return () => undefined;
      const remove = (): void => {
        for (const name of events) target.removeEventListener(name, handler);
      };
      const handler = (): void => {
        void audio.unlock().then((ok) => {
          if (ok) remove();
        });
      };
      for (const name of events) target.addEventListener(name, handler);
      return remove;
    },
    play(id) {
      if (!isCue(id)) return false;
      if (!manager.unlocked) return false;
      if (id === "gather" && throttled()) return false;
      const cue = CUES[id];
      const [low, high] = cue.rate;
      const rate = low + (high - low) * random();
      return manager.play(id, { volume: cue.volume, rate });
    },
    startMusic() {
      manager.playMusic(MUSIC_ID, { fadeMs: MUSIC_FADE_MS });
    },
    stopMusic() {
      manager.stopMusic({ fadeMs: MUSIC_FADE_MS });
    },
    syncSettings: (enabled) => manager.syncSettings(enabled),
    suspend: () => manager.suspend(),
    async resume() {
      await manager.resume();
    },
  };
  return audio;
}
