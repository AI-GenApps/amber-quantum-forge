import { type Colour, cellAt, type Puzzle, type Tiles } from "@web-games/lantern-loops-core";
import { t } from "../strings";

const TILE_KEYS = {
  10: "cell.straightH",
  5: "cell.straightV",
  3: "cell.cornerNE",
  6: "cell.cornerES",
  12: "cell.cornerSW",
  9: "cell.cornerWN",
} as const;

export function colourName(colour: Colour): string {
  switch (colour) {
    case "amber":
      return t("colour.amber");
    case "rose":
      return t("colour.rose");
    case "jade":
      return t("colour.jade");
    case "azure":
      return t("colour.azure");
    default:
      return t("colour.violet");
  }
}

export function tileName(mask: number): string {
  const key = TILE_KEYS[mask as keyof typeof TILE_KEYS];
  return key === undefined ? t("cell.empty") : t(key);
}

export interface CellState {
  lit: boolean;
  conflict: boolean;
}

/** Spoken label of a board cell, for example "Row 3, column 4, straight horizontal, lit". */
export function cellLabel(
  puzzle: Puzzle,
  tiles: Tiles,
  i: number,
  state: CellState,
  hinted: boolean,
): string {
  const size = puzzle.size;
  const cell = cellAt(puzzle, i);
  const parts: string[] = [
    t("cell.position", { row: Math.floor(i / size) + 1, col: (i % size) + 1 }),
  ];
  if (cell.kind === "stone") {
    parts.push(t("cell.stone", { count: cell.stone ?? 0 }));
    if (state.conflict) parts.push(t("cell.conflict"));
    return parts.join(", ");
  }
  const clue = cell.clue;
  if (clue?.kind === "lantern") parts.push(t("cell.lantern", { colour: colourName(clue.colour) }));
  else if (clue?.kind === "mirror") {
    parts.push(clue.shape === "/" ? t("cell.mirrorSlash") : t("cell.mirrorBackslash"));
  } else if (clue?.kind === "gate") parts.push(t("cell.gate", { colour: colourName(clue.colour) }));
  parts.push(tileName(tiles[i] ?? 0));
  if (cell.fixed !== undefined) parts.push(t("cell.pinned"));
  else if (hinted) parts.push(t("cell.hinted"));
  if (state.lit) parts.push(t("cell.lit"));
  else if (clue?.kind === "lantern") parts.push(t("cell.unlit"));
  if (state.conflict) parts.push(t("cell.conflict"));
  return parts.join(", ");
}

export function conflictAnnouncement(count: number): string {
  if (count === 0) return t("live.clear");
  return count === 1 ? t("live.conflict") : t("live.conflicts", { count });
}
