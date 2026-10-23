import { diffLoops, type Puzzle, starsForHints } from "@web-games/lantern-loops-core";
import { winSoundFor } from "../audio/sounds";
import type { WinSummary } from "../state/finish";
import type { SessionState } from "../state/session";
import type { FeedbackEvent } from "./events";

type Snapshot = Pick<SessionState, "tiles" | "evaluation" | "cause">;

interface TileChanges {
  placed: number[];
  rotated: number[];
  erased: number[];
}

function tileChanges(puzzle: Puzzle, before: Snapshot, after: Snapshot): TileChanges {
  const out: TileChanges = { placed: [], rotated: [], erased: [] };
  for (let i = 0; i < after.tiles.length; i++) {
    const was = before.tiles[i] ?? 0;
    const now = after.tiles[i] ?? 0;
    if (was === now || puzzle.cells[i]?.kind === "stone") continue;
    if (was === 0) out.placed.push(i);
    else if (now === 0) out.erased.push(i);
    else out.rotated.push(i);
  }
  return out;
}

function conflictKeys(state: Snapshot): Set<string> {
  const keys = new Set<string>();
  for (const violation of state.evaluation.violations) {
    if (violation.severity !== "conflict" || violation.kind === "loose-end") continue;
    keys.add(`${violation.kind}:${violation.cells.join(",")}`);
  }
  return keys;
}

export interface DeriveOptions {
  /** Conflicts are only announced when the player has the conflict display on. */
  showConflicts: boolean;
}

/**
 * Turns one session change into feedback events. The change `cause` decides the family: undo and
 * redo are one `undo`, a restart is one `tile-erase`, a hint is one `hint`; drawing and tapping
 * report place, rotate or erase, plus loop and lantern events, plus a conflict when a new one appears.
 */
export function deriveEvents(
  puzzle: Puzzle,
  before: Snapshot,
  after: Snapshot,
  options: DeriveOptions,
): FeedbackEvent[] {
  switch (after.cause) {
    case "brush":
    case "cancel":
    case "drag-end":
      return [];
    case "undo":
    case "redo":
      return [{ id: "undo" }];
    case "restart":
      return [{ id: "tile-erase" }];
    default:
      break;
  }
  const out: FeedbackEvent[] = [];
  if (after.cause === "hint") {
    out.push({ id: "hint" });
  } else {
    const changes = tileChanges(puzzle, before, after);
    if (changes.placed.length > 0) out.push({ id: "tile-place", cells: changes.placed });
    else if (changes.rotated.length > 0) out.push({ id: "tile-rotate", cells: changes.rotated });
    else if (changes.erased.length > 0) out.push({ id: "tile-erase", cells: changes.erased });
  }
  const diff = diffLoops(puzzle, before.tiles, after.tiles);
  const lit = diff.closed.filter((loop) => loop.lanterns.length > 0);
  if (lit.length > 0) out.push({ id: "loop-close", loops: lit.map((loop) => [...loop.cells]) });
  if (diff.lit.length > 0) out.push({ id: "lantern-lit", cells: diff.lit });
  if (after.cause !== "hint" && options.showConflicts) {
    const known = conflictKeys(before);
    const fresh = [...conflictKeys(after)].filter((key) => !known.has(key));
    if (fresh.length > 0) out.push({ id: "conflict" });
  }
  return out;
}

/** The win sound for a solved board, from the hints used. */
export function winEvent(hintCount: number): FeedbackEvent {
  return { id: winSoundFor(starsForHints(hintCount)) };
}

/** Events that follow a recorded solve: daily done, streak freeze used, chapters unlocked. */
export function finishEvents(summary: WinSummary): FeedbackEvent[] {
  const out: FeedbackEvent[] = [];
  if (summary.kind === "daily") out.push({ id: "daily-done" });
  if (summary.events.some((event) => event.kind === "freeze-used")) out.push({ id: "freeze-used" });
  if (summary.chaptersUnlocked.length > 0) out.push({ id: "chapter-unlock" });
  return out;
}
