import type { Tiles } from "./board";
import { analyseLoops, type Component, stepCell, tileAt } from "./loops";
import { cellAt, type Puzzle } from "./puzzle";
import { DIRS, isLegalTile, isStraight, MIRROR_CORNERS } from "./tile";

export type ViolationKind =
  | "loose-end"
  | "lantern-dark"
  | "dark-loop"
  | "stone-count"
  | "mirror-shape"
  | "gate-shape"
  | "colour-mix"
  | "gate-colour"
  | "fixed-changed"
  | "invalid-tile";

/** conflict: adding tiles cannot repair it. pending: still fixable by adding tiles. */
export type Severity = "conflict" | "pending";

export interface Violation {
  readonly kind: ViolationKind;
  readonly cells: number[];
  readonly severity: Severity;
}

export interface Evaluation {
  readonly solved: boolean;
  readonly violations: Violation[];
  /** True when at least one violation is still fixable by adding tiles. */
  readonly incomplete: boolean;
}

function checkCells(puzzle: Puzzle, tiles: Tiles, out: Violation[]): void {
  const total = puzzle.size * puzzle.size;
  for (let i = 0; i < total; i++) {
    const cell = cellAt(puzzle, i);
    const raw = tiles[i] ?? 0;
    const add = (kind: ViolationKind, severity: Severity) =>
      out.push({ kind, cells: [i], severity });
    if (!isLegalTile(raw) || (cell.kind === "stone" && raw !== 0)) {
      add("invalid-tile", "conflict");
      continue;
    }
    if (cell.kind === "stone") continue;
    if (cell.fixed !== undefined && raw !== cell.fixed) add("fixed-changed", "conflict");
    const clue = cell.clue;
    if (clue === undefined) continue;
    if (clue.kind === "lantern") {
      if (raw === 0) add("lantern-dark", "pending");
    } else if (clue.kind === "mirror") {
      if (raw === 0) add("mirror-shape", "pending");
      else if (!(MIRROR_CORNERS[clue.shape] as readonly number[]).includes(raw)) {
        add("mirror-shape", "conflict");
      }
    } else if (raw === 0) {
      add("gate-shape", "pending");
    } else if (!isStraight(raw)) {
      add("gate-shape", "conflict");
    }
  }
}

function checkStones(puzzle: Puzzle, tiles: Tiles, out: Violation[]): void {
  const total = puzzle.size * puzzle.size;
  for (let i = 0; i < total; i++) {
    const cell = cellAt(puzzle, i);
    if (cell.kind !== "stone") continue;
    const target = cell.stone ?? 0;
    let lit = 0;
    let room = 0;
    for (const dir of DIRS) {
      const j = stepCell(puzzle.size, i, dir);
      if (j < 0 || cellAt(puzzle, j).kind === "stone") continue;
      if (tileAt(puzzle, tiles, j) !== 0) lit += 1;
      else room += 1;
    }
    if (lit === target) continue;
    const reachable = lit < target && lit + room >= target;
    out.push({ kind: "stone-count", cells: [i], severity: reachable ? "pending" : "conflict" });
  }
}

function checkComponent(puzzle: Puzzle, part: Component, closed: boolean, out: Violation[]): void {
  if (closed && part.lanterns.length === 0) {
    out.push({ kind: "dark-loop", cells: part.cells, severity: "conflict" });
    return;
  }
  if (part.colour === "mixed") {
    out.push({ kind: "colour-mix", cells: part.lanterns, severity: "conflict" });
  }
  const gateColours = new Set<string>();
  for (const g of part.gates) {
    const clue = cellAt(puzzle, g).clue;
    if (clue?.kind === "gate") gateColours.add(clue.colour);
  }
  for (const g of part.gates) {
    const clue = cellAt(puzzle, g).clue;
    if (clue?.kind !== "gate") continue;
    const wrongLantern = part.colours.some((c) => c !== clue.colour);
    if (wrongLantern || gateColours.size > 1) {
      out.push({ kind: "gate-colour", cells: [g], severity: "conflict" });
    }
  }
}

export function evaluate(puzzle: Puzzle, tiles: Tiles): Evaluation {
  const violations: Violation[] = [];
  checkCells(puzzle, tiles, violations);
  checkStones(puzzle, tiles, violations);
  const analysis = analyseLoops(puzzle, tiles);
  for (const end of analysis.looseEnds) {
    const severity: Severity = end.facing === "empty" ? "pending" : "conflict";
    violations.push({ kind: "loose-end", cells: [end.cell], severity });
  }
  for (const loop of analysis.loops) checkComponent(puzzle, loop, true, violations);
  for (const chain of analysis.chains) checkComponent(puzzle, chain, false, violations);
  return {
    solved: violations.length === 0,
    violations,
    incomplete: violations.some((v) => v.severity === "pending"),
  };
}

/** Live-feedback items: unrepairable violations, without loose ends (drawn as ribbon ends). */
export function conflicts(puzzle: Puzzle, tiles: Tiles): Violation[] {
  return evaluate(puzzle, tiles).violations.filter(
    (v) => v.severity === "conflict" && v.kind !== "loose-end",
  );
}
