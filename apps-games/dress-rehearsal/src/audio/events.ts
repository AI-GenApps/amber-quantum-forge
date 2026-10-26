import type { ProgressEvent } from "@web-games/dress-rehearsal-core";
import type { SoundId } from "./slots";

export type UiKind = "tap" | "back" | "toggle" | "sheet";

export type UnlockKind = "chapter" | "frame" | "affinity";

export type FeedbackEvent =
  | { type: "ui"; ui: UiKind }
  | { type: "tab" }
  | { type: "pick" }
  | { type: "place" }
  | { type: "swap" }
  | { type: "remove" }
  | { type: "invalid" }
  | { type: "rule-met" }
  | { type: "rule-broken" }
  | { type: "look-complete" }
  | { type: "finish" }
  | { type: "star"; index: number; total: number }
  | { type: "result-miss" }
  | { type: "hint" }
  | { type: "coins" }
  | { type: "unlock"; what: UnlockKind }
  | { type: "streak" }
  | { type: "export" }
  | { type: "frame" };

export type HapticCue =
  | { kind: "impact"; style: "light" | "medium" }
  | { kind: "notify"; type: "success" | "warning" | "error" };

export interface Cue {
  sound: SoundId | null;
  haptic: HapticCue | null;
}

const LIGHT: HapticCue = { kind: "impact", style: "light" };
const MEDIUM: HapticCue = { kind: "impact", style: "medium" };
const SUCCESS: HapticCue = { kind: "notify", type: "success" };
const WARNING: HapticCue = { kind: "notify", type: "warning" };

const UI_SOUND = {
  tap: "ui-tap",
  back: "ui-back",
  toggle: "ui-toggle",
  sheet: "ui-open-sheet",
} as const satisfies Record<UiKind, SoundId>;

const SILENT: Cue = { sound: null, haptic: null };

/**
 * The single table from game events to a sound and a haptic. Plain button taps, tray tabs and
 * scrolling never vibrate; the star cue plays one jingle, on the last star of the reveal.
 */
export function cueFor(event: FeedbackEvent): Cue {
  switch (event.type) {
    case "ui":
      return { sound: UI_SOUND[event.ui], haptic: null };
    case "tab":
      return { sound: "ui-tab", haptic: null };
    case "pick":
      return { sound: "item-pick", haptic: null };
    case "place":
      return { sound: "item-place", haptic: LIGHT };
    case "swap":
      return { sound: "item-swap", haptic: LIGHT };
    case "remove":
      return { sound: "item-remove", haptic: null };
    case "invalid":
      return { sound: "item-invalid", haptic: WARNING };
    case "rule-met":
      return { sound: "rule-met", haptic: null };
    case "rule-broken":
      return { sound: "rule-broken", haptic: null };
    case "look-complete":
      return { sound: "look-complete", haptic: null };
    case "finish":
      return { sound: "finish-look", haptic: MEDIUM };
    case "star": {
      const last = event.index >= event.total;
      const sound = last ? (`star-${Math.min(3, Math.max(1, event.total))}` as SoundId) : null;
      return { sound, haptic: SUCCESS };
    }
    case "result-miss":
      return { sound: "result-miss", haptic: null };
    case "hint":
      return { sound: "hint-use", haptic: null };
    case "coins":
      return { sound: "coin-gain", haptic: null };
    case "unlock":
      return { sound: "unlock", haptic: SUCCESS };
    case "streak":
      return { sound: "streak-up", haptic: SUCCESS };
    case "export":
      return { sound: "export-shutter", haptic: null };
    case "frame":
      return { sound: "frame-select", haptic: null };
    default:
      return SILENT;
  }
}

export const STAR_STAGGER_MS = 120 as const;

/** The result reveal: one event per earned star, 120 ms apart, or the miss cue for zero stars. */
export function resultFeedback(stars: number): Array<{ delayMs: number; event: FeedbackEvent }> {
  if (stars < 1) return [{ delayMs: 0, event: { type: "result-miss" } }];
  return Array.from({ length: stars }, (_, i) => ({
    delayMs: i * STAR_STAGGER_MS,
    event: { type: "star", index: i + 1, total: stars } as FeedbackEvent,
  }));
}

/**
 * Progression cues after a result: coins, one unlock chime (chapter or affinity) and a longer
 * Daily streak. Several unlocks at once share a single chime.
 */
export function progressFeedback(
  events: readonly ProgressEvent[] | null,
  streakUp = false,
): FeedbackEvent[] {
  const out: FeedbackEvent[] = [];
  let coins = false;
  let unlock: UnlockKind | null = null;
  for (const event of events ?? []) {
    if (event.type === "coins-gained" && event.amount > 0) coins = true;
    else if (event.type === "chapter-unlocked") unlock = unlock ?? "chapter";
    else if (event.type === "affinity-level") unlock = unlock ?? "affinity";
  }
  if (coins) out.push({ type: "coins" });
  if (unlock) out.push({ type: "unlock", what: unlock });
  if (streakUp) out.push({ type: "streak" });
  return out;
}
