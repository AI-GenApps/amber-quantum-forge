import { describe, expect, it } from "vitest";
import { checkPlacement } from "../src/placement";
import { createPrng } from "../src/prng";
import { stepOnce } from "../src/simulate";
import type { Direction, Placement } from "../src/types";
import { ALL_PIECES, makeDef, stateFor, total } from "./helpers";

describe("mass conservation", () => {
  it("keeps the total on boards without sea or inlet, with every piece type", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = createPrng(seed);
      const layout = Array.from({ length: 6 }, () =>
        Array.from(
          { length: 6 },
          () => `${rng.pick([".", ".", ".", "H", "F", "T"])}${rng.int(8)}`,
        ).join(" "),
      );
      const def = makeDef(layout, { weeks: 8, budget: 30 });
      const placements: Placement[] = [];
      for (let i = 0; i < 25; i++) {
        const kind = rng.pick(ALL_PIECES);
        const candidate: Placement = { x: rng.int(6), y: rng.int(6), kind };
        if (kind === "pump") candidate.dir = rng.pick<Direction>(["N", "E", "S", "W"]);
        if (checkPlacement(def, placements, candidate) === null) placements.push(candidate);
      }
      const depths: Array<[number, number, number]> = [];
      for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) depths.push([x, y, rng.int(5)]);
      const state = stateFor(def, placements, depths);
      const start = total(state);
      for (let step = 0; step < 32; step++) {
        stepOnce(state);
        expect(total(state)).toBe(start);
      }
    }
  });
});
