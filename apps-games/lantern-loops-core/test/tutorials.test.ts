import { describe, expect, it } from "vitest";
import { emptyTiles, equalTiles } from "../src/board";
import { encodePuzzle } from "../src/code";
import { puzzleFromRecord, solutionFromRecord } from "../src/content/analyse";
import { CAMPAIGN } from "../src/content/chapters";
import { getTutorial, TUTORIALS } from "../src/content/tutorials";
import { validateTutorials } from "../src/content/validate";
import { isTutorialId, validatePuzzleShape } from "../src/puzzle";
import { evaluate } from "../src/rules";
import { solve } from "../src/solver";

describe("tutorial boards", () => {
  it("are tutorial-1 and tutorial-2, outside the campaign", () => {
    expect(TUTORIALS.map((record) => record.id)).toEqual(["tutorial-1", "tutorial-2"]);
    for (const record of TUTORIALS) {
      expect(isTutorialId(record.id)).toBe(true);
      expect(CAMPAIGN.some((entry) => entry.id === record.id)).toBe(false);
    }
    expect(getTutorial("tutorial-2")?.title).toBe("Count the stones");
    expect(getTutorial("tutorial-9")).toBeUndefined();
  });

  it("are 4x4 boards with exactly one solution, equal to the stored one", () => {
    for (const record of TUTORIALS) {
      const puzzle = puzzleFromRecord(record);
      expect(puzzle.size).toBe(4);
      expect(record.size).toBe(4);
      expect(validatePuzzleShape(puzzle).ok).toBe(true);
      expect(encodePuzzle(puzzle)).toBe(record.code);
      const result = solve(puzzle, { limit: 2 });
      expect(result.exhausted).toBe(false);
      expect(result.count).toBe(1);
      const stored = solutionFromRecord(record);
      expect(equalTiles(result.solutions[0] as Uint8Array, stored)).toBe(true);
      expect(evaluate(puzzle, stored).solved).toBe(true);
      expect(evaluate(puzzle, emptyTiles(puzzle)).solved).toBe(false);
    }
  });

  it("teach what they say: a lantern, then a stone numbered 2", () => {
    const one = puzzleFromRecord(TUTORIALS[0] as (typeof TUTORIALS)[number]);
    expect(one.cells.some((cell) => cell.clue?.kind === "lantern")).toBe(true);
    expect(one.cells.some((cell) => cell.kind === "stone")).toBe(false);
    const two = puzzleFromRecord(TUTORIALS[1] as (typeof TUTORIALS)[number]);
    expect(two.cells.some((cell) => cell.kind === "stone" && cell.stone === 2)).toBe(true);
  });

  it("validateTutorials accepts the shipped boards and flags broken ones", () => {
    expect(validateTutorials()).toEqual([]);
    const first = TUTORIALS[0] as (typeof TUTORIALS)[number];
    const ambiguous = { ...first, code: "....|....|....|...La" };
    expect(
      validateTutorials([ambiguous])
        .map((issue) => issue.message)
        .join(" "),
    ).toMatch(/solutions/);
    const wrong = { ...first, solution: "0".repeat(16) };
    expect(validateTutorials([wrong]).length).toBeGreaterThan(0);
    const big = { ...first, id: "tutorial-3", size: 5, code: ".....|.....|.....|.....|....." };
    expect(validateTutorials([big]).length).toBeGreaterThan(0);
  });
});
