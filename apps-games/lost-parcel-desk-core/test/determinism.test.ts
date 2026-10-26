import { describe, expect, it } from "vitest";
import { createPrng } from "../src/prng";
import { generateCast } from "./fixtures/cast";
import { finishCase, runRandom } from "./fixtures/driver";
import { generateMiniCase } from "./fixtures/generate";

function playthrough(index: number): string {
  const rng = createPrng(5000 + index);
  const people = generateCast(rng.fork("cast"));
  const def = generateMiniCase(rng.fork("case"), people, `g${index}`);
  const trace = runRandom(rng.fork("play"), def, people, 60);
  const last = trace.states[trace.states.length - 1];
  if (last === undefined) throw new Error("empty trace");
  const done = finishCase(rng.fork("finish"), def, last);
  return JSON.stringify({ def, trace, done });
}

describe("determinism", () => {
  it("two runs of 200 random action sequences give identical JSON", () => {
    for (let index = 0; index < 200; index++) {
      expect(playthrough(index)).toBe(playthrough(index));
    }
  });

  it("different seeds give different playthroughs", () => {
    expect(playthrough(1)).not.toBe(playthrough(2));
  });
});
