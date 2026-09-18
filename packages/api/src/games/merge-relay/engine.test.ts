import { describe, expect, it } from "vitest";
import { challengePayloadHash, checkpointHash, initialCheckpoint, replay } from "./engine";

describe("Merge Relay server rules", () => {
  it("matches the Dart replay fixture", () => {
    const result = replay(initialCheckpoint(12345), ["left", "up", "right", "down", "left"]);
    expect(result).toEqual({
      board: [8, 2, 0, 0, 4, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      score: 12,
      moveCount: 5,
      seed: 12345,
      rngState: 150275943,
      ruleVersion: "MR-2D-1",
    });
  });

  it("hashes the canonical snake case checkpoint payload", () => {
    expect(
      checkpointHash({
        board: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        score: 0,
        moveCount: 0,
        seed: 1,
        rngState: 2,
        ruleVersion: "MR-2D-1",
      }),
    ).toBe("33116ada4719cb4330b813ca06e42b23af74f48002a83a8c5e4aea589b540462");
  });

  it("uses configured spawn weights for the initial board", () => {
    const onlyFour = initialCheckpoint(12345, 0, 100);
    const onlyTwo = initialCheckpoint(12345, 100, 0);
    expect(onlyFour.board.filter((value) => value !== 0)).toEqual([4, 4]);
    expect(onlyTwo.board.filter((value) => value !== 0)).toEqual([2, 2]);
    expect(onlyFour.spawnFourWeight).toBe(100);
    expect(onlyTwo.spawnTwoWeight).toBe(100);
  });

  it("binds the full challenge payload to its frozen configuration", () => {
    const checkpoint = {
      ...initialCheckpoint(12345, 80, 20),
      contentId: "board-1",
      contentVersion: "MR-CONTENT-1",
      maxLegalMoves: 3,
    };
    const original = challengePayloadHash({
      checkpoint,
      configRevision: 1,
      mode: "rescue",
      originMode: "daily",
      parentChallengeId: null,
    });
    expect(
      challengePayloadHash({
        checkpoint,
        configRevision: 2,
        mode: "rescue",
        originMode: "daily",
        parentChallengeId: null,
      }),
    ).not.toBe(original);
    expect(
      challengePayloadHash({
        checkpoint: { ...checkpoint, contentVersion: "MR-CONTENT-2" },
        configRevision: 1,
        mode: "rescue",
        originMode: "daily",
        parentChallengeId: null,
      }),
    ).not.toBe(original);
  });
});
