import { describe, expect, it } from "vitest";
import {
  CHALLENGES,
  closetFor,
  type ProofResult,
  proveChallenge,
  THREE_STAR_SHARE_CAP_PERCENT,
  validateContent,
} from "../src/index";
import { scoreLook } from "../src/score";
import { table, toNumber, unquote } from "./helpers/plan";

const PROOF_ROWS = table("### Proof counts (prototype over the shipped data)", "Id");

let cached: ReadonlyMap<string, ProofResult> | undefined;
let seconds = 0;

function proofs(): ReadonlyMap<string, ProofResult> {
  if (cached === undefined) {
    const started = performance.now();
    const all = new Map<string, ProofResult>();
    for (const def of CHALLENGES) {
      all.set(def.id, proveChallenge(def, closetFor(def.chapterIndex)));
    }
    seconds = (performance.now() - started) / 1000;
    cached = all;
  }
  return cached;
}

describe("exhaustive proofs", () => {
  it("enumerates every challenge once in its unlock closet", () => {
    expect(proofs().size).toBe(40);
    expect(seconds).toBeLessThan(60);
  }, 60_000);

  it("has one proof row per challenge, in order", () => {
    expect(PROOF_ROWS.map((row) => unquote(row[0] ?? ""))).toEqual(CHALLENGES.map((def) => def.id));
  });

  it("reproduces the looks and three-star counts of the proof table", () => {
    for (const row of PROOF_ROWS) {
      const id = unquote(row[0] ?? "");
      const proof = proofs().get(id);
      expect(proof, id).toBeDefined();
      expect(proof?.looks, `${id} looks`).toBe(toNumber(row[3] ?? ""));
      expect(proof?.threeStar, `${id} three-star`).toBe(toNumber(row[4] ?? ""));
      expect(Number(proof?.sharePercent.toFixed(2)), `${id} share`).toBeCloseTo(
        toNumber(row[5] ?? ""),
        2,
      );
    }
  });

  it("has at least two three-star looks per challenge", () => {
    for (const def of CHALLENGES) {
      expect(proofs().get(def.id)?.threeStar ?? 0, def.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the three-star share under the chapter cap", () => {
    for (const def of CHALLENGES) {
      const cap = THREE_STAR_SHARE_CAP_PERCENT[def.chapterIndex] ?? 0;
      expect(proofs().get(def.id)?.sharePercent ?? 100, def.id).toBeLessThanOrEqual(cap);
    }
  });

  it("scores every committed reference look with three stars", () => {
    for (const def of CHALLENGES) {
      const result = scoreLook(def, closetFor(def.chapterIndex), def.reference);
      expect(result.stars, def.id).toBe(3);
      expect(result.complete, def.id).toBe(true);
    }
  });

  it("scores the empty board with no stars", () => {
    for (const def of CHALLENGES) {
      expect(scoreLook(def, closetFor(def.chapterIndex), {}).stars, def.id).toBe(0);
    }
  });

  it("validates the whole shipped content, proofs included", () => {
    expect(validateContent({ proofs: proofs() })).toEqual([]);
  });
});
