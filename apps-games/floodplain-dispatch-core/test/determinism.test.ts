import { describe, expect, it } from "vitest";
import { runSeason } from "../src/simulate";
import { randomScenario } from "./helpers";

describe("determinism", () => {
  it("two runs of 200 random scenarios give byte-identical JSON", () => {
    for (let seed = 1000; seed < 1200; seed++) {
      const { def, placements } = randomScenario(seed);
      const first = JSON.stringify(runSeason(def, placements, { keepSteps: true }));
      const second = JSON.stringify(runSeason(def, placements, { keepSteps: true }));
      expect(second).toBe(first);
    }
  });

  it("a deep copy of the inputs gives the same result as the originals", () => {
    for (let seed = 2000; seed < 2050; seed++) {
      const { def, placements } = randomScenario(seed);
      const copy = structuredClone({ def, placements });
      const a = JSON.stringify(runSeason(def, placements, { keepSteps: true }));
      const b = JSON.stringify(runSeason(copy.def, copy.placements, { keepSteps: true }));
      expect(b).toBe(a);
    }
  });

  it("running another scenario in between changes nothing (no shared state)", () => {
    const a = randomScenario(3001);
    const b = randomScenario(3002);
    const before = JSON.stringify(runSeason(a.def, a.placements, { keepSteps: true }));
    runSeason(b.def, b.placements, { keepSteps: true });
    expect(JSON.stringify(runSeason(a.def, a.placements, { keepSteps: true }))).toBe(before);
  });
});
