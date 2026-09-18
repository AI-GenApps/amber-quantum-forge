import { createHash } from "node:crypto";
import type { MergeCheckpoint, MergeDirection, MergeMode } from "./contracts";
import { MERGE_RELAY_RULE_VERSION } from "./contracts";
import { parseCheckpoint } from "./validation";

class MergeEngineError extends Error {
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
      (value) => value < 0 || value > 1_073_741_824 || (value !== 0 && (value & (value - 1)) !== 0),
    )
  )
    throw new MergeEngineError("invalid_checkpoint", "Checkpoint contains an invalid tile");
}

export function hasLegalMove(board: readonly number[]): boolean {
  if (board.some((value) => value === 0)) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
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
  const rng = new Rng(checkpoint.rngState);
  const empty = moved.board.flatMap((value, index) => (value === 0 ? [index] : []));
  let board = moved.board;
  if (empty.length > 0) {
    const index = empty[rng.nextInt(empty.length)];
    const value =
      checkpoint.spawnFourWeight === undefined
        ? rng.nextInt(10) === 0
          ? 4
          : 2
        : rng.nextInt(100) < checkpoint.spawnFourWeight
          ? 4
          : 2;
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
      max_legal_moves: input.checkpoint.maxLegalMoves ?? null,
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
  let state = seed >>> 0 || 0x6d2b79f5;
  const board = Array<number>(16).fill(0);
  const next = (): number => {
    state ^= (state << 13) >>> 0;
    state >>>= 0;
    state ^= state >>> 17;
    state >>>= 0;
    state ^= (state << 5) >>> 0;
    state >>>= 0;
    state = state || 0x6d2b79f5;
    return state;
  };
  for (let count = 0; count < 2; count += 1) {
    const empty = board.flatMap((value, index) => (value === 0 ? [index] : []));
    board[empty[next() % empty.length]] =
      spawnFourWeight === undefined
        ? next() % 10 === 0
          ? 4
          : 2
        : next() % 100 < spawnFourWeight
          ? 4
          : 2;
  }
  return {
    board,
    score: 0,
    moveCount: 0,
    seed,
    rngState: state,
    ruleVersion: MERGE_RELAY_RULE_VERSION,
    ...(spawnTwoWeight === undefined || spawnFourWeight === undefined
      ? {}
      : { spawnTwoWeight, spawnFourWeight }),
  };
}

class Rng {
  private value: number;

  constructor(state: number) {
    this.value = state >>> 0 || 0x6d2b79f5;
  }

  get state(): number {
    return this.value >>> 0;
  }

  nextInt(maximum: number): number {
    return this.nextUint32() % maximum;
  }

  private nextUint32(): number {
    this.value ^= (this.value << 13) >>> 0;
    this.value >>>= 0;
    this.value ^= this.value >>> 17;
    this.value >>>= 0;
    this.value ^= (this.value << 5) >>> 0;
    this.value >>>= 0;
    this.value = this.value || 0x6d2b79f5;
    return this.value;
  }
}

function moveBoard(
  cells: readonly number[],
  direction: MergeDirection,
): { board: number[]; scoreDelta: number } {
  const result = [...cells];
  let scoreDelta = 0;
  for (let line = 0; line < 4; line += 1) {
    const indexes = lineIndexes(direction, line);
    const values = indexes.map((index) => cells[index]);
    const oriented = direction === "right" || direction === "down" ? [...values].reverse() : values;
    const compact = oriented.filter((value) => value !== 0);
    const merged: number[] = [];
    for (let index = 0; index < compact.length; index += 1) {
      if (index + 1 < compact.length && compact[index] === compact[index + 1]) {
        const value = compact[index] * 2;
        merged.push(value);
        scoreDelta += value;
        index += 1;
      } else merged.push(compact[index]);
    }
    while (merged.length < 4) merged.push(0);
    const output = direction === "right" || direction === "down" ? [...merged].reverse() : merged;
    indexes.forEach((index, position) => {
      result[index] = output[position];
    });
  }
  return { board: result, scoreDelta };
}

function lineIndexes(direction: MergeDirection, line: number): number[] {
  if (direction === "left") return [line * 4, line * 4 + 1, line * 4 + 2, line * 4 + 3];
  if (direction === "right") return [line * 4 + 3, line * 4 + 2, line * 4 + 1, line * 4];
  if (direction === "up") return [line, line + 4, line + 8, line + 12];
  return [line + 12, line + 8, line + 4, line];
}

function sameBoard(first: readonly number[], second: readonly number[]): boolean {
  return first.every((value, index) => value === second[index]);
}
