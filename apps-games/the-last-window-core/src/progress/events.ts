import type { DecorId } from "../types";

export type CoinSource = "shift" | "scene" | "lamp" | "streak";
export type UnlockKind = "drink" | "pastry" | "book";

export type ProgressEvent =
  | { type: "coins-gained"; amount: number; source: CoinSource }
  | { type: "friendship-level"; regularId: number; level: number }
  | { type: "scene-eligible"; regularId: number; index: number; sceneId: string }
  | { type: "unlock"; kind: UnlockKind; id: string; day: number }
  | { type: "decor-unlocked"; id: DecorId; day: number }
  | { type: "campaign-complete" };

export function coinsGained(amount: number, source: CoinSource): ProgressEvent[] {
  return amount > 0 ? [{ type: "coins-gained", amount, source }] : [];
}
