import { describe, expect, it } from "vitest";
import { pickHint, solveLook } from "../src/enumerate";
import { livePreview, scoreLook } from "../src/score";
import { makeScenarios } from "./fixtures/scenarios";
import { STARTER_PIECES } from "./fixtures/starter-pieces";

function runAll(seed: number): string {
  const results = makeScenarios(seed, 200).map(({ challenge, look }, index) => {
    const entry: unknown[] = [
      scoreLook(challenge, STARTER_PIECES, look),
      livePreview(challenge, STARTER_PIECES, look),
    ];
    if (index % 10 === 0) {
      entry.push(solveLook(challenge, STARTER_PIECES, {}, { maxVisited: 5000 }));
      entry.push(solveLook(challenge, STARTER_PIECES, look, { maxVisited: 5000 }));
      entry.push(pickHint(challenge, STARTER_PIECES, look, {}, { maxVisited: 5000 }));
    }
    return entry;
  });
  return JSON.stringify(results);
}

describe("determinism", () => {
  it("two runs of 200 scenarios produce byte-identical JSON", () => {
    expect(runAll(424242)).toBe(runAll(424242));
  });

  it("different seeds give different scenarios", () => {
    expect(runAll(1)).not.toBe(runAll(2));
  });

  it("scoring does not depend on the order of the piece list", () => {
    const reversed = [...STARTER_PIECES].reverse();
    for (const { challenge, look } of makeScenarios(99, 100)) {
      expect(JSON.stringify(scoreLook(challenge, reversed, look))).toBe(
        JSON.stringify(scoreLook(challenge, STARTER_PIECES, look)),
      );
    }
  });
});
