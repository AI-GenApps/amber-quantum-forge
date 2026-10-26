import type { ProgressEvent, ShiftEvent } from "@web-games/the-last-window-core";
import type { SoundId } from "./slots";

export type HapticCue =
  | { kind: "impact"; style: "light" | "medium" }
  | { kind: "notify"; type: "success" | "warning" | "error" };

export interface TimedSound {
  id: SoundId;
  delayMs: number;
}

export interface TimedHaptic {
  cue: HapticCue;
  delayMs: number;
}

export interface Cue {
  sounds: readonly TimedSound[];
  haptics: readonly TimedHaptic[];
}

export type FeedbackEvent =
  | { type: "ui"; ui: "tap" | "back" | "toggle" | "sheet" }
  | { type: "shift"; event: ShiftEvent }
  | { type: "shift-start" }
  | { type: "star"; index: number; total: number }
  | { type: "scene-open" }
  | { type: "choice" }
  | { type: "friendship" }
  | { type: "ending" }
  | { type: "decor-buy" }
  | { type: "unlock" }
  | { type: "streak" };

const LIGHT: HapticCue = { kind: "impact", style: "light" };
const MEDIUM: HapticCue = { kind: "impact", style: "medium" };
const SUCCESS: HapticCue = { kind: "notify", type: "success" };
const WARNING: HapticCue = { kind: "notify", type: "warning" };

export const SERVE_COIN_DELAY_MS = 140 as const;
export const SERVE_OUTCOME_DELAY_MS = 360 as const;
export const STAR_STAGGER_MS = 120 as const;

const at = (id: SoundId, delayMs = 0): TimedSound => ({ id, delayMs });
const buzz = (cueValue: HapticCue, delayMs = 0): TimedHaptic => ({ cue: cueValue, delayMs });
const cue = (sounds: readonly TimedSound[], ...haptics: TimedHaptic[]): Cue => ({
  sounds,
  haptics,
});
const NONE: Cue = cue([]);

const UI_SOUND = {
  tap: "ui-tap",
  back: "ui-back",
  toggle: "ui-toggle",
  sheet: "ui-open-sheet",
} as const satisfies Record<"tap" | "back" | "toggle" | "sheet", SoundId>;

const STEP_EXTRA = {
  brew: "step-brew",
  steam: "step-steam",
  pour: "step-pour",
  warm: "oven-start",
} as const satisfies Partial<Record<string, SoundId>>;

/** Sounds and haptics for one engine event. Plain navigation never vibrates. */
export function cueForShift(event: ShiftEvent): Cue {
  switch (event.type) {
    case "customer-seated":
      return cue([at("customer-arrive")]);
    case "seat-selected":
      return cue([at("seat-select")]);
    case "step-ok": {
      const extra = (STEP_EXTRA as Record<string, SoundId | undefined>)[event.token];
      return cue(extra ? [at("step-tap"), at(extra)] : [at("step-tap")], buzz(LIGHT));
    }
    case "step-wrong":
      return cue([at("step-wrong")], buzz(WARNING));
    case "oven-ready":
      return cue([at("oven-ready")]);
    case "item-ready":
      return event.component === "book" ? cue([at("book-pick")], buzz(LIGHT)) : NONE;
    case "served": {
      const sounds: TimedSound[] = [at("serve")];
      if (event.payment + event.tip > 0) sounds.push(at("coin", SERVE_COIN_DELAY_MS));
      if (event.outcome === "delighted") sounds.push(at("delighted", SERVE_OUTCOME_DELAY_MS));
      if (event.outcome === "disappointed") {
        sounds.push(at("disappointed", SERVE_OUTCOME_DELAY_MS));
      }
      return cue(
        sounds,
        buzz(MEDIUM),
        ...(event.outcome === "delighted" ? [buzz(SUCCESS, SERVE_OUTCOME_DELAY_MS)] : []),
      );
    }
    case "customer-left":
      return cue([at("customer-left")], buzz(WARNING));
    case "customer-turned-away":
      return cue([at("customer-left")]);
    case "patience-warning":
      return cue([at("patience-warning")]);
    case "shift-closed":
      return cue([at("shift-end")]);
    default:
      return NONE;
  }
}

/** The single table from game events to sounds and haptics. */
export function cueFor(event: FeedbackEvent): Cue {
  switch (event.type) {
    case "ui":
      return cue([at(UI_SOUND[event.ui])]);
    case "shift":
      return cueForShift(event.event);
    case "shift-start":
      return cue([at("shift-start")]);
    case "star": {
      const last = event.index >= event.total;
      const id = `star-${Math.min(3, Math.max(1, event.total))}` as SoundId;
      return cue(last ? [at(id)] : [], buzz(SUCCESS));
    }
    case "scene-open":
      return cue([at("scene-open")]);
    case "choice":
      return cue([at("choice-pick")], buzz(LIGHT));
    case "friendship":
      return cue([at("friendship-up")], buzz(SUCCESS));
    case "ending":
      return cue([at("ending")]);
    case "decor-buy":
      return cue([at("decor-buy")]);
    case "unlock":
      return cue([at("unlock")]);
    case "streak":
      return cue([at("streak-up")]);
  }
}

/** One feedback event per earned star, 120 ms apart. */
export function starFeedback(stars: number): Array<{ delayMs: number; event: FeedbackEvent }> {
  const total = Math.min(3, Math.max(1, Math.floor(stars)));
  return Array.from({ length: total }, (_, i) => ({
    delayMs: i * STAR_STAGGER_MS,
    event: { type: "star", index: i + 1, total } as FeedbackEvent,
  }));
}

/** Progression events that have a sound: friendship levels and unlocks. */
export function progressFeedback(events: readonly ProgressEvent[]): FeedbackEvent[] {
  const out: FeedbackEvent[] = [];
  for (const event of events) {
    if (event.type === "friendship-level") out.push({ type: "friendship" });
    else if (event.type === "unlock" || event.type === "decor-unlocked") {
      out.push({ type: "unlock" });
    }
  }
  return out;
}
