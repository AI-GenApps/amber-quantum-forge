import { type AudioManager, createAudioManager } from "@web-games/kit";
import {
  AUDIO_SLOTS,
  type AudioSlot,
  audioUrl,
  loadableSlots,
  MUSIC_MENU,
  MUSIC_PLAY,
  type SoundId,
  slotById,
  WATER_LOOP,
} from "./slots";

export type Scene = "menu" | "play" | "off";

export interface AudioEngine {
  /** 0 to 1 while the files load; 1 when the load has finished (even if some files failed). */
  readonly progress: number;
  readonly sfx: AudioManager;
  readonly ambience: AudioManager;
  /** Unlocks on the first user gesture and loads every file once. Returns the remover. */
  start(target?: EventTarget): () => void;
  load(): Promise<void>;
  onProgress(listener: (fraction: number) => void): () => void;
  play(id: SoundId): boolean;
  setScene(scene: Scene): void;
  readonly scene: Scene;
  /** Water loop level 0..1; 0 fades it out. */
  setFlow(level: number): void;
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

export interface EngineOptions {
  sfx?: AudioManager;
  ambience?: AudioManager;
  slots?: readonly AudioSlot[];
  /** Loudest the water loop gets (bus volume). */
  waterMax?: number;
  musicFadeMs?: number;
}

const GESTURES = ["pointerdown", "touchend", "keydown", "click"] as const;

export function createAudioEngine(options: EngineOptions = {}): AudioEngine {
  const sfx = options.sfx ?? createAudioManager();
  const ambience = options.ambience ?? createAudioManager();
  const slots = options.slots ?? AUDIO_SLOTS;
  const waterMax = options.waterMax ?? 0.45;
  const musicFadeMs = options.musicFadeMs ?? 1200;
  const listeners = new Set<(fraction: number) => void>();
  let progress = 0;
  let scene: Scene = "off";
  let loading: Promise<void> | null = null;
  let flow = 0;

  const report = (value: number): void => {
    progress = value;
    for (const listener of [...listeners]) listener(value);
  };

  const isWater = (slot: AudioSlot): boolean => slot.id === WATER_LOOP;

  const applyFlow = (): void => {
    if (flow <= 0.001) {
      if (ambience.currentMusic) ambience.stopMusic({ fadeMs: 400 });
      return;
    }
    ambience.setVolume("music", Math.min(1, flow) * waterMax);
    if (ambience.currentMusic !== WATER_LOOP) ambience.playMusic(WATER_LOOP, { fadeMs: 400 });
  };

  const applyScene = (): void => {
    if (scene === "off") sfx.stopMusic({ fadeMs: musicFadeMs });
    else sfx.playMusic(scene === "play" ? MUSIC_PLAY : MUSIC_MENU, { fadeMs: musicFadeMs });
  };

  const engine: AudioEngine = {
    get progress() {
      return progress;
    },
    get scene() {
      return scene;
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
      const sorted = [
        ...files.filter((slot) => slot.kind !== "music"),
        ...files.filter((slot) => slot.id === MUSIC_MENU),
        ...files.filter((slot) => slot.kind === "music" && slot.id !== MUSIC_MENU),
      ];
      let done = 0;
      report(0);
      loading = Promise.all(
        sorted.map(async (slot) => {
          const file = slot.file;
          if (file) await (isWater(slot) ? ambience : sfx).load(slot.id, audioUrl(file));
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
    setFlow(level) {
      flow = Number.isFinite(level) ? Math.max(0, level) : 0;
      applyFlow();
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
