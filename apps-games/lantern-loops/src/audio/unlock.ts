import type { AudioManager } from "@web-games/kit";
import { audioUrl, MUSIC_FILE, MUSIC_ID, SOUND_IDS, SOUNDS } from "./sounds";

/** Decodes every effect and the music loop. Returns how many ids were loaded or already present. */
export async function preloadSounds(audio: AudioManager): Promise<number> {
  const jobs: Array<Promise<boolean>> = SOUND_IDS.map((id) =>
    audio.has(id) ? Promise.resolve(true) : audio.load(id, audioUrl(SOUNDS[id].file)),
  );
  jobs.push(
    audio.has(MUSIC_ID) ? Promise.resolve(true) : audio.load(MUSIC_ID, audioUrl(MUSIC_FILE)),
  );
  const results = await Promise.all(jobs);
  return results.filter(Boolean).length;
}

const GESTURES = ["pointerdown", "touchend", "keydown", "click"] as const;

/**
 * Unlocks audio on the first user gesture, then calls `onUnlocked` once (the preload and the music
 * start). Keeps listening until an unlock succeeds. Returns a function that removes the listeners.
 */
export function unlockOnFirstGesture(
  audio: AudioManager,
  onUnlocked: () => void,
  target: EventTarget | undefined = globalThis.document,
): () => void {
  if (!target || !audio.available) return () => undefined;
  let finished = false;
  const remove = (): void => {
    for (const name of GESTURES) target.removeEventListener(name, handler);
  };
  const handler = (): void => {
    void audio.unlock().then((ok) => {
      if (!ok || finished) return;
      finished = true;
      remove();
      onUnlocked();
    });
  };
  for (const name of GESTURES) target.addEventListener(name, handler);
  return () => {
    finished = true;
    remove();
  };
}
