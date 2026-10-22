import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateAttempt,
  type MergeDomainConfig,
  type MergeOriginKind,
  originFor,
  parseDomainConfig,
  verifyAttemptClaim,
  verifyPayloadHash,
} from "./config-domain";
import type { MergeCheckpoint, MergeDirection } from "./contracts";
import {
  challengePayloadHash,
  checkpointHash,
  dailySeed,
  hasLegalMove,
  initialCheckpoint,
  MergeEngineError,
  validateCheckpoint,
} from "./engine";
import { parseWireCheckpoint } from "./validation";

type Json = Record<string, unknown>;

const FIXTURE_URL = new URL(
  "../../../../../scripts/games/merge_relay_config_fixture.json",
  import.meta.url,
);

const fixture = JSON.parse(readFileSync(FIXTURE_URL, "utf8")) as Json;

function list(value: unknown): Json[] {
  return value as Json[];
}

function configOf(name: unknown): MergeDomainConfig {
  const raw = (fixture.configs as Record<string, Json>)[name as string];
  return {
    revision: raw.revision as number,
    rulesVersion: raw.rules_version as string,
    contentRevision: raw.content_revision as string,
    spawnTwoWeight: raw.spawn_two_weight as number,
    spawnFourWeight: raw.spawn_four_weight as number,
  };
}

function checkpointOf(value: unknown): MergeCheckpoint {
  const parsed = parseWireCheckpoint(value);
  if (!parsed) throw new MergeEngineError("invalid_checkpoint", "Checkpoint payload is invalid");
  validateCheckpoint(parsed);
  if (!hasLegalMove(parsed.board))
    throw new MergeEngineError("invalid_checkpoint", "Checkpoint must be playable");
  return parsed;
}

function wireOf(checkpoint: MergeCheckpoint): Json {
  return {
    board: checkpoint.board,
    score: checkpoint.score,
    move_count: checkpoint.moveCount,
    seed: checkpoint.seed,
    rng_state: checkpoint.rngState,
    rule_version: checkpoint.ruleVersion,
  };
}

function evaluate(entry: Json) {
  return evaluateAttempt(
    checkpointOf(entry.checkpoint),
    entry.moves as MergeDirection[],
    configOf(entry.config),
    entry.finish === true,
  );
}

function claimOf(entry: Json) {
  const claim = entry.claim as Json;
  const final = claim.final as Json;
  return {
    outcome: claim.outcome as string,
    legalMoves: claim.legal_moves as number,
    scoreGained: claim.score_gained as number,
    maxTile: claim.max_tile as number,
    finalCheckpoint: checkpointOf({ ...final, max_legal_moves: 3 }),
  };
}

function hashInput(entry: Json, checkpoint: MergeCheckpoint, revision: number) {
  const origin = originFor(entry.kind as MergeOriginKind);
  return {
    checkpoint,
    configRevision: revision,
    mode: origin.mode,
    originMode: origin.originMode,
    parentChallengeId: null,
  };
}

function runNegative(entry: Json): void {
  switch (entry.op) {
    case "checkpoint":
      checkpointOf(entry.checkpoint);
      return;
    case "daily_date":
      dailySeed(entry.utc_date as string);
      return;
    case "config":
      parseDomainConfig(entry.config as Json);
      return;
    case "attempt":
      evaluate(entry);
      return;
    case "result":
      verifyAttemptClaim(evaluate(entry), claimOf(entry));
      return;
    case "payload_hash":
      verifyPayloadHash(
        hashInput(entry, checkpointOf(entry.checkpoint), entry.config_revision as number),
        entry.claimed_hash as string,
      );
      return;
    default:
      throw new Error(`unknown op ${String(entry.op)}`);
  }
}

describe("Merge Relay config fixture (shared with Dart VM and compiled Dart)", () => {
  it("derives the daily seed with the 17 times 31 scheme", () => {
    expect(fixture.fixture_version).toBe("merge-relay-config.v1");
    expect(fixture.seed_derivation).toEqual({
      initial: 17,
      multiplier: 31,
      modulus: 4294967296,
      zero_replacement: 1,
    });
    for (const entry of list(fixture.daily)) {
      const seed = dailySeed(entry.utc_date as string);
      expect(seed).toBe(entry.seed);
      const config = configOf(entry.config);
      const custom = config.spawnFourWeight !== 10;
      const initial = custom
        ? initialCheckpoint(seed, config.spawnTwoWeight, config.spawnFourWeight)
        : initialCheckpoint(seed);
      const wire = entry.initial_checkpoint as Json;
      expect(wireOf(initial)).toEqual({
        board: wire.board,
        score: wire.score,
        move_count: wire.move_count,
        seed: wire.seed,
        rng_state: wire.rng_state,
        rule_version: wire.rule_version,
      });
      expect(wire.spawn_two_weight).toBe(custom ? config.spawnTwoWeight : undefined);
      expect(checkpointHash(initial)).toBe(entry.checkpoint_hash);
    }
  });

  it("keeps practice, daily, endless, rescue, and relay origins separate", () => {
    const hashes = new Map<string, unknown>();
    for (const entry of list(fixture.origins)) {
      const origin = originFor(entry.kind as MergeOriginKind);
      expect(origin).toEqual({
        mode: entry.mode,
        originMode: entry.origin_mode,
        ranked: entry.ranked,
      });
      const checkpoint = checkpointOf(entry.checkpoint);
      const revision = configOf(entry.config).revision;
      expect(challengePayloadHash(hashInput(entry, checkpoint, revision))).toBe(entry.payload_hash);
      hashes.set(entry.id as string, entry.payload_hash);
    }
    for (const entry of list(fixture.origins)) {
      if (entry.differs_from)
        expect(entry.payload_hash).not.toBe(hashes.get(entry.differs_from as string));
    }
  });

  it("replays terminal, early-finish, rescue, and custom-weight attempts identically", () => {
    const outcomes = new Set<string>();
    for (const entry of list(fixture.attempts)) {
      const expected = entry.expected as Json;
      const final = expected.final as Json;
      const result = evaluate(entry);
      outcomes.add(result.outcome);
      expect(result.outcome, String(entry.id)).toBe(expected.outcome);
      expect(result.legalMoves, String(entry.id)).toBe(expected.legal_moves);
      expect(result.scoreGained, String(entry.id)).toBe(expected.score_gained);
      expect(result.maxTile, String(entry.id)).toBe(expected.max_tile);
      expect(wireOf(result.finalCheckpoint), String(entry.id)).toEqual(final);
    }
    expect([...outcomes].sort()).toEqual(["completed", "early_finish", "in_progress", "terminal"]);
  });

  it("rejects every negative fixture with its recorded error code", () => {
    const negatives = list(fixture.negative);
    expect(negatives.length).toBeGreaterThan(40);
    for (const entry of negatives) {
      let thrown: unknown;
      try {
        runNegative(entry);
      } catch (error) {
        thrown = error;
      }
      expect(thrown, String(entry.id)).toBeDefined();
      if (entry.error_code !== undefined) {
        expect((thrown as MergeEngineError).code, String(entry.id)).toBe(entry.error_code);
      }
    }
  });
});
