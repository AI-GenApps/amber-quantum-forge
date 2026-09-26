import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { MergeCheckpoint, MergeDirection } from "./contracts";
import {
  applyMove,
  challengePayloadHash,
  checkpointHash,
  initialCheckpoint,
  isTerminal,
  replay,
} from "./engine";

const DOMAIN_FIXTURE_URL = new URL(
  "../../../../../scripts/games/merge_relay_domain_fixture.json",
  import.meta.url,
);

interface DomainReplayExpectation {
  readonly board: readonly number[];
  readonly score: number;
  readonly move_count: number;
  readonly seed: number;
  readonly rng_state: number;
  readonly rule_version: string;
}

interface DomainFixture {
  readonly checkpoint: DomainReplayExpectation;
  readonly checkpoint_hash: string;
  readonly ordinary_replay: {
    readonly moves: readonly MergeDirection[];
    readonly expected: DomainReplayExpectation;
  };
  readonly ranked_replay: {
    readonly max_legal_moves: number;
    readonly moves: readonly MergeDirection[];
    readonly expected: DomainReplayExpectation;
    readonly score_gained: number;
    readonly max_tile: number;
    readonly outcome: string;
  };
}

function readDomainFixture(): DomainFixture {
  return JSON.parse(readFileSync(DOMAIN_FIXTURE_URL, "utf8")) as DomainFixture;
}

function toWireCheckpoint(checkpoint: MergeCheckpoint): DomainReplayExpectation {
  return {
    board: checkpoint.board,
    score: checkpoint.score,
    move_count: checkpoint.moveCount,
    seed: checkpoint.seed,
    rng_state: checkpoint.rngState,
    rule_version: checkpoint.ruleVersion,
  };
}

describe("Merge Relay server rules", () => {
  it("matches the Dart replay fixture", () => {
    const result = replay(initialCheckpoint(12345), ["left", "up", "right", "down", "left"]);
    expect(result).toEqual({
      board: [0, 0, 0, 0, 2, 0, 0, 2, 8, 0, 0, 0, 2, 4, 0, 0],
      score: 12,
      moveCount: 5,
      seed: 12345,
      rngState: 150275943,
      ruleVersion: "MR-2D-1",
    });
  });

  it("a single tile slides to the far edge on right/down (regression: right/down previously behaved like left/up)", () => {
    const base = {
      score: 0,
      moveCount: 0,
      seed: 1,
      rngState: 12_345,
      ruleVersion: "MR-2D-1" as const,
    };
    const single: MergeCheckpoint = {
      ...base,
      board: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const right = applyMove(single, "right");
    expect(right.changed).toBe(true);
    expect(right.checkpoint.board[3]).toBe(2);
    expect(right.checkpoint.board[0]).toBe(0);

    const down = applyMove(single, "down");
    expect(down.changed).toBe(true);
    expect(down.checkpoint.board[12]).toBe(2);
    expect(down.checkpoint.board[0]).toBe(0);
  });

  it("merges into the far edge on right/down", () => {
    const base = {
      score: 0,
      moveCount: 0,
      seed: 1,
      rngState: 12_345,
      ruleVersion: "MR-2D-1" as const,
    };
    const row: MergeCheckpoint = {
      ...base,
      board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const right = applyMove(row, "right");
    expect(right.changed).toBe(true);
    expect(right.scoreDelta).toBe(4);
    expect(right.checkpoint.board[3]).toBe(4);

    const column: MergeCheckpoint = {
      ...base,
      board: [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const down = applyMove(column, "down");
    expect(down.changed).toBe(true);
    expect(down.scoreDelta).toBe(4);
    expect(down.checkpoint.board[12]).toBe(4);
  });

  it("agrees with the shared Dart/TS domain fixture for both ordinary and ranked replay", () => {
    const fixture = readDomainFixture();
    const checkpoint: MergeCheckpoint = {
      board: [...fixture.checkpoint.board],
      score: fixture.checkpoint.score,
      moveCount: fixture.checkpoint.move_count,
      seed: fixture.checkpoint.seed,
      rngState: fixture.checkpoint.rng_state,
      ruleVersion: fixture.checkpoint.rule_version as MergeCheckpoint["ruleVersion"],
    };
    expect(checkpointHash(checkpoint)).toBe(fixture.checkpoint_hash);

    const ordinary = replay(checkpoint, fixture.ordinary_replay.moves);
    expect(toWireCheckpoint(ordinary)).toEqual(fixture.ordinary_replay.expected);

    let current = checkpoint;
    let legalMoves = 0;
    for (const move of fixture.ranked_replay.moves) {
      const applied = applyMove(current, move);
      if (applied.changed) legalMoves += 1;
      current = applied.checkpoint;
    }
    expect(toWireCheckpoint(current)).toEqual(fixture.ranked_replay.expected);
    expect(current.score - checkpoint.score).toBe(fixture.ranked_replay.score_gained);
    expect(Math.max(...current.board)).toBe(fixture.ranked_replay.max_tile);
    const outcome = isTerminal(current)
      ? "terminal"
      : legalMoves >= fixture.ranked_replay.max_legal_moves
        ? "completed"
        : "in_progress";
    expect(outcome).toBe(fixture.ranked_replay.outcome);
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
