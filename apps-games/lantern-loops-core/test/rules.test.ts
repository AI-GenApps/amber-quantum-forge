import { describe, expect, it } from "vitest";
import { emptyTiles } from "../src/board";
import { conflicts, evaluate, type ViolationKind } from "../src/rules";
import { grid, tilesFrom } from "./helpers/fixtures";

const B = ". . . . .";
const NONE = [".....", ".....", ".....", ".....", "....."];
const RING = ["┌┐...", "└┘...", ".....", ".....", "....."];
const TALL = ["┌┐...", "││...", "└┘...", ".....", "....."];
const BIG = ["┌─┐..", "│.│..", "└─┘..", ".....", "....."];
const TWO = ["┌┐...", "└┘...", ".....", "...┌┐", "...└┘"];

/** Five puzzle rows; rows not given are blank. */
function p(rows: Record<number, string> = {}): string[] {
  return [0, 1, 2, 3, 4].map((r) => rows[r] ?? B);
}

interface Case {
  name: string;
  puzzle: string[];
  tiles: string[];
  /** Exact set of violation kinds; empty means solved. */
  kinds: ViolationKind[];
  conflict?: boolean;
  pending?: boolean;
}

const solvedCases: Case[] = [
  { name: "blank board without clues", puzzle: p(), tiles: NONE, kinds: [] },
  { name: "lantern only", puzzle: p({ 0: "La . . . ." }), tiles: RING, kinds: [] },
  { name: "lantern on a straight tile", puzzle: p({ 0: ". La . . ." }), tiles: BIG, kinds: [] },
  {
    name: "stones 1 and 0, edge cells included",
    puzzle: p({ 0: "La . S1 . .", 2: "S1 S1 . . .", 3: ". . . S0 .", 4: ". . . . S0" }),
    tiles: RING,
    kinds: [],
  },
  {
    name: "stone in the corner counts only in-board neighbours",
    puzzle: p({ 0: "S1 La . . ." }),
    tiles: [".┌┐..", ".└┘..", ".....", ".....", "....."],
    kinds: [],
  },
  {
    name: "stone 4 inside a ring",
    puzzle: p({ 0: "La . . . .", 1: ". S4 . . ." }),
    tiles: BIG,
    kinds: [],
  },
  {
    name: "stone 2 between two loops",
    puzzle: p({ 0: "Lr . S2 Lj ." }),
    tiles: ["┌┐.┌┐", "└┘.└┘", ".....", ".....", "....."],
    kinds: [],
  },
  {
    name: "mirrors of both slashes with all four corners",
    puzzle: p({ 0: "M/ La M\\ . .", 2: "M\\ . M/ . ." }),
    tiles: BIG,
    kinds: [],
  },
  { name: "slash mirror on corner 6", puzzle: p({ 0: "M/ La . . ." }), tiles: BIG, kinds: [] },
  {
    name: "backslash mirror on corner 12",
    puzzle: p({ 0: ". La M\\ . ." }),
    tiles: BIG,
    kinds: [],
  },
  {
    name: "backslash mirror on corner 3",
    puzzle: p({ 0: ". La . . .", 2: "M\\ . . . ." }),
    tiles: BIG,
    kinds: [],
  },
  {
    name: "slash mirror on corner 9",
    puzzle: p({ 0: ". La . . .", 2: ". . M/ . ." }),
    tiles: BIG,
    kinds: [],
  },
  {
    name: "gate with matching colour",
    puzzle: p({ 0: "Lr . . . .", 1: ". Gr . . ." }),
    tiles: TALL,
    kinds: [],
  },
  {
    name: "gate on a left-hand straight",
    puzzle: p({ 0: "Lj . . . .", 1: "Gj . . . ." }),
    tiles: TALL,
    kinds: [],
  },
  { name: "gate on a horizontal straight", puzzle: p({ 0: "Lb Gb . . ." }), tiles: BIG, kinds: [] },
  {
    name: "two loops of one colour",
    puzzle: p({ 0: "La . . . .", 3: ". . . La ." }),
    tiles: TWO,
    kinds: [],
  },
  {
    name: "two loops of different colours",
    puzzle: p({ 0: "Lr . . . .", 3: ". . . Lj ." }),
    tiles: TWO,
    kinds: [],
  },
  {
    name: "adjacent loops side by side",
    puzzle: p({ 0: "Lr . Lj . ." }),
    tiles: ["┌┐┌┐.", "└┘└┘.", ".....", ".....", "....."],
    kinds: [],
  },
  {
    name: "nested loops",
    puzzle: p({ 0: "La . . . .", 1: ". La . . ." }),
    tiles: ["┌───┐", "│┌─┐│", "││.││", "│└─┘│", "└───┘"],
    kinds: [],
  },
  { name: "fixed tile in place", puzzle: p({ 0: "La=6 . . . ." }), tiles: RING, kinds: [] },
  { name: "fixed corner under a mirror", puzzle: p({ 0: "M/=6 La . . ." }), tiles: BIG, kinds: [] },
];

const failCases: Case[] = [
  {
    name: "empty board with every clue kind",
    puzzle: p({ 0: "La S1 M/ Gr ." }),
    tiles: NONE,
    kinds: ["lantern-dark", "stone-count", "mirror-shape", "gate-shape"],
    pending: true,
    conflict: false,
  },
  {
    name: "loose end at the board edge",
    puzzle: p(),
    tiles: ["┘....", ".....", ".....", ".....", "....."],
    kinds: ["loose-end"],
    conflict: true,
    pending: false,
  },
  {
    name: "loose end facing a stone",
    puzzle: p({ 0: ". S1 . . ." }),
    tiles: ["┌....", ".....", ".....", ".....", "....."],
    kinds: ["loose-end"],
    conflict: true,
    pending: true,
  },
  {
    name: "loose end facing a tile without the opening",
    puzzle: p(),
    tiles: ["─│...", ".....", ".....", ".....", "....."],
    kinds: ["loose-end"],
    conflict: true,
  },
  {
    name: "lantern left empty",
    puzzle: p({ 0: "La . . . .", 4: ". . . . La" }),
    tiles: RING,
    kinds: ["lantern-dark"],
    pending: true,
    conflict: false,
  },
  {
    name: "closed loop with no lantern",
    puzzle: p(),
    tiles: RING,
    kinds: ["dark-loop"],
    conflict: true,
  },
  {
    name: "dark loop beside a lit loop",
    puzzle: p({ 0: "La . . . ." }),
    tiles: TWO,
    kinds: ["dark-loop"],
    conflict: true,
  },
  {
    name: "stone count too high",
    puzzle: p({ 0: "La . S0 . ." }),
    tiles: RING,
    kinds: ["stone-count"],
    conflict: true,
  },
  {
    name: "stone count too low but fixable",
    puzzle: p({ 0: "La . S2 . ." }),
    tiles: RING,
    kinds: ["stone-count"],
    pending: true,
    conflict: false,
  },
  {
    name: "stone count too low and unreachable",
    puzzle: p({ 0: "S3 La . . ." }),
    tiles: [".┌┐..", ".└┘..", ".....", ".....", "....."],
    kinds: ["stone-count"],
    conflict: true,
  },
  {
    name: "mirror holding a straight tile",
    puzzle: p({ 0: "La M/ . . ." }),
    tiles: BIG,
    kinds: ["mirror-shape"],
    conflict: true,
  },
  {
    name: "slash mirror on the wrong corner",
    puzzle: p({ 0: "La . M/ . ." }),
    tiles: BIG,
    kinds: ["mirror-shape"],
    conflict: true,
  },
  {
    name: "backslash mirror on the wrong corner",
    puzzle: p({ 0: "M\\ La . . ." }),
    tiles: BIG,
    kinds: ["mirror-shape"],
    conflict: true,
  },
  {
    name: "empty mirror is pending",
    puzzle: p({ 0: "La . . . .", 4: ". . M/ . ." }),
    tiles: RING,
    kinds: ["mirror-shape"],
    pending: true,
    conflict: false,
  },
  {
    name: "gate on a corner tile",
    puzzle: p({ 0: "Gr Lr . . ." }),
    tiles: BIG,
    kinds: ["gate-shape"],
    conflict: true,
  },
  {
    name: "empty gate is pending",
    puzzle: p({ 0: "La . . . .", 4: ". . Ga . ." }),
    tiles: RING,
    kinds: ["gate-shape"],
    pending: true,
    conflict: false,
  },
  {
    name: "gate crossed by a loop of another colour",
    puzzle: p({ 0: "Lr . . . .", 1: ". Ga . . ." }),
    tiles: TALL,
    kinds: ["gate-colour"],
    conflict: true,
  },
  {
    name: "two lantern colours on one loop",
    puzzle: p({ 0: "Lr Lj . . ." }),
    tiles: RING,
    kinds: ["colour-mix"],
    conflict: true,
  },
  {
    name: "mixed loop through a gate",
    puzzle: p({ 0: "Lr Lj . . .", 1: ". Gr . . ." }),
    tiles: TALL,
    kinds: ["colour-mix", "gate-colour"],
    conflict: true,
  },
  {
    name: "fixed tile moved",
    puzzle: p({ 0: "La=3 . . . ." }),
    tiles: RING,
    kinds: ["fixed-changed"],
    conflict: true,
  },
  {
    name: "fixed tile erased",
    puzzle: p({ 0: "La=6 . . . ." }),
    tiles: NONE,
    kinds: ["fixed-changed", "lantern-dark"],
    conflict: true,
    pending: true,
  },
  {
    name: "tile on a stone",
    puzzle: p({ 0: "S0 . . . ." }),
    tiles: ["─....", ".....", ".....", ".....", "....."],
    kinds: ["invalid-tile"],
    conflict: true,
  },
  {
    name: "open chain joining two colours",
    puzzle: p({ 0: ". Lr . Lj ." }),
    tiles: [".───.", ".....", ".....", ".....", "....."],
    kinds: ["loose-end", "colour-mix"],
    conflict: true,
    pending: true,
  },
  {
    name: "open chain through a gate of another colour",
    puzzle: p({ 0: ". Lr Ga . ." }),
    tiles: [".───.", ".....", ".....", ".....", "....."],
    kinds: ["loose-end", "gate-colour"],
    conflict: true,
  },
  {
    name: "open chain through two gate colours",
    puzzle: p({ 0: ". Gr Ga . ." }),
    tiles: [".───.", ".....", ".....", ".....", "....."],
    kinds: ["loose-end", "gate-colour"],
    conflict: true,
  },
  {
    name: "ring missing one tile",
    puzzle: p({ 0: "La . . . ." }),
    tiles: ["┌┐...", "└....", ".....", ".....", "....."],
    kinds: ["loose-end"],
    pending: true,
    conflict: false,
  },
];

function run(c: Case) {
  const puzzle = grid(c.puzzle);
  return {
    puzzle,
    tiles: tilesFrom(c.tiles),
    result: evaluate(grid(c.puzzle), tilesFrom(c.tiles)),
  };
}

function kindsOf(c: Case): ViolationKind[] {
  return [...new Set(run(c).result.violations.map((v) => v.kind))].sort();
}

describe("evaluate: solved fixtures", () => {
  it.each(solvedCases)("$name", (c) => {
    const { result, puzzle, tiles } = run(c);
    expect(result.violations).toEqual([]);
    expect(result.solved).toBe(true);
    expect(result.incomplete).toBe(false);
    expect(conflicts(puzzle, tiles)).toEqual([]);
  });
});

describe("evaluate: failing fixtures", () => {
  it.each(failCases)("$name", (c) => {
    const { result } = run(c);
    expect(result.solved).toBe(false);
    expect(kindsOf(c)).toEqual([...c.kinds].sort());
    const severities = new Set(result.violations.map((v) => v.severity));
    if (c.conflict !== undefined) expect(severities.has("conflict")).toBe(c.conflict);
    if (c.pending !== undefined) expect(severities.has("pending")).toBe(c.pending);
    expect(result.incomplete).toBe(severities.has("pending"));
  });

  it("has at least 40 table-driven cases", () => {
    expect(solvedCases.length + failCases.length).toBeGreaterThanOrEqual(40);
  });

  it("rejects an illegal mask value", () => {
    const puzzle = grid(p());
    const tiles = new Uint8Array(25);
    tiles[0] = 7;
    const result = evaluate(puzzle, tiles);
    expect(result.violations).toEqual([{ kind: "invalid-tile", cells: [0], severity: "conflict" }]);
  });

  it("starts from fixed tiles only: an unsolved board has only pending violations", () => {
    const puzzle = grid(p({ 0: "La . . . .", 1: ". S2 M/ . ." }));
    const result = evaluate(puzzle, emptyTiles(puzzle));
    expect(result.solved).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.every((v) => v.severity === "pending")).toBe(true);
    expect(result.incomplete).toBe(true);
  });

  it("names the cells involved", () => {
    const stone = run({ name: "", puzzle: p({ 0: "La . S0 . ." }), tiles: RING, kinds: [] });
    expect(stone.result.violations).toEqual([
      { kind: "stone-count", cells: [2], severity: "conflict" },
    ]);
    const gate = run({
      name: "",
      puzzle: p({ 0: "Lr . . . .", 1: ". Ga . . ." }),
      tiles: TALL,
      kinds: [],
    });
    expect(gate.result.violations).toEqual([
      { kind: "gate-colour", cells: [6], severity: "conflict" },
    ]);
    const dark = run({ name: "", puzzle: p(), tiles: RING, kinds: [] });
    expect([...(dark.result.violations[0]?.cells ?? [])].sort((a, b) => a - b)).toEqual([
      0, 1, 5, 6,
    ]);
  });
});

function named(name: string): Case {
  const found = failCases.find((c) => c.name === name);
  if (!found) throw new Error(`no case ${name}`);
  return found;
}

describe("conflicts", () => {
  it("returns unrepairable items for live feedback", () => {
    const cases: Array<[string, Case, ViolationKind]> = [
      ["stone exceeded", named("stone count too high"), "stone-count"],
      ["stone unreachable", named("stone count too low and unreachable"), "stone-count"],
      ["dark loop", named("closed loop with no lantern"), "dark-loop"],
      ["mixed colours", named("two lantern colours on one loop"), "colour-mix"],
      ["wrong mirror", named("mirror holding a straight tile"), "mirror-shape"],
      ["wrong gate shape", named("gate on a corner tile"), "gate-shape"],
      ["wrong gate colour", named("gate crossed by a loop of another colour"), "gate-colour"],
    ];
    for (const [, c, kind] of cases) {
      const { puzzle, tiles } = run(c);
      const found = conflicts(puzzle, tiles);
      expect(found.length).toBeGreaterThan(0);
      expect(found.every((v) => v.severity === "conflict")).toBe(true);
      expect(found.map((v) => v.kind)).toContain(kind);
    }
  });

  it("ignores pending items and loose ends", () => {
    const names = [
      "empty board with every clue kind",
      "loose end at the board edge",
      "lantern left empty",
      "stone count too low but fixable",
      "ring missing one tile",
    ];
    for (const c of names.map(named)) {
      const { puzzle, tiles } = run(c);
      expect(conflicts(puzzle, tiles)).toEqual([]);
    }
  });
});
