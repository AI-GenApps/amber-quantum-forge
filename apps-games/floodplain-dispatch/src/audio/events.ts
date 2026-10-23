import type { EconomyEvent, PieceKind } from "@web-games/floodplain-dispatch-core";
import type { SoundId } from "./slots";

export type BadgeEvent = "house-supplied" | "field-irrigated" | "house-flooded";

export type FeedbackEvent =
  | { type: "ui"; ui: "tap" | "back" | "toggle" | "sheet" }
  | { type: "place"; piece: PieceKind }
  | { type: "remove" }
  | { type: "rotate" }
  | { type: "invalid" }
  | { type: "run" }
  | { type: "surge" }
  | { type: "badge"; badge: BadgeEvent }
  | { type: "star"; index: number; total: number }
  | { type: "result-fail" }
  | { type: "unlock"; what: "region" | "theme" }
  | { type: "streak" };

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
const ERROR: HapticCue = { kind: "notify", type: "error" };

export const PLACE_SOUND: Readonly<Record<PieceKind, SoundId>> = {
  canal: "place-canal",
  barrier: "place-barrier",
  pump: "place-pump",
  gate: "place-gate",
  reservoir: "place-reservoir",
};

const UI_SOUND = {
  tap: "ui-tap",
  back: "ui-back",
  toggle: "ui-toggle",
  sheet: "ui-open-sheet",
} as const satisfies Record<"tap" | "back" | "toggle" | "sheet", SoundId>;

const BADGE_SOUND = {
  "house-supplied": "house-supplied",
  "field-irrigated": "field-irrigated",
  "house-flooded": "house-flooded",
} as const satisfies Record<BadgeEvent, SoundId>;

/** The single table from game events to a sound and a haptic. Plain button taps never vibrate. */
export function cueFor(event: FeedbackEvent): Cue {
  switch (event.type) {
    case "ui":
      return { sound: UI_SOUND[event.ui], haptic: null };
    case "place":
      return { sound: PLACE_SOUND[event.piece], haptic: LIGHT };
    case "remove":
      return { sound: "remove-piece", haptic: null };
    case "rotate":
      return { sound: "rotate-pump", haptic: LIGHT };
    case "invalid":
      return { sound: "invalid", haptic: WARNING };
    case "run":
      return { sound: "run-start", haptic: MEDIUM };
    case "surge":
      return { sound: "surge-warning", haptic: null };
    case "badge":
      return {
        sound: BADGE_SOUND[event.badge],
        haptic: event.badge === "house-flooded" ? ERROR : null,
      };
    case "star": {
      const last = event.index >= event.total;
      const sound = last ? (`star-${Math.min(3, Math.max(1, event.total))}` as SoundId) : null;
      return { sound, haptic: SUCCESS };
    }
    case "result-fail":
      return { sound: "result-fail", haptic: null };
    case "unlock":
      return { sound: event.what === "region" ? "region-unlock" : "theme-unlock", haptic: SUCCESS };
    case "streak":
      return { sound: "streak-up", haptic: null };
  }
}

/** Progression events from the economy that have a sound: region and theme unlocks, streak. */
export function economyFeedback(events: readonly EconomyEvent[] | null): FeedbackEvent[] {
  const out: FeedbackEvent[] = [];
  for (const event of events ?? []) {
    if (event.type === "region-unlocked") out.push({ type: "unlock", what: "region" });
    else if (event.type === "theme-unlocked") out.push({ type: "unlock", what: "theme" });
    else if (event.type === "streak-extended") out.push({ type: "streak" });
  }
  return out;
}

export const STAR_STAGGER_MS = 120 as const;

/** The result reveal: one event per earned star, 120 ms apart, or the fail cue for zero stars. */
export function resultFeedback(stars: number): Array<{ delayMs: number; event: FeedbackEvent }> {
  if (stars < 1) return [{ delayMs: 0, event: { type: "result-fail" } }];
  return Array.from({ length: stars }, (_, i) => ({
    delayMs: i * STAR_STAGGER_MS,
    event: { type: "star", index: i + 1, total: stars } as FeedbackEvent,
  }));
}
