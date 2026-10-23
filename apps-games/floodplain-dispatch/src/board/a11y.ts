import { budgetLeft } from "@web-games/floodplain-dispatch-core";
import { dirName, kindName, pieceName } from "../labels";
import { t } from "../strings";
import type { BoardView } from "./model";

export function describeCell(view: BoardView, x: number, y: number): string {
  const index = y * view.board.width + x;
  const kind = view.board.kinds[index] ?? "land";
  const height = view.board.heights[index] ?? 0;
  const piece = view.pieceAt.get(index);
  const parts: string[] = [];
  if (piece) {
    const facing = piece.kind === "pump" && piece.dir ? ` ${dirName(piece.dir)}` : "";
    parts.push(`${pieceName(piece.kind)}${facing}`);
  } else if (kind === "land") {
    parts.push(t("summaryEmpty"));
  } else {
    parts.push(kindName(kind));
  }
  parts.push(t("summaryHeight", { height }));
  const depth = view.depths[index] ?? 0;
  if (depth > 0) parts.push(`water ${depth}`);
  const badge = view.badges.find((b) => b.x === x && b.y === y);
  if (badge) parts.push(badge.kind);
  return t("summaryCursor", { column: x + 1, row: y + 1, what: parts.join(", ") });
}

export function boardSummary(view: BoardView): string {
  const left = budgetLeft(view.def, view.placements);
  const base = t("summaryBoard", {
    cols: view.board.width,
    rows: view.board.height,
    houses: view.board.houseCells.length,
    fields: view.board.fieldCells.length,
    pieces: view.placements.length,
    left,
    budget: view.def.budget,
  });
  const cursor = view.cursor ? ` ${describeCell(view, view.cursor.x, view.cursor.y)}` : "";
  return `${base}${cursor}`;
}

export function playbackSummary(
  week: number,
  weeks: number,
  counts: { supplied: number; flooded: number; irrigated: number },
): string {
  return t("summaryPlayback", {
    week: Math.min(week + 1, weeks),
    weeks,
    supplied: counts.supplied,
    flooded: counts.flooded,
    irrigated: counts.irrigated,
  });
}
