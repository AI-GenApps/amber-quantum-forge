import type { Slot } from "@web-games/dress-rehearsal-core";

export interface KeyInfo {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

export interface KeyTarget {
  /** Piece id when focus is on a tray card. */
  readonly pieceId?: string;
  /** Slot when focus is on a board slot. */
  readonly slot?: Slot;
}

export type KeyIntent =
  | { readonly type: "undo" }
  | { readonly type: "redo" }
  | { readonly type: "place-piece"; readonly pieceId: string }
  | { readonly type: "tap-slot"; readonly slot: Slot }
  | { readonly type: "remove-slot"; readonly slot: Slot }
  | { readonly type: "move"; readonly delta: -1 | 1 | "first" | "last" };

/**
 * Maps a key press on the styling board to an intent. Space on buttons keeps its native click
 * (select a piece, tap a slot); Enter is the direct path, so keyboard play never needs a pointer.
 */
export function keyIntent(info: KeyInfo, target: KeyTarget): KeyIntent | null {
  const modifier = info.ctrlKey || info.metaKey;
  const key = info.key.length === 1 ? info.key.toLowerCase() : info.key;
  if (modifier && key === "z") return info.shiftKey ? { type: "redo" } : { type: "undo" };
  if (modifier && key === "y") return { type: "redo" };
  if (modifier) return null;
  if (target.pieceId !== undefined) {
    switch (info.key) {
      case "Enter":
        return { type: "place-piece", pieceId: target.pieceId };
      case "ArrowRight":
      case "ArrowDown":
        return { type: "move", delta: 1 };
      case "ArrowLeft":
      case "ArrowUp":
        return { type: "move", delta: -1 };
      case "Home":
        return { type: "move", delta: "first" };
      case "End":
        return { type: "move", delta: "last" };
      default:
        return null;
    }
  }
  if (target.slot !== undefined) {
    if (info.key === "Enter") return { type: "tap-slot", slot: target.slot };
    if (info.key === "Backspace" || info.key === "Delete") {
      return { type: "remove-slot", slot: target.slot };
    }
  }
  return null;
}
