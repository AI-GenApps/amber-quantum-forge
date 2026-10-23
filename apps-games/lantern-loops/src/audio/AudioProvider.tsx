import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { attachFeedback } from "../feedback/subscriber";
import { useSettings } from "../state/hooks";
import { MUSIC_FADE_MS, MUSIC_ID } from "./sounds";
import { preloadSounds, unlockOnFirstGesture } from "./unlock";

/**
 * Wires the audio manager, the haptics and the feedback subscriber to the app: settings sync,
 * unlock on the first gesture, preload after unlock, the music loop, and pause with the app.
 */
export function AudioProvider({ children }: { children?: ComponentChildren }) {
  const { audio, haptics, feedback, motion, lifecycle, services } = useApp();
  const settings = useSettings(services.settings);

  useEffect(() => {
    audio.syncSettings({ sound: settings.sound, music: settings.music });
    haptics.syncSettings({ haptics: settings.haptics });
  }, [audio, haptics, settings.sound, settings.music, settings.haptics]);

  useEffect(
    () => attachFeedback({ bus: feedback, audio, haptics, motion }),
    [feedback, audio, haptics, motion],
  );

  useEffect(
    () =>
      unlockOnFirstGesture(audio, () => {
        audio.playMusic(MUSIC_ID, { fadeMs: MUSIC_FADE_MS });
        void preloadSounds(audio);
      }),
    [audio],
  );

  useEffect(() => {
    const stopPause = lifecycle.onPause(() => void audio.suspend());
    const stopResume = lifecycle.onResume(() => void audio.resume());
    return () => {
      stopPause();
      stopResume();
    };
  }, [audio, lifecycle]);

  return <>{children}</>;
}
