import type { AudioManager, Haptics, ImpactStyle, Motion, NotificationKind } from "@web-games/kit";
import type { SoundId } from "../audio/sounds";
import { SOUNDS } from "../audio/sounds";
import { lanternBloom, loopGlow, tilePop } from "../motion/presets";
import type { FeedbackBus, FeedbackEvent } from "./events";

export type HapticAction =
  | { kind: "impact"; style: ImpactStyle; group?: string; minGapMs?: number }
  | { kind: "notify"; type: NotificationKind; group?: string; minGapMs?: number };

export const TILE_HAPTIC_GAP_MS = 40;
export const CONFLICT_HAPTIC_GAP_MS = 800;

/** Haptics per event. Events not listed are silent. Place and rotate share one throttle group. */
export const HAPTIC_MAP: Readonly<Partial<Record<SoundId, HapticAction>>> = {
  "tile-place": { kind: "impact", style: "light", group: "tile", minGapMs: TILE_HAPTIC_GAP_MS },
  "tile-rotate": { kind: "impact", style: "light", group: "tile", minGapMs: TILE_HAPTIC_GAP_MS },
  "loop-close": { kind: "impact", style: "medium" },
  "win-1": { kind: "notify", type: "success" },
  "win-2": { kind: "notify", type: "success" },
  "win-3": { kind: "notify", type: "success" },
  conflict: { kind: "notify", type: "warning", minGapMs: CONFLICT_HAPTIC_GAP_MS },
  hint: { kind: "impact", style: "light" },
  undo: { kind: "impact", style: "light" },
};

export interface FeedbackOptions {
  bus: FeedbackBus;
  audio: Pick<AudioManager, "play">;
  haptics: Pick<Haptics, "impact" | "notify">;
  motion: Pick<Motion, "tween" | "spring" | "reduced">;
  /** Monotonic milliseconds; defaults to `performance.now`. */
  now?: () => number;
}

/**
 * The only place that turns events into sound, haptics and board motion. Screens emit events and
 * never call audio themselves. Returns a function that detaches the subscriber.
 */
export function attachFeedback(options: FeedbackOptions): () => void {
  const { bus, audio, haptics, motion } = options;
  const now = options.now ?? (() => performance.now());
  const lastBuzz = new Map<string, number>();

  const buzz = (id: SoundId): void => {
    const action = HAPTIC_MAP[id];
    if (action === undefined) return;
    if (action.minGapMs !== undefined) {
      const key = action.group ?? id;
      const at = now();
      const previous = lastBuzz.get(key);
      if (previous !== undefined && at - previous < action.minGapMs) return;
      lastBuzz.set(key, at);
    }
    if (action.kind === "impact") haptics.impact(action.style);
    else haptics.notify(action.type);
  };

  const animate = (event: FeedbackEvent): void => {
    const root = bus.board();
    if (root === null) return;
    const cells = event.cells ?? [];
    if (event.id === "tile-place" || event.id === "tile-rotate") void tilePop(motion, root, cells);
    else if (event.id === "loop-close") void loopGlow(motion, root, event.loops ?? []);
    else if (event.id === "lantern-lit") void lanternBloom(motion, root, cells);
  };

  return bus.subscribe((event) => {
    audio.play(event.id, { volume: SOUNDS[event.id].volume });
    buzz(event.id);
    animate(event);
  });
}
