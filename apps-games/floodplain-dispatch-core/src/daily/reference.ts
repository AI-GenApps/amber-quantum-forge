import { createBoard } from "../board";
import { runSeason } from "../simulate";
import type { MapDef, Placement } from "../types";
import { neighborCells } from "./grid";
import { shortfall } from "./penalty";

export interface Trimmed {
  placements: Placement[];
  sims: number;
}

function isLeaf(def: MapDef, placements: readonly Placement[], index: number): boolean {
  const board = createBoard(def);
  const piece = placements[index];
  if (!piece) return false;
  const cell = piece.y * board.width + piece.x;
  const network = new Set<number>(board.inletCells);
  placements.forEach((other, at) => {
    if (at !== index) network.add(other.y * board.width + other.x);
  });
  return neighborCells(board, cell).filter((next) => network.has(next)).length <= 1;
}

export function trimLeaves(def: MapDef, start: readonly Placement[], maxPasses = 3): Trimmed {
  let placements = start.map((p) => ({ ...p }));
  let sims = 0;
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (let i = placements.length - 1; i >= 0; i--) {
      if (!isLeaf(def, placements, i)) continue;
      const trial = placements.filter((_, at) => at !== i);
      sims++;
      if (shortfall(runSeason(def, trial).metrics).penalty === 0) {
        placements = trial;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { placements, sims };
}
