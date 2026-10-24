import type { CaseState, EconomyEvent } from "@web-games/lost-parcel-desk-core";
import { STAMP_FALL_MS, STAMP_STAGGER_MS } from "../motion/timing";
import type { SoundId } from "./slots";

export type FeedbackEvent =
  | { type: "ui"; ui: "tap" | "back" | "toggle" | "sheet" }
  | { type: "parcel-open" }
  | { type: "object-open" }
  | { type: "flip" }
  | { type: "zoom" }
  | { type: "clue-found" }
  | { type: "pin" }
  | { type: "unpin" }
  | { type: "link" }
  | { type: "unlink" }
  | { type: "hint" }
  | { type: "accuse" }
  | { type: "wrong" }
  | { type: "delivery" }
  | { type: "stamp"; index: number; total: number }
  | { type: "ledger" }
  | { type: "map-fill" }
  | { type: "achievement" }
  | { type: "unlock"; what: "chapter" | "theme" }
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

const UI_SOUND = {
  tap: "ui-tap",
  back: "ui-back",
  toggle: "ui-toggle",
  sheet: "ui-open-sheet",
} as const satisfies Record<"tap" | "back" | "toggle" | "sheet", SoundId>;

/**
 * The single table from game events to a sound and a haptic. Light impact on pinning, linking and
 * flipping; warning on a wrong accusation; medium on Accuse; success on a correct delivery, each stamp
 * earned, a chapter unlock and a theme unlock. Plain button taps never vibrate.
 */
export function cueFor(event: FeedbackEvent): Cue {
  switch (event.type) {
    case "ui":
      return { sound: UI_SOUND[event.ui], haptic: null };
    case "parcel-open":
      return { sound: "parcel-open", haptic: null };
    case "object-open":
      return { sound: "object-open", haptic: null };
    case "flip":
      return { sound: "object-flip", haptic: LIGHT };
    case "zoom":
      return { sound: "zoom-toggle", haptic: null };
    case "clue-found":
      return { sound: "clue-found", haptic: null };
    case "pin":
      return { sound: "clue-pin", haptic: LIGHT };
    case "unpin":
      return { sound: "clue-unpin", haptic: null };
    case "link":
      return { sound: "clue-link", haptic: LIGHT };
    case "unlink":
      return { sound: "clue-unlink", haptic: null };
    case "hint":
      return { sound: "hint-use", haptic: null };
    case "accuse":
      return { sound: "accuse", haptic: MEDIUM };
    case "wrong":
      return { sound: "wrong-guess", haptic: WARNING };
    case "delivery":
      return { sound: "stamp-thud", haptic: SUCCESS };
    case "stamp": {
      const last = event.index >= event.total;
      const sound = last ? (`stamp-${Math.min(3, Math.max(1, event.total))}` as SoundId) : null;
      return { sound, haptic: SUCCESS };
    }
    case "ledger":
      return { sound: "ledger-found", haptic: null };
    case "map-fill":
      return { sound: "map-fill", haptic: null };
    case "achievement":
      return { sound: "achievement", haptic: null };
    case "unlock":
      return {
        sound: event.what === "chapter" ? "chapter-unlock" : "theme-unlock",
        haptic: SUCCESS,
      };
    case "streak":
      return { sound: "streak-up", haptic: null };
  }
}

/**
 * Events caused by one change of the open case: new clues found, a pin or an unpin, a link or an unlink,
 * a hint, a wrong accusation. Picking an object up is fired by the screens, since it also counts when the
 * object was seen before. A new case, a restart or a reload is quiet.
 */
export function boardFeedback(prev: CaseState | null, next: CaseState | null): FeedbackEvent[] {
  if (prev === null || next === null || prev.caseId !== next.caseId) return [];
  if (next.seenObjectIds.length < prev.seenObjectIds.length) return [];
  const out: FeedbackEvent[] = [];
  if (next.hintsUsed > prev.hintsUsed) return [{ type: "hint" }];
  if (next.foundClueIds.length > prev.foundClueIds.length) out.push({ type: "clue-found" });
  if (next.pinnedClueIds.length > prev.pinnedClueIds.length) out.push({ type: "pin" });
  if (next.pinnedClueIds.length < prev.pinnedClueIds.length) out.push({ type: "unpin" });
  const key = (link: CaseState["links"][number]): string => `${link.clueId}|${link.personId}`;
  const before = new Map(prev.links.map((link) => [key(link), link.kind]));
  const gained = next.links.some((link) => before.get(key(link)) !== link.kind);
  if (gained) out.push({ type: "link" });
  else if (next.links.length < prev.links.length) out.push({ type: "unlink" });
  if (next.wrongAccusations > prev.wrongAccusations) out.push({ type: "wrong" });
  return out;
}

export interface TimedEvent {
  delayMs: number;
  event: FeedbackEvent;
}

const PROGRESS_GAP_MS = 520;

/**
 * The reveal of a delivered case: the stamp lands, each earned stamp follows 140 ms apart, then the ledger
 * fragment and map place, chapter and theme unlocks and the streak.
 */
export function revealFeedback(
  stamps: number,
  events: readonly EconomyEvent[],
  motion: boolean,
): TimedEvent[] {
  const out: TimedEvent[] = [];
  const landed = motion ? STAMP_FALL_MS : 0;
  out.push({ delayMs: landed, event: { type: "delivery" } });
  const count = Math.max(0, Math.min(3, Math.floor(stamps)));
  for (let i = 1; i <= count; i++) {
    out.push({
      delayMs: landed + i * STAMP_STAGGER_MS,
      event: { type: "stamp", index: i, total: count },
    });
  }
  let at = landed + count * STAMP_STAGGER_MS + PROGRESS_GAP_MS;
  const later = (event: FeedbackEvent): void => {
    out.push({ delayMs: at, event });
    at += PROGRESS_GAP_MS;
  };
  if (events.some((event) => event.type === "ledger-unlocked")) {
    later({ type: "ledger" });
    later({ type: "map-fill" });
  }
  for (const event of events) {
    if (event.type === "chapter-unlocked") later({ type: "unlock", what: "chapter" });
    else if (event.type === "theme-unlocked") later({ type: "unlock", what: "theme" });
    else if (event.type === "streak-extended") later({ type: "streak" });
  }
  return out;
}
