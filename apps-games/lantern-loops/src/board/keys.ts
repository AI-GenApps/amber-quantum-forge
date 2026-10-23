import type { Brush } from "@web-games/lantern-loops-core";

export type KeyAction =
  | { type: "move"; cell: number }
  | { type: "apply" }
  | { type: "brush"; brush: Brush }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "hint" }
  | { type: "pause" };

/** Maps a keyboard key to a board action: arrows move the focus ring, Space or Enter applies the brush. */
export function interpretKey(key: string, focus: number, size: number): KeyAction | null {
  const row = Math.floor(focus / size);
  const col = focus % size;
  switch (key) {
    case "ArrowUp":
      return { type: "move", cell: Math.max(0, row - 1) * size + col };
    case "ArrowDown":
      return { type: "move", cell: Math.min(size - 1, row + 1) * size + col };
    case "ArrowLeft":
      return { type: "move", cell: row * size + Math.max(0, col - 1) };
    case "ArrowRight":
      return { type: "move", cell: row * size + Math.min(size - 1, col + 1) };
    case " ":
    case "Spacebar":
    case "Enter":
      return { type: "apply" };
    case "Escape":
      return { type: "pause" };
    default:
      break;
  }
  switch (key.toLowerCase()) {
    case "s":
      return { type: "brush", brush: "straight" };
    case "c":
      return { type: "brush", brush: "corner" };
    case "e":
      return { type: "brush", brush: "erase" };
    case "z":
      return { type: "undo" };
    case "y":
      return { type: "redo" };
    case "h":
      return { type: "hint" };
    default:
      return null;
  }
}
