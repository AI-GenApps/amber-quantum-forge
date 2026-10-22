import { describe, expect, it } from "vitest";
import { challengePayloadHash } from "./engine";
import { parseWireCheckpoint } from "./validation";

const wire = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

describe("Merge Relay wire checkpoint strictness", () => {
  it("rejects unknown checkpoint fields like Dart", () => {
    expect(parseWireCheckpoint(wire)).not.toBeNull();
    expect(parseWireCheckpoint({ ...wire, extra: 1 })).toBeNull();
    expect(parseWireCheckpoint({ ...wire, maxLegalMoves: 3 })).toBeNull();
  });

  it("accepts every field Dart accepts", () => {
    const full = {
      ...wire,
      max_legal_moves: 3,
      content_id: "c1",
      content_version: "v1",
      parent_challenge_id: "p1",
      spawn_two_weight: 90,
      spawn_four_weight: 10,
    };
    expect(parseWireCheckpoint(full)).not.toBeNull();
  });

  it("hashes a missing move budget as the frozen default", () => {
    const base = parseWireCheckpoint(wire);
    const explicit = parseWireCheckpoint({ ...wire, max_legal_moves: 3 });
    if (!base || !explicit) throw new Error("checkpoint rejected");
    const input = { configRevision: 1, mode: "endless", originMode: "endless" } as const;
    expect(challengePayloadHash({ ...input, checkpoint: base })).toBe(
      challengePayloadHash({ ...input, checkpoint: explicit }),
    );
  });
});
