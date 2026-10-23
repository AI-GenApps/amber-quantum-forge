import { type MapDef, STEPS_PER_WEEK } from "@web-games/floodplain-dispatch-core";
import type { Badge } from "../board/model";
import type { FeedbackEvent } from "./events";

const MAX_AUDIBLE_JUMP = STEPS_PER_WEEK;

const badgeKey = (badge: Badge): string => `${badge.x},${badge.y}:${badge.kind}`;

/** Events for badges that appeared since the last frame, at most one per kind. */
export function newBadgeEvents(before: readonly Badge[], after: readonly Badge[]): FeedbackEvent[] {
  const seen = new Set(before.map(badgeKey));
  const fresh = after.filter((badge) => !seen.has(badgeKey(badge)));
  const out: FeedbackEvent[] = [];
  if (fresh.some((b) => b.kind === "supplied" && b.target === "house")) {
    out.push({ type: "badge", badge: "house-supplied" });
  }
  if (fresh.some((b) => b.kind === "irrigated")) {
    out.push({ type: "badge", badge: "field-irrigated" });
  }
  if (fresh.some((b) => b.kind === "flooded")) {
    out.push({ type: "badge", badge: "house-flooded" });
  }
  return out;
}

/** True when playback moved forward over the first week of a surge or a storm tide. */
export function surgeReached(def: MapDef, fromPos: number, toPos: number): boolean {
  if (toPos <= fromPos) return false;
  const fromWeek = Math.floor(fromPos / STEPS_PER_WEEK);
  const toWeek = Math.floor(toPos / STEPS_PER_WEEK);
  return def.events.some(
    (event) =>
      (event.type === "surge" || event.type === "storm-tide") &&
      event.week > fromWeek &&
      event.week <= toWeek,
  );
}

/**
 * Feedback for one playback tick. Only natural forward ticks make sound; scrubbing, the skip button
 * and replays stay quiet.
 */
export function playbackFeedback(
  def: MapDef,
  from: { pos: number; badges: readonly Badge[] },
  to: { pos: number; badges: readonly Badge[] },
): FeedbackEvent[] {
  const jump = to.pos - from.pos;
  if (jump <= 0 || jump > MAX_AUDIBLE_JUMP) return [];
  const out: FeedbackEvent[] = [];
  if (surgeReached(def, from.pos, to.pos)) out.push({ type: "surge" });
  out.push(...newBadgeEvents(from.badges, to.badges));
  return out;
}

/** Water volume from how much of the board is wet, 0 for a dry board up to 1. */
export function flowLevel(depths: ArrayLike<number>, mapCells: number): number {
  if (mapCells <= 0) return 0;
  let wet = 0;
  for (let i = 0; i < depths.length; i++) if ((depths[i] ?? 0) > 0) wet += 1;
  return Math.min(1, wet / (mapCells * 0.25));
}
