import type { MergeCheckpoint, MergeDirection, MergeMode } from "./contracts";
import { MERGE_RELAY_MAX_MOVES, MERGE_RELAY_RULE_VERSION } from "./contracts";
import {
  applyMove,
  challengePayloadHash,
  hasLegalMove,
  MergeEngineError,
  validateCheckpoint,
} from "./engine";
import { parseCheckpoint } from "./validation";

export type MergeDomainOutcome = "in_progress" | "completed" | "early_finish" | "terminal";
export type MergeOriginKind = "practice" | "daily" | "endless" | "rescue" | "relay_from_daily";

export interface MergeDomainConfig {
  revision: number;
  rulesVersion: string;
  contentRevision: string;
  spawnTwoWeight: number;
  spawnFourWeight: number;
}

export interface MergeOrigin {
  mode: MergeMode;
  originMode: MergeMode;
  ranked: boolean;
}

export interface MergeAttemptEvaluation {
  outcome: MergeDomainOutcome;
  legalMoves: number;
  scoreGained: number;
  maxTile: number;
  finalCheckpoint: MergeCheckpoint;
}

export interface MergeAttemptClaim {
  outcome: string;
  legalMoves: number;
  scoreGained: number;
  maxTile: number;
  finalCheckpoint: MergeCheckpoint;
}

const ORIGINS: Record<MergeOriginKind, MergeOrigin> = {
  practice: { mode: "endless", originMode: "endless", ranked: false },
  daily: { mode: "daily", originMode: "daily", ranked: true },
  endless: { mode: "endless", originMode: "endless", ranked: true },
  rescue: { mode: "rescue", originMode: "rescue", ranked: true },
  relay_from_daily: { mode: "rescue", originMode: "daily", ranked: true },
};

export function parseDomainConfig(raw: Record<string, unknown>): MergeDomainConfig {
  const allowed = [
    "revision",
    "rules_version",
    "content_revision",
    "spawn_two_weight",
    "spawn_four_weight",
  ];
  const { revision, rules_version: rulesVersion, content_revision: contentRevision } = raw;
  const two = raw.spawn_two_weight;
  const four = raw.spawn_four_weight;
  if (
    Object.keys(raw).some((key) => !allowed.includes(key)) ||
    !Number.isSafeInteger(revision) ||
    (revision as number) < 1 ||
    typeof rulesVersion !== "string" ||
    typeof contentRevision !== "string" ||
    !Number.isSafeInteger(two) ||
    !Number.isSafeInteger(four) ||
    (two as number) < 0 ||
    (four as number) < 0 ||
    (two as number) + (four as number) !== 100
  )
    throw new MergeEngineError("invalid_config", "Configuration is invalid");
  if (rulesVersion !== MERGE_RELAY_RULE_VERSION)
    throw new MergeEngineError("foreign_rules", "Configuration rules version is foreign");
  return {
    revision: revision as number,
    rulesVersion,
    contentRevision,
    spawnTwoWeight: two as number,
    spawnFourWeight: four as number,
  };
}

export function originFor(kind: MergeOriginKind): MergeOrigin {
  return ORIGINS[kind];
}

export function requireBoundConfig(
  checkpoint: MergeCheckpoint,
  config: MergeDomainConfig,
  contentId?: string,
): void {
  if (config.rulesVersion !== MERGE_RELAY_RULE_VERSION)
    throw new MergeEngineError("foreign_rules", "Configuration rules version is foreign");
  const weightsPresent =
    checkpoint.spawnTwoWeight !== undefined || checkpoint.spawnFourWeight !== undefined;
  if (weightsPresent) {
    if (
      checkpoint.spawnTwoWeight !== config.spawnTwoWeight ||
      checkpoint.spawnFourWeight !== config.spawnFourWeight
    )
      throw new MergeEngineError("config_mismatch", "Checkpoint weights differ from configuration");
  } else if (config.spawnTwoWeight !== 90 || config.spawnFourWeight !== 10) {
    throw new MergeEngineError("config_mismatch", "Custom configuration needs checkpoint weights");
  }
  if (
    checkpoint.contentVersion !== undefined &&
    checkpoint.contentVersion !== config.contentRevision
  )
    throw new MergeEngineError("content_version_mismatch", "Checkpoint content is foreign");
  if (
    contentId !== undefined &&
    checkpoint.contentId !== undefined &&
    contentId !== checkpoint.contentId
  )
    throw new MergeEngineError("content_id_mismatch", "Content identifiers do not match");
}

export function evaluateAttempt(
  checkpoint: MergeCheckpoint,
  moves: readonly MergeDirection[],
  config: MergeDomainConfig,
  finish: boolean,
): MergeAttemptEvaluation {
  validateCheckpoint(checkpoint);
  if (!hasLegalMove(checkpoint.board))
    throw new MergeEngineError("invalid_checkpoint", "Checkpoint must be playable");
  requireBoundConfig(checkpoint, config);
  const budget = checkpoint.maxLegalMoves ?? MERGE_RELAY_MAX_MOVES;
  let current = checkpoint;
  let legalMoves = 0;
  for (const move of moves) {
    if (!hasLegalMove(current.board))
      throw new MergeEngineError("trailing_move", "Replay has a move after terminal state");
    if (legalMoves >= budget) throw new MergeEngineError("over_budget", "Replay exceeds budget");
    const applied = applyMove(current, move);
    if (!applied.changed) throw new MergeEngineError("no_op", "Replay contains a no-op move");
    current = applied.checkpoint;
    legalMoves += 1;
  }
  const outcome: MergeDomainOutcome = !hasLegalMove(current.board)
    ? "terminal"
    : legalMoves === budget
      ? "completed"
      : finish
        ? "early_finish"
        : "in_progress";
  return {
    outcome,
    legalMoves,
    scoreGained: current.score - checkpoint.score,
    maxTile: Math.max(...current.board),
    finalCheckpoint: current,
  };
}

export function verifyAttemptClaim(
  evaluated: MergeAttemptEvaluation,
  claim: MergeAttemptClaim,
): void {
  const final = parseCheckpoint(claim.finalCheckpoint);
  if (
    !final ||
    claim.outcome !== evaluated.outcome ||
    claim.legalMoves !== evaluated.legalMoves ||
    claim.scoreGained !== evaluated.scoreGained ||
    claim.maxTile !== evaluated.maxTile ||
    JSON.stringify(final.board) !== JSON.stringify(evaluated.finalCheckpoint.board) ||
    final.score !== evaluated.finalCheckpoint.score ||
    final.moveCount !== evaluated.finalCheckpoint.moveCount ||
    final.rngState !== evaluated.finalCheckpoint.rngState
  )
    throw new MergeEngineError("inconsistent_result", "Result relations are inconsistent");
}

export function verifyPayloadHash(
  input: Parameters<typeof challengePayloadHash>[0],
  claimedHash: string,
): void {
  if (challengePayloadHash(input) !== claimedHash)
    throw new MergeEngineError("hash_mismatch", "Challenge payload hash does not match");
}
