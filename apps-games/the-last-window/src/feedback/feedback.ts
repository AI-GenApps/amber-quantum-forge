import type { Lifecycle, SettingsStore } from "@web-games/kit";
import { type AudioEngine, createAudioEngine, type Scene } from "../audio/engine";
import { cueFor, type FeedbackEvent } from "../audio/events";
import { createGameHaptics, type GameHaptics } from "./haptics";

export interface Feedback {
  fire(event: FeedbackEvent): void;
  /** Fires `event` after `delayMs`; returns a canceller. */
  fireLater(event: FeedbackEvent, delayMs: number): () => void;
  setScene(scene: Scene): void;
  setRain(on: boolean): void;
  readonly audio: AudioEngine | null;
  readonly haptics: GameHaptics | null;
}

export const noopFeedback: Feedback = {
  fire: () => undefined,
  fireLater: () => () => undefined,
  setScene: () => undefined,
  setRain: () => undefined,
  audio: null,
  haptics: null,
};

export interface FeedbackOptions {
  audio?: AudioEngine;
  haptics?: GameHaptics;
  settings: Pick<SettingsStore, "get" | "subscribe">;
}

export function createFeedback(
  options: FeedbackOptions,
): Feedback & { audio: AudioEngine; haptics: GameHaptics } {
  const audio = options.audio ?? createAudioEngine();
  const haptics = options.haptics ?? createGameHaptics();
  const sync = (): void => {
    const current = options.settings.get();
    audio.syncSettings({ sound: current.sound, music: current.music });
  };
  sync();
  options.settings.subscribe(sync);
  haptics.follow(options.settings);

  const later = (run: () => void, delayMs: number): (() => void) => {
    if (delayMs <= 0) {
      run();
      return () => undefined;
    }
    const id = setTimeout(run, delayMs);
    return () => clearTimeout(id);
  };

  const fire = (event: FeedbackEvent): void => {
    const cue = cueFor(event);
    for (const sound of cue.sounds) later(() => audio.play(sound.id), sound.delayMs);
    for (const haptic of cue.haptics) later(() => haptics.fire(haptic.cue), haptic.delayMs);
  };

  return {
    fire,
    fireLater: (event, delayMs) => later(() => fire(event), delayMs),
    setScene: (scene) => audio.setScene(scene),
    setRain: (on) => audio.setRain(on),
    audio,
    haptics,
  };
}

/** Suspends audio while the app is in the background and resumes it on return. */
export function bindAudioLifecycle(
  audio: Pick<AudioEngine, "suspend" | "resume">,
  lifecycle: Pick<Lifecycle, "onPause" | "onResume">,
): () => void {
  const offPause = lifecycle.onPause(() => void audio.suspend());
  const offResume = lifecycle.onResume(() => void audio.resume());
  return () => {
    offPause();
    offResume();
  };
}
