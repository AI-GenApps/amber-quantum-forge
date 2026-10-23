import { type Tool, toolForKey } from "./tools";

export type KeyAction =
  | { type: "move"; dx: number; dy: number }
  | { type: "activate" }
  | { type: "remove" }
  | { type: "rotate" }
  | { type: "run" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "zoom" }
  | { type: "hint" }
  | { type: "tool"; tool: Tool };

export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function keyAction(event: KeyLike, tools: readonly Tool[]): KeyAction | null {
  const command = event.ctrlKey === true || event.metaKey === true;
  switch (event.key) {
    case "ArrowUp":
      return { type: "move", dx: 0, dy: -1 };
    case "ArrowDown":
      return { type: "move", dx: 0, dy: 1 };
    case "ArrowLeft":
      return { type: "move", dx: -1, dy: 0 };
    case "ArrowRight":
      return { type: "move", dx: 1, dy: 0 };
    case "Enter":
      return { type: "activate" };
    case " ":
    case "Spacebar":
      return { type: "run" };
    case "Backspace":
    case "Delete":
      return { type: "remove" };
    case "+":
    case "=":
      return { type: "zoom" };
    case "y":
    case "Y":
      return command ? { type: "redo" } : null;
    case "z":
    case "Z":
      if (!command) return null;
      return event.shiftKey ? { type: "redo" } : { type: "undo" };
    case "r":
    case "R":
      return { type: "rotate" };
    case "h":
    case "H":
      return { type: "hint" };
    default: {
      if (command) return null;
      const tool = toolForKey(event.key, tools);
      return tool ? { type: "tool", tool } : null;
    }
  }
}
