import { describe, expect, it } from "vitest";
import { analyseCase } from "../src/analyse";
import { createPrng } from "../src/prng";
import { generateCast } from "./fixtures/cast";
import { finishCase, runRandom } from "./fixtures/driver";
import { generateMiniCase } from "./fixtures/generate";

const CASE_COUNT = 200;
const STEPS = 60;

describe("property: 200 generated mini cases", () => {
  it("generates cases the analyser accepts", () => {
    for (let index = 0; index < CASE_COUNT; index++) {
      const rng = createPrng(1000 + index);
      const people = generateCast(rng.fork("cast"));
      const def = generateMiniCase(rng.fork("case"), people, `g${index}`);
      expect(analyseCase(def, people)).toEqual([]);
    }
  });

  it("random legal and illegal sequences never throw, never mutate and always deliver the owner", () => {
    let closedEarly = 0;
    let returnedEarly = 0;
    let hinted = 0;
    for (let index = 0; index < CASE_COUNT; index++) {
      const rng = createPrng(1000 + index);
      const people = generateCast(rng.fork("cast"));
      const def = generateMiniCase(rng.fork("case"), people, `g${index}`);
      const trace = runRandom(rng.fork("play"), def, people, STEPS);
      const last = trace.states[trace.states.length - 1];
      if (last === undefined) throw new Error("empty trace");
      if (last.closed) closedEarly++;
      if (last.returnedIds.length > 0) returnedEarly++;
      if (last.hintsUsed > 0) hinted++;
      const done = finishCase(rng.fork("finish"), def, last);
      expect(done.closed).toBe(true);
      expect(done.deliveredId).toBe(def.ownerId);
      expect(done.stamps).toBeGreaterThanOrEqual(1);
      expect(done.stamps).toBeLessThanOrEqual(3);
      expect(done.stamps).toBe(3 - done.wrongAccusations);
      expect(done.wrongAccusations).toBeLessThanOrEqual(2);
      expect(done.byElimination).toBe(done.wrongAccusations === 2);
      for (const state of trace.states) {
        expect(state.hintsUsed).toBeLessThanOrEqual(2);
        expect(state.returnedIds).not.toContain(def.ownerId);
        expect(state.pinnedClueIds.every((id) => state.foundClueIds.includes(id))).toBe(true);
        expect(state.links.every((link) => state.pinnedClueIds.includes(link.clueId))).toBe(true);
      }
    }
    expect(closedEarly).toBeGreaterThan(0);
    expect(returnedEarly).toBeGreaterThan(0);
    expect(hinted).toBeGreaterThan(0);
  });
});
