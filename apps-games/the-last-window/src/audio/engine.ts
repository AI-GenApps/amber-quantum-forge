import { type AudioManager, createAudioManager } from "@web-games/kit";
import {
  AUDIO_SLOTS,
  type AudioSlot,
  audioUrl,
  loadableSlots,
  type MusicId,
  RAIN_LOOP,
  type SoundId,
  slotById,
} from "./slots";

export type Scene = "menu" | "shift" | "story" | "off";

export const SCENE_MUSIC: Readonly<Record<Exclude<Scene, "off">, MusicId>> = {
  menu: "music-menu",
  shift: "music-shift",
  story: "music-story",
};

export interface AudioEngine {
  /** 0 to 1 while the files load; 1 when the load has finished (even if some files failed). */
  readonly progress: number;
  readonly sfx: AudioManager;
  readonly ambience: AudioManager;
  readonly scene: Scene;
  readonly raining: boolean;
  /** Unlocks on the first user gesture and loads every file once. Returns the remover. */
  start(target?: EventTarget): () => void;
  load(): Promise<void>;
  onProgress(listener: (fraction: number) => void): () => void;
  play(id: SoundId): boolean;
  setScene(scene: Scene): void;
  setRain(on: boolean): void;
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

export interface EngineOptions {
  sfx?: AudioManager;
  ambience?: AudioManager;
  slots?: readonly AudioSlot[];
  /** Bus level of the music (sound effects stay louder). */
  musicLevel?: number;
  /** Bus level of the rain loop. */
  rainLevel?: number;
  musicFadeMs?: number;
}

const GESTURES = ["pointerdown", "touchend", "keydown", "click"] as const;

export function createAudioEngine(options: EngineOptions = {}): AudioEngine {
  const sfx = options.sfx ?? createAudioManager();
  const ambience = options.ambience ?? createAudioManager();
  const slots = options.slots ?? AUDIO_SLOTS;
  const musicFadeMs = options.musicFadeMs ?? 1200;
  const listeners = new Set<(fraction: number) => void>();
  let progress = 0;
  let scene: Scene = "off";
  let raining = false;
  let loading: Promise<void> | null = null;

  sfx.setVolume("music", options.musicLevel ?? 0.5);
  ambience.setVolume("music", options.rainLevel ?? 0.45);

  const report = (value: number): void => {
    progress = value;
    for (const listener of [...listeners]) listener(value);
  };

  const applyScene = (): void => {
    if (scene === "off") sfx.stopMusic({ fadeMs: musicFadeMs });
    else sfx.playMusic(SCENE_MUSIC[scene], { fadeMs: musicFadeMs });
  };

  const applyRain = (): void => {
    if (!raining) {
      if (ambience.currentMusic) ambience.stopMusic({ fadeMs: 600 });
      return;
    }
    if (ambience.currentMusic !== RAIN_LOOP) ambience.playMusic(RAIN_LOOP, { fadeMs: 800 });
  };

  const engine: AudioEngine = {
    get progress() {
      return progress;
    },
    get scene() {
      return scene;
    },
    get raining() {
      return raining;
    },
    sfx,
    ambience,
    start(target = globalThis.document) {
      const removeSfx = sfx.installUnlock(target);
      const removeAmbience = ambience.installUnlock(target);
      let loaded = false;
      const first = (): void => {
        if (loaded) return;
        loaded = true;
        for (const name of GESTURES) target?.removeEventListener(name, first);
        void engine.load();
      };
      if (target) for (const name of GESTURES) target.addEventListener(name, first);
      return () => {
        removeSfx();
        removeAmbience();
        if (target) for (const name of GESTURES) target.removeEventListener(name, first);
      };
    },
    load() {
      if (loading) return loading;
      const files = loadableSlots(slots);
      const first = SCENE_MUSIC.menu;
      const sorted = [
        ...files.filter((slot) => slot.kind === "sfx"),
        ...files.filter((slot) => slot.id === first),
        ...files.filter((slot) => slot.kind !== "sfx" && slot.id !== first),
      ];
      let done = 0;
      report(0);
      loading = Promise.all(
        sorted.map(async (slot) => {
          const file = slot.file;
          if (file) await (slot.id === RAIN_LOOP ? ambience : sfx).load(slot.id, audioUrl(file));
          done += 1;
          report(done / Math.max(1, sorted.length));
        }),
      ).then(() => {
        report(1);
      });
      return loading;
    },
    onProgress(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    play(id) {
      const slot = slotById(id);
      if (slot.file === null || slot.kind !== "sfx") return false;
      return sfx.play(id, { volume: slot.gain });
    },
    setScene(next) {
      if (next === scene) return;
      scene = next;
      applyScene();
    },
    setRain(on) {
      if (on === raining) return;
      raining = on;
      applyRain();
    },
    syncSettings(enabled) {
      sfx.syncSettings(enabled);
      ambience.syncSettings({ sound: enabled.sound, music: enabled.sound });
    },
    async suspend() {
      await Promise.all([sfx.suspend(), ambience.suspend()]);
    },
    async resume() {
      await Promise.all([sfx.resume(), ambience.resume()]);
    },
  };
  return engine;
}
