import type { JsonObject } from "../contracts";
import type {
  CreateChallengeRequest,
  FinalizeAttemptRequest,
  GuestRecoveryRequest,
  MergeCheckpoint,
  MergeDirection,
  MergeMode,
  ReserveAttemptRequest,
  SaveRequest,
  SubmitMovesRequest,
} from "./contracts";
import {
  MERGE_RELAY_MAX_MOVES,
  MERGE_RELAY_RULE_VERSION,
  MERGE_RELAY_SAVE_SCHEMA_VERSION,
} from "./contracts";
import { isCanonicalJsonValue } from "./fingerprint";

const MERGE_MAX_ALIAS_LENGTH = 40;
export const MERGE_MAX_PAYLOAD_BYTES = 32 * 1024;

export {
  parseConfigRollback,
  parseConfigUpdate,
  parseEvent,
  parseReward,
  parseSocial,
} from "./data-validation";

export function isValidDailyDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeText(value: unknown, max = 128): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= max &&
    !Array.from(value).some((character) => (character.codePointAt(0) ?? 0) <= 31)
  );
}

export function isSafeId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function isIdempotencyKey(value: unknown): value is string {
  return isSafeText(value, 128) && /^[A-Za-z0-9._:-]+$/.test(value);
}

export function parseCheckpoint(value: unknown): MergeCheckpoint | null {
  if (!isObject(value) || !Array.isArray(value.board) || value.board.length !== 16) return null;
  const board = value.board.filter((cell): cell is number => typeof cell === "number");
  if (board.length !== 16 || !board.every((cell) => Number.isSafeInteger(cell))) return null;
  const score = integerField(value.score);
  const moveCount = integerField(value.moveCount);
  const seed = integerField(value.seed);
  const rngState = integerField(value.rngState);
  const maxLegalMoves = value.maxLegalMoves;
  const contentId = value.contentId;
  const contentVersion = value.contentVersion;
  const spawnTwoWeight =
    value.spawnTwoWeight === undefined ? undefined : integerField(value.spawnTwoWeight);
  const spawnFourWeight =
    value.spawnFourWeight === undefined ? undefined : integerField(value.spawnFourWeight);
  if (
    score === null ||
    score < 0 ||
    score > 1_000_000_000_000 ||
    moveCount === null ||
    moveCount < 0 ||
    moveCount > 100_000 ||
    seed === null ||
    seed < 0 ||
    seed > 0xffffffff ||
    rngState === null ||
    rngState < 0 ||
    rngState > 0xffffffff ||
    value.ruleVersion !== MERGE_RELAY_RULE_VERSION ||
    (maxLegalMoves !== undefined &&
      (typeof maxLegalMoves !== "number" ||
        !Number.isSafeInteger(maxLegalMoves) ||
        maxLegalMoves < 1 ||
        maxLegalMoves > MERGE_RELAY_MAX_MOVES)) ||
    (contentId !== undefined && !isSafeId(contentId)) ||
    (contentVersion !== undefined && !isSafeText(contentVersion, 64)) ||
    (spawnTwoWeight !== undefined &&
      (spawnTwoWeight === null || spawnTwoWeight < 0 || spawnTwoWeight > 100)) ||
    (spawnFourWeight !== undefined &&
      (spawnFourWeight === null || spawnFourWeight < 0 || spawnFourWeight > 100)) ||
    (typeof spawnTwoWeight === "number" &&
      typeof spawnFourWeight === "number" &&
      spawnTwoWeight + spawnFourWeight !== 100)
  )
    return null;
  return {
    board,
    score,
    moveCount,
    seed,
    rngState,
    ruleVersion: MERGE_RELAY_RULE_VERSION,
    maxLegalMoves: maxLegalMoves as number | undefined,
    contentId: contentId as string | undefined,
    contentVersion: contentVersion as string | undefined,
    spawnTwoWeight: spawnTwoWeight as number | undefined,
    spawnFourWeight: spawnFourWeight as number | undefined,
  };
}

function parseWireCheckpoint(value: unknown): MergeCheckpoint | null {
  if (!isObject(value)) return null;
  return parseCheckpoint({
    board: value.board,
    score: value.score,
    moveCount: value.move_count,
    seed: value.seed,
    rngState: value.rng_state,
    ruleVersion: value.rule_version,
    maxLegalMoves: value.max_legal_moves,
    contentId: value.content_id,
    contentVersion: value.content_version,
    spawnTwoWeight: value.spawn_two_weight,
    spawnFourWeight: value.spawn_four_weight,
  });
}

export function parseCreateChallenge(value: unknown): CreateChallengeRequest | null {
  if (
    !isObject(value) ||
    !isIdempotencyKey(value.idempotency_key) ||
    !isSafeText(value.creator_alias, MERGE_MAX_ALIAS_LENGTH) ||
    (value.mode !== undefined && !isMode(value.mode))
  )
    return null;
  const checkpoint = parseWireCheckpoint(value.checkpoint);
  const maxLegalMoves =
    value.max_legal_moves === undefined ? undefined : integerField(value.max_legal_moves);
  if (
    !checkpoint ||
    (value.parent_challenge_id !== undefined && !isSafeId(value.parent_challenge_id)) ||
    (maxLegalMoves !== undefined &&
      (maxLegalMoves === null || maxLegalMoves < 1 || maxLegalMoves > MERGE_RELAY_MAX_MOVES)) ||
    (value.content_id !== undefined && !isSafeId(value.content_id)) ||
    (value.content_version !== undefined && !isSafeText(value.content_version, 64))
  )
    return null;
  return {
    idempotencyKey: value.idempotency_key,
    creatorAlias: value.creator_alias,
    checkpoint,
    mode: (value.mode as MergeMode | undefined) ?? "rescue",
    maxLegalMoves:
      value.max_legal_moves === undefined
        ? (checkpoint.maxLegalMoves ?? MERGE_RELAY_MAX_MOVES)
        : (maxLegalMoves ?? undefined),
    contentId: typeof value.content_id === "string" ? value.content_id : undefined,
    contentVersion: typeof value.content_version === "string" ? value.content_version : undefined,
    originMode: value.mode as MergeMode | undefined,
    parentChallengeId: value.parent_challenge_id,
  };
}

export function parseReserveAttempt(value: unknown): ReserveAttemptRequest | null {
  return isObject(value) && isIdempotencyKey(value.reservation_key)
    ? { reservationKey: value.reservation_key }
    : null;
}

const directions = new Set<MergeDirection>(["up", "down", "left", "right"]);
export function parseSubmitMoves(value: unknown): SubmitMovesRequest | null {
  const expectedVersion = isObject(value) ? integerField(value.expected_version) : null;
  if (
    expectedVersion === null ||
    expectedVersion < 0 ||
    !isObject(value) ||
    !Array.isArray(value.moves) ||
    value.moves.length < 1 ||
    value.moves.length > MERGE_RELAY_MAX_MOVES
  )
    return null;
  if (
    !value.moves.every((move) => typeof move === "string" && directions.has(move as MergeDirection))
  )
    return null;
  return { expectedVersion, moves: value.moves as MergeDirection[] };
}

export function parseFinalize(value: unknown): FinalizeAttemptRequest | null {
  if (
    !isObject(value) ||
    !isIdempotencyKey(value.idempotency_key) ||
    (value.finish_early !== undefined && typeof value.finish_early !== "boolean")
  )
    return null;
  if (value.return_alias !== undefined && !isSafeText(value.return_alias, MERGE_MAX_ALIAS_LENGTH))
    return null;
  return {
    idempotencyKey: value.idempotency_key,
    finishEarly: value.finish_early,
    returnAlias: value.return_alias,
  };
}

export function parseSave(value: unknown): SaveRequest | null {
  if (!isObject(value)) return null;
  const expectedVersion = integerField(value.expected_version);
  const schemaVersion = integerField(value.schema_version);
  if (
    expectedVersion === null ||
    expectedVersion < 0 ||
    schemaVersion === null ||
    schemaVersion !== MERGE_RELAY_SAVE_SCHEMA_VERSION ||
    !isObject(value.payload) ||
    !isCanonicalJsonValue(value.payload)
  )
    return null;
  if (value.client_write_id !== undefined && !isIdempotencyKey(value.client_write_id)) return null;
  if (Buffer.byteLength(JSON.stringify(value.payload), "utf8") > MERGE_MAX_PAYLOAD_BYTES)
    return null;
  return {
    expectedVersion,
    schemaVersion,
    payload: value.payload,
    clientWriteId: value.client_write_id,
  };
}

export function parseGuestRecovery(value: unknown): GuestRecoveryRequest | null {
  return isObject(value) && isSafeText(value.recovery_token, 256)
    ? { recoveryToken: value.recovery_token }
    : null;
}

function integerField(value: JsonObject[string]): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function isMode(value: unknown): value is MergeMode {
  return value === "rescue" || value === "daily" || value === "endless";
}
