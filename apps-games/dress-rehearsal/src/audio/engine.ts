import { type AudioManager, createAudioManager } from "@web-games/kit";
import {
  AUDIO_SLOTS,
  type AudioSlot,
  audioUrl,
  loadableSlots,
  MUSIC_MENU,
  MUSIC_STYLE,
  type SoundId,
  slotById,
} from "./slots";

export type Scene = "menu" | "style" | "off";

export interface AudioEngine {
  /** 0 to 1 while the files load; 1 when the load has finished (even if some files failed). */
  readonly progress: number;
  readonly manager: AudioManager;
  readonly scene: Scene;
  /** Unlocks on the first user gesture and loads every file once. Returns the remover. */
  start(target?: EventTarget): () => void;
  load(): Promise<void>;
  onProgress(listener: (fraction: number) => void): () => void;
  play(id: SoundId): boolean;
  setScene(scene: Scene): void;
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

export interface EngineOptions {
  manager?: AudioManager;
  slots?: readonly AudioSlot[];
  musicFadeMs?: number;
}

const GESTURES = ["pointerdown", "touchend", "keydown", "click"] as const;

export function createAudioEngine(options: EngineOptions = {}): AudioEngine {
  const manager = options.manager ?? createAudioManager();
  const slots = options.slots ?? AUDIO_SLOTS;
  const musicFadeMs = options.musicFadeMs ?? 1200;
  const listeners = new Set<(fraction: number) => void>();
  let progress = 0;
  let scene: Scene = "off";
  let loading: Promise<void> | null = null;

  const report = (value: number): void => {
    progress = value;
    for (const listener of [...listeners]) listener(value);
  };

  const applyScene = (): void => {
    if (scene === "off") manager.stopMusic({ fadeMs: musicFadeMs });
    else manager.playMusic(scene === "style" ? MUSIC_STYLE : MUSIC_MENU, { fadeMs: musicFadeMs });
  };

  const engine: AudioEngine = {
    get progress() {
      return progress;
    },
    get scene() {
      return scene;
    },
    manager,
    start(target = globalThis.document) {
      const removeUnlock = manager.installUnlock(target);
      let loaded = false;
      const first = (): void => {
        if (loaded) return;
        loaded = true;
        for (const name of GESTURES) target?.removeEventListener(name, first);
        void engine.load();
      };
      if (target) for (const name of GESTURES) target.addEventListener(name, first);
      return () => {
        removeUnlock();
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
          if (slot.file) await manager.load(slot.id, audioUrl(slot.file));
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
      return manager.play(id, { volume: slot.gain });
    },
    setScene(next) {
      if (next === scene) return;
      scene = next;
      applyScene();
    },
    syncSettings(enabled) {
      manager.syncSettings(enabled);
    },
    suspend: () => manager.suspend(),
    resume: () => manager.resume(),
  };
  return engine;
}
