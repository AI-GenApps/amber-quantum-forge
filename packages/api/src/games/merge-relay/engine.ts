import { createHash } from "node:crypto";
import type { MergeCheckpoint, MergeDirection, MergeMode } from "./contracts";
import { MERGE_RELAY_MAX_MOVES, MERGE_RELAY_RULE_VERSION } from "./contracts";
import {
  MERGE_MAX_MOVE_COUNT,
  MERGE_MAX_SCORE,
  MERGE_MAX_TILE,
  moveBoard,
  Rng,
  sameBoard,
  spawnValue,
} from "./engine-core";
import { parseCheckpoint } from "./validation";

export class MergeEngineError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface AppliedMove {
  checkpoint: MergeCheckpoint;
  changed: boolean;
  scoreDelta: number;
  reason: "moved" | "no_op" | "terminal";
}

export function validateCheckpoint(checkpoint: MergeCheckpoint): void {
  if (!parseCheckpoint(checkpoint))
    throw new MergeEngineError("invalid_checkpoint", "Checkpoint payload is invalid");
  if (
    checkpoint.board.some(
      (value) =>
        value < 0 || value > MERGE_MAX_TILE || (value !== 0 && (value & (value - 1)) !== 0),
    )
  )
    throw new MergeEngineError("invalid_checkpoint", "Checkpoint contains an invalid tile");
}

export function hasLegalMove(board: readonly number[]): boolean {
  if (board.some((value) => value === 0)) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
      if (board[index] >= MERGE_MAX_TILE) continue;
      if (row < 3 && board[index] === board[index + 4]) return true;
      if (column < 3 && board[index] === board[index + 1]) return true;
    }
  }
  return false;
}

export function isTerminal(checkpoint: MergeCheckpoint): boolean {
  return !hasLegalMove(checkpoint.board);
}

export function applyMove(checkpoint: MergeCheckpoint, direction: MergeDirection): AppliedMove {
  validateCheckpoint(checkpoint);
  if (isTerminal(checkpoint))
    return { checkpoint, changed: false, scoreDelta: 0, reason: "terminal" };
  const moved = moveBoard(checkpoint.board, direction);
  if (sameBoard(checkpoint.board, moved.board))
    return { checkpoint, changed: false, scoreDelta: 0, reason: "no_op" };
  if (checkpoint.moveCount >= MERGE_MAX_MOVE_COUNT)
    throw new MergeEngineError("move_limit", "Merge move limit exceeded");
  if (checkpoint.score + moved.scoreDelta > MERGE_MAX_SCORE)
    throw new MergeEngineError("score_limit", "Merge score limit exceeded");
  const rng = new Rng(checkpoint.rngState);
  const empty = moved.board.flatMap((value, index) => (value === 0 ? [index] : []));
  let board = moved.board;
  if (empty.length > 0) {
    const index = empty[rng.nextInt(empty.length)];
    const value = spawnValue(rng, checkpoint.spawnFourWeight);
    board = [...board];
    board[index] = value;
  }
  const next: MergeCheckpoint = {
    board,
    score: checkpoint.score + moved.scoreDelta,
    moveCount: checkpoint.moveCount + 1,
    seed: checkpoint.seed,
    rngState: rng.state,
    ruleVersion: MERGE_RELAY_RULE_VERSION,
    ...(checkpoint.maxLegalMoves === undefined ? {} : { maxLegalMoves: checkpoint.maxLegalMoves }),
    ...(checkpoint.contentId === undefined ? {} : { contentId: checkpoint.contentId }),
    ...(checkpoint.contentVersion === undefined
      ? {}
      : { contentVersion: checkpoint.contentVersion }),
    ...(checkpoint.spawnTwoWeight === undefined
      ? {}
      : { spawnTwoWeight: checkpoint.spawnTwoWeight }),
    ...(checkpoint.spawnFourWeight === undefined
      ? {}
      : { spawnFourWeight: checkpoint.spawnFourWeight }),
  };
  return {
    checkpoint: next,
    changed: true,
    scoreDelta: moved.scoreDelta,
    reason: isTerminal(next) ? "terminal" : "moved",
  };
}

export function replay(
  checkpoint: MergeCheckpoint,
  moves: readonly MergeDirection[],
): MergeCheckpoint {
  let current = checkpoint;
  for (const move of moves) {
    const applied = applyMove(current, move);
    if (!applied.changed)
      throw new MergeEngineError(applied.reason, "Replay contains an illegal move");
    current = applied.checkpoint;
  }
  return current;
}

export function checkpointHash(checkpoint: MergeCheckpoint): string {
  const serialized = stableJson({
    board: checkpoint.board,
    move_count: checkpoint.moveCount,
    rng_state: checkpoint.rngState,
    rule_version: checkpoint.ruleVersion,
    score: checkpoint.score,
    seed: checkpoint.seed,
  });
  return createHash("sha256").update(serialized).digest("hex");
}

export function challengePayloadHash(input: {
  checkpoint: MergeCheckpoint;
  configRevision: number;
  mode: MergeMode;
  originMode: MergeMode;
  parentChallengeId?: string | null;
}): string {
  const serialized = stableJson({
    checkpoint: {
      board: input.checkpoint.board,
      content_id: input.checkpoint.contentId ?? null,
      content_version: input.checkpoint.contentVersion ?? null,
      max_legal_moves: input.checkpoint.maxLegalMoves ?? MERGE_RELAY_MAX_MOVES,
      move_count: input.checkpoint.moveCount,
      rng_state: input.checkpoint.rngState,
      rule_version: input.checkpoint.ruleVersion,
      score: input.checkpoint.score,
      seed: input.checkpoint.seed,
      spawn_four_weight: input.checkpoint.spawnFourWeight ?? null,
      spawn_two_weight: input.checkpoint.spawnTwoWeight ?? null,
    },
    config_revision: input.configRevision,
    mode: input.mode,
    origin_mode: input.originMode,
    parent_challenge_id: input.parentChallengeId ?? null,
  });
  return createHash("sha256").update(serialized).digest("hex");
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(",")}}`;
}

export function dailySeed(date: string): number {
  if (!isUtcDate(date)) throw new MergeEngineError("invalid_date", "Daily date must be a UTC date");
  let hash = 17;
  for (const character of date) {
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash || 1;
}

export function initialCheckpoint(
  seed: number,
  spawnTwoWeight?: number,
  spawnFourWeight?: number,
): MergeCheckpoint {
  const rng = new Rng(seed);
  const board = Array<number>(16).fill(0);
  for (let count = 0; count < 2; count += 1) {
    const empty = board.flatMap((value, index) => (value === 0 ? [index] : []));
    board[empty[rng.nextInt(empty.length)]] = spawnValue(rng, spawnFourWeight);
  }
  return {
    board,
    score: 0,
    moveCount: 0,
    seed,
    rngState: rng.state,
    ruleVersion: MERGE_RELAY_RULE_VERSION,
    ...(spawnTwoWeight === undefined || spawnFourWeight === undefined
      ? {}
      : { spawnTwoWeight, spawnFourWeight }),
  };
}

function isUtcDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(`${value}T`);
}
