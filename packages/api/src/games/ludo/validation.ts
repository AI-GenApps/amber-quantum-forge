import { isGameAppId, isGameEnvironment } from "../validation";
import type {
  LudoCommand,
  LudoCreateMatchmakingTicketRequest,
  LudoCreateRoomRequest,
  LudoJoinRoomRequest,
  LudoMode,
} from "./contracts";

export type LudoValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function ok<T>(value: T): LudoValidationResult<T> {
  return { ok: true, value };
}

function fail<T>(error: string): LudoValidationResult<T> {
  return { ok: false, error };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
}

function isMatchId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

function isMode(value: unknown): value is LudoMode {
  return value === "classic" || value === "quick";
}

function isSeatTarget(value: unknown): value is number {
  return value === 2 || value === 4;
}

function isTicketId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

/** Matches `room-service.ts`'s generated code alphabet: 6 uppercase alphanumeric characters. */
function isRoomCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z0-9]{6}$/.test(value);
}

export { isGameAppId, isGameEnvironment };

export function isLudoEnvironment(value: string): boolean {
  return isGameEnvironment(value);
}

export function parseLudoCommand(value: unknown): LudoValidationResult<LudoCommand> {
  if (!isObject(value)) return fail("ludo_command_must_be_object");
  const { type, idempotency_key: idempotencyKey } = value;
  if (typeof type !== "string") return fail("ludo_command_type_required");
  if (!isIdempotencyKey(idempotencyKey)) return fail("ludo_idempotency_key_invalid");

  switch (type) {
    case "create_match": {
      const seats = value.seats;
      if (!isMode(value.mode)) return fail("ludo_mode_invalid");
      if (typeof seats !== "number" || !Number.isInteger(seats) || seats < 2 || seats > 4)
        return fail("ludo_seats_invalid");
      return ok({ type, idempotencyKey, mode: value.mode, seats });
    }
    case "join_match":
    case "roll_dice":
    case "claim_timeout":
    case "surrender":
    case "rematch": {
      if (!isMatchId(value.match_id)) return fail("ludo_match_id_invalid");
      return ok({ type, idempotencyKey, matchId: value.match_id });
    }
    case "move_token": {
      const tokenId = value.token_id;
      if (!isMatchId(value.match_id)) return fail("ludo_match_id_invalid");
      if (typeof tokenId !== "number" || !Number.isInteger(tokenId) || tokenId < 0 || tokenId > 3)
        return fail("ludo_token_id_invalid");
      return ok({ type, idempotencyKey, matchId: value.match_id, tokenId });
    }
    default:
      return fail("ludo_command_type_unknown");
  }
}

export function parseCreateMatchmakingTicketRequest(
  value: unknown,
): LudoValidationResult<LudoCreateMatchmakingTicketRequest> {
  if (!isObject(value)) return fail("ludo_ticket_request_must_be_object");
  const { mode, idempotency_key: idempotencyKey } = value;
  const seatTarget = value.seat_target;
  if (!isMode(mode)) return fail("ludo_mode_invalid");
  if (!isSeatTarget(seatTarget)) return fail("ludo_seat_target_invalid");
  if (!isIdempotencyKey(idempotencyKey)) return fail("ludo_idempotency_key_invalid");
  return ok({ mode, seatTarget, idempotencyKey });
}

export function parseTicketIdParam(value: string): LudoValidationResult<string> {
  if (!isTicketId(value)) return fail("ludo_ticket_id_invalid");
  return ok(value);
}

/** `POST /:environment/rooms` request body. */
export function parseCreateRoomRequest(
  value: unknown,
): LudoValidationResult<LudoCreateRoomRequest> {
  if (!isObject(value)) return fail("ludo_room_request_must_be_object");
  const { mode, idempotency_key: idempotencyKey } = value;
  const seatTarget = value.seat_target;
  if (!isMode(mode)) return fail("ludo_mode_invalid");
  if (!isSeatTarget(seatTarget)) return fail("ludo_seat_target_invalid");
  if (!isIdempotencyKey(idempotencyKey)) return fail("ludo_idempotency_key_invalid");
  return ok({ mode, seatTarget, idempotencyKey });
}

/** `POST /:environment/rooms/:roomCode/join` request body. */
export function parseJoinRoomRequest(value: unknown): LudoValidationResult<LudoJoinRoomRequest> {
  if (!isObject(value)) return fail("ludo_room_request_must_be_object");
  const { idempotency_key: idempotencyKey } = value;
  if (!isIdempotencyKey(idempotencyKey)) return fail("ludo_idempotency_key_invalid");
  return ok({ idempotencyKey });
}

export function parseRoomCodeParam(value: string): LudoValidationResult<string> {
  if (!isRoomCode(value)) return fail("ludo_room_code_invalid");
  return ok(value);
}

export function parseEnvironmentParam(
  value: string,
): LudoValidationResult<"debug" | "staging" | "production"> {
  if (!isGameEnvironment(value)) return fail("ludo_invalid_environment");
  return ok(value);
}
