import { describe, expect, it } from "vitest";
import { decodePuzzle, decodeTiles, encodePuzzle, encodeTiles } from "../src/code";
import { puzzleFromSolution, puzzleOf, randomSolution, SPARSE } from "./helpers/fixtures";
import { createRng } from "./helpers/rng";

const ROW5 = ".....";

describe("puzzle code", () => {
  it("encodes tokens as documented", () => {
    const code = "..LaGrLv|M/M\\S3S0.=a|La=3Lb=9.=5.=c.|.....|.....";
    const puzzle = puzzleOf(code);
    expect(puzzle.size).toBe(5);
    expect(puzzle.cells[2]).toEqual({ kind: "open", clue: { kind: "lantern", colour: "amber" } });
    expect(puzzle.cells[3]).toEqual({ kind: "open", clue: { kind: "gate", colour: "rose" } });
    expect(puzzle.cells[4]).toEqual({ kind: "open", clue: { kind: "lantern", colour: "violet" } });
    expect(encodePuzzle(puzzle)).toBe(code);
  });

  it("round-trips 200 seeded random puzzles", () => {
    const rng = createRng(77);
    for (let k = 0; k < 200; k++) {
      const size = 5 + rng.int(5);
      const solution = randomSolution(size, rng, 1 + rng.int(4));
      const puzzle = puzzleFromSolution(solution, rng, SPARSE, `p${k}`);
      const code = encodePuzzle(puzzle);
      const decoded = decodePuzzle(code, puzzle.id);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) {
        expect(decoded.value).toEqual(puzzle);
        expect(encodePuzzle(decoded.value)).toBe(code);
      }
    }
  });

  it("round-trips 200 seeded random boards", () => {
    const rng = createRng(78);
    for (let k = 0; k < 200; k++) {
      const size = 5 + rng.int(5);
      const { tiles } = randomSolution(size, rng, 1 + rng.int(4));
      const code = encodeTiles(tiles);
      expect(code).toHaveLength(size * size);
      const decoded = decodeTiles(code, size);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect(Array.from(decoded.value)).toEqual(Array.from(tiles));
    }
  });

  it("decodes tutorial boards of size 4 only with a tutorial id", () => {
    const code = "....|....|....|....";
    expect(decodePuzzle(code, "tutorial-1").ok).toBe(true);
    expect(decodePuzzle(code, "harbor-01").ok).toBe(false);
  });

  const good = [ROW5, ROW5, ROW5, ROW5, ROW5];
  const rows = (...replace: Array<[number, string]>) => {
    const copy = [...good];
    for (const [i, row] of replace) copy[i] = row;
    return copy.join("|");
  };

  const malformed: Array<[string, string, string]> = [
    ["empty string", "", "empty"],
    ["one row", ROW5, "bad-row-count"],
    ["three rows", [ROW5, ROW5, ROW5].join("|"), "bad-row-count"],
    ["ten rows", Array(10).fill("..........").join("|"), "bad-row-count"],
    ["size 10 within length", Array(10).fill(".").join("|"), "bad-row-count"],
    ["short row", rows([2, "...."]), "row-length"],
    ["long row", rows([2, "......"]), "row-length"],
    ["empty row", rows([0, ""]), "row-length"],
    ["unknown token", rows([1, "..X.."]), "bad-token"],
    ["lowercase token", rows([1, "..l.."]), "bad-token"],
    ["lantern without colour", rows([1, "..L..."]), "bad-token"],
    ["lantern bad colour", rows([1, "..Lx.."]), "bad-token"],
    ["gate bad colour", rows([1, "..Gq.."]), "bad-token"],
    ["mirror bad shape", rows([1, "..Mx.."]), "bad-token"],
    ["mirror missing shape", rows([1, "....M"]), "bad-token"],
    ["stone without number", rows([3, "S...."]), "bad-token"],
    ["stone number 5", rows([3, "S5..."]), "bad-token"],
    ["stone with fixed tile", rows([3, "S1=a..."]), "bad-fixed"],
    ["fixed without digit", rows([0, ".=..."]), "bad-fixed"],
    ["fixed illegal tile 7", rows([0, ".=7..."]), "bad-fixed"],
    ["fixed empty tile 0", rows([0, ".=0..."]), "bad-fixed"],
    ["fixed non-hex", rows([0, ".=g..."]), "bad-fixed"],
    ["illegal anchor on mirror", rows([0, "M/=a...."]), "invalid-puzzle"],
    ["illegal anchor on gate", rows([0, "Gr=3...."]), "invalid-puzzle"],
    ["spaces", rows([0, ". . . . ."]), "bad-token"],
    ["trailing separator", `${rows()}|`, "row-length"],
    ["double separator", rows().replace("|", "||"), "row-length"],
    ["null bytes", rows([0, "..\u0000.."]), "bad-token"],
    ["very long garbage", "x".repeat(5000), "too-long"],
    ["emoji", rows([0, "🏮...."]), "bad-token"],
  ];

  it("has at least 20 malformed cases", () => {
    expect(malformed.length).toBeGreaterThanOrEqual(20);
  });

  it.each(malformed)("rejects %s", (_name, code, expected) => {
    const result = decodePuzzle(code);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(expected);
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it("returns typed errors for non-string input", () => {
    const result = decodePuzzle(42 as unknown as string);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("not-a-string");
  });

  it("rejects malformed tile strings", () => {
    const cases: Array<[string, number, string]> = [
      ["000", 5, "bad-length"],
      ["0".repeat(26), 5, "bad-length"],
      [`${"0".repeat(24)}7`, 5, "bad-tiles"],
      [`${"0".repeat(24)}g`, 5, "bad-tiles"],
      [`${"0".repeat(24)}F`, 5, "bad-tiles"],
      [`${"0".repeat(24)}1`, 5, "bad-tiles"],
    ];
    for (const [code, size, expected] of cases) {
      const result = decodeTiles(code, size);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(expected);
    }
  });
});
