import {
  analyseLoops,
  type Colour,
  type Evaluation,
  type LooseEnd,
  type Puzzle,
  type Tiles,
  type ViolationKind,
} from "@web-games/lantern-loops-core";

export interface BoardMarks {
  /** Cells on a closed loop that carries lanterns, with the loop colour. */
  lit: Map<number, Colour>;
  /** Cells of closed loops without a lantern (drawn dim). */
  dark: Set<number>;
  /** Cells that get a soft ring (stone, mirror, gate and colour conflicts). */
  conflicts: Set<number>;
  looseEnds: Map<number, LooseEnd[]>;
  /** Number of unrepairable problems, for the live region. */
  conflictCount: number;
  /** Closed loops with lanterns, cell lists in path order (for the win sequence). */
  litLoops: number[][];
}

const RING_KINDS: ReadonlySet<ViolationKind> = new Set([
  "stone-count",
  "mirror-shape",
  "gate-shape",
  "colour-mix",
  "gate-colour",
]);

export function computeMarks(
  puzzle: Puzzle,
  tiles: Tiles,
  evaluation: Evaluation,
  showConflicts: boolean,
): BoardMarks {
  const analysis = analyseLoops(puzzle, tiles);
  const lit = new Map<number, Colour>();
  const litLoops: number[][] = [];
  for (const loop of analysis.loops) {
    if (loop.lanterns.length === 0 || loop.colour === null || loop.colour === "mixed") continue;
    litLoops.push([...loop.cells]);
    for (const cell of loop.cells) lit.set(cell, loop.colour);
  }
  const marks: BoardMarks = {
    lit,
    dark: new Set(),
    conflicts: new Set(),
    looseEnds: new Map(),
    conflictCount: 0,
    litLoops,
  };
  if (!showConflicts) return marks;
  for (const violation of evaluation.violations) {
    if (violation.severity !== "conflict" || violation.kind === "loose-end") continue;
    marks.conflictCount += 1;
    const target = violation.kind === "dark-loop" ? marks.dark : marks.conflicts;
    if (violation.kind !== "dark-loop" && !RING_KINDS.has(violation.kind)) continue;
    for (const cell of violation.cells) target.add(cell);
  }
  for (const end of analysis.looseEnds) {
    const list = marks.looseEnds.get(end.cell) ?? [];
    list.push(end);
    marks.looseEnds.set(end.cell, list);
  }
  return marks;
}
