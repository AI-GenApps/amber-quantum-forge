import { PIECE_COSTS, type PieceKind } from "@web-games/floodplain-dispatch-core";

export type Tool = PieceKind | "erase" | "select";

export const PIECE_ORDER: readonly PieceKind[] = ["canal", "barrier", "pump", "gate", "reservoir"];

export function isPieceTool(tool: Tool): tool is PieceKind {
  return tool !== "erase" && tool !== "select";
}

export function toolCost(tool: Tool): number {
  return isPieceTool(tool) ? PIECE_COSTS[tool] : 0;
}

export function availableTools(pieces: readonly PieceKind[]): Tool[] {
  const ordered = PIECE_ORDER.filter((piece) => pieces.includes(piece));
  return [...ordered, "erase", "select"];
}

export function toolForKey(key: string, tools: readonly Tool[]): Tool | null {
  if (key === "e" || key === "E") return "erase";
  if (key === "s" || key === "S") return "select";
  const digit = Number(key);
  if (Number.isInteger(digit) && digit >= 1 && digit <= tools.length)
    return tools[digit - 1] ?? null;
  return null;
}
