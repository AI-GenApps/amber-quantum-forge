import { type AudioManager, createAudioManager } from "@web-games/kit";
import {
  AUDIO_SLOTS,
  type AudioSlot,
  audioUrl,
  loadableSlots,
  MUSIC_CASE,
  MUSIC_DESK,
  type SoundId,
  slotById,
  TYPEWRITER,
} from "./slots";

export type Scene = "desk" | "case" | "off";

export interface AudioEngine {
  /** 0 to 1 while the files load; 1 when the load has finished (even if some files failed). */
  readonly progress: number;
  readonly sfx: AudioManager;
  readonly ambience: AudioManager;
  readonly scene: Scene;
  readonly typing: boolean;
  /** Unlocks on the first user gesture and loads every file once. Returns the remover. */
  start(target?: EventTarget): () => void;
  load(): Promise<void>;
  onProgress(listener: (fraction: number) => void): () => void;
  play(id: SoundId): boolean;
  /** Music for the screen: `desk` for menus and the evidence table, `case` for the deduction board. */
  setScene(scene: Scene): void;
  /** The typewriter loop runs only while the reveal text is typing. */
  setTyping(typing: boolean): void;
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

export interface EngineOptions {
  sfx?: AudioManager;
  ambience?: AudioManager;
  slots?: readonly AudioSlot[];
  /** Level of the typewriter loop (bus volume). */
  typingVolume?: number;
  musicFadeMs?: number;
}

const GESTURES = ["pointerdown", "touchend", "keydown", "click"] as const;

export function createAudioEngine(options: EngineOptions = {}): AudioEngine {
  const sfx = options.sfx ?? createAudioManager();
  const ambience = options.ambience ?? createAudioManager();
  const slots = options.slots ?? AUDIO_SLOTS;
  const typingVolume = options.typingVolume ?? 0.5;
  const musicFadeMs = options.musicFadeMs ?? 1200;
  const listeners = new Set<(fraction: number) => void>();
  let progress = 0;
  let scene: Scene = "off";
  let typing = false;
  let loading: Promise<void> | null = null;

  const report = (value: number): void => {
    progress = value;
    for (const listener of [...listeners]) listener(value);
  };

  const applyScene = (): void => {
    if (scene === "off") sfx.stopMusic({ fadeMs: musicFadeMs });
    else sfx.playMusic(scene === "case" ? MUSIC_CASE : MUSIC_DESK, { fadeMs: musicFadeMs });
  };

  const applyTyping = (): void => {
    if (!typing) {
      if (ambience.currentMusic) ambience.stopMusic({ fadeMs: 120 });
      return;
    }
    ambience.setVolume("music", typingVolume);
    if (ambience.currentMusic !== TYPEWRITER) ambience.playMusic(TYPEWRITER, { fadeMs: 80 });
  };

  const engine: AudioEngine = {
    get progress() {
      return progress;
    },
    get scene() {
      return scene;
    },
    get typing() {
      return typing;
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
        ...files.filter((slot) => slot.id === MUSIC_DESK),
        ...files.filter((slot) => slot.kind === "music" && slot.id !== MUSIC_DESK),
      ];
      let done = 0;
      report(0);
      loading = Promise.all(
        sorted.map(async (slot) => {
          const file = slot.file;
          if (file) await (slot.id === TYPEWRITER ? ambience : sfx).load(slot.id, audioUrl(file));
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
    setTyping(next) {
      if (next === typing) return;
      typing = next;
      applyTyping();
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
