import { describe, expect, it } from "vitest";
import { evaluate } from "../src/rules";
import { isUnique, propagate, solve } from "../src/solver";
import { puzzleOf } from "./helpers/fixtures";

const DENSE_9 =
  "..GrLrGrLrS1..|LrS3S1..LrS2S1.|.M\\..M/LjGj.S1|S3Lr.LrS3LjLjLjS1|M/.M\\M\\S3M/LjGj.|Lr.=6..M/.S3Gj.|LrM/..M/.S1Lj.|.LaLj=5.GjLj..Gj|LaLa.LjS3.Lj..";
const FIVE = ".LjLjLjS1|.S4.=6M/.|LjLj..La|LrLrLrLa=5.|LrGrM/..";

function timed<T>(run: () => T): { value: T; ms: number } {
  const start = performance.now();
  const value = run();
  return { value, ms: performance.now() - start };
}

describe("performance guards", () => {
  const nine = puzzleOf(DENSE_9, "dense-9");
  const five = puzzleOf(FIVE, "dense-5");
  const measured: string[] = [];

  it("proves a dense 9x9 with every mechanic unique in under 500 ms", () => {
    const mechanics = new Set<string>();
    for (const cell of nine.cells) {
      if (cell.kind === "stone") mechanics.add("stone");
      if (cell.clue) mechanics.add(cell.clue.kind);
      if (cell.fixed !== undefined) mechanics.add("fixed");
    }
    expect([...mechanics].sort()).toEqual(["fixed", "gate", "lantern", "mirror", "stone"]);
    const { value, ms } = timed(() => isUnique(nine));
    measured.push(`isUnique 9x9 ${ms.toFixed(1)} ms`);
    expect(value).toBe(true);
    expect(ms).toBeLessThan(500);
    const only = solve(nine, { limit: 2 }).solutions[0];
    expect(only && evaluate(nine, only).solved).toBe(true);
  });

  it("proves a 5x5 unique in under 50 ms", () => {
    const { value, ms } = timed(() => isUnique(five));
    measured.push(`isUnique 5x5 ${ms.toFixed(1)} ms`);
    expect(value).toBe(true);
    expect(ms).toBeLessThan(50);
  });

  it("propagates a 9x9 in under 100 ms", () => {
    const { value, ms } = timed(() => propagate(nine));
    measured.push(`propagate 9x9 ${ms.toFixed(1)} ms`);
    expect(value.contradiction).toBe(false);
    expect(ms).toBeLessThan(100);
  });

  it("prints the measured times once", () => {
    console.log(`performance: ${measured.join(", ")}`);
    expect(measured).toHaveLength(3);
  });
});
