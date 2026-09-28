import { randomUUID } from "node:crypto";
import type { LudoErrorResponse } from "./contracts";
import { LUDO_CONTRACT_VERSION } from "./contracts";

export type LudoErrorCode =
  | "ludo_invalid_command"
  | "ludo_match_not_found"
  | "ludo_forbidden_role"
  | "ludo_token_configuration_unavailable"
  | "ludo_invalid_environment"
  | "ludo_authentication_required"
  | "ludo_unavailable"
  | "ludo_wrong_turn"
  | "ludo_wrong_phase"
  | "ludo_illegal_move"
  | "ludo_idempotency_conflict"
  | "ludo_match_not_joinable"
  | "ludo_timeout_not_elapsed"
  | "ludo_ticket_not_found"
  | "ludo_ticket_forbidden"
  | "ludo_ticket_not_cancellable"
  | "ludo_room_not_found"
  | "ludo_room_expired"
  | "ludo_room_code_exhausted"
  | "ludo_room_forbidden"
  | "ludo_xp_claim_invalid"
  | "ludo_xp_daily_cap_exceeded"
  | "ludo_xp_claim_implausible"
  | "ludo_daily_reward_already_claimed"
  | "ludo_daily_reward_invalid";

export class LudoError extends Error {
  readonly diagnosticId: string;

  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 503,
    readonly code: LudoErrorCode,
    message: string,
  ) {
    super(message);
    this.diagnosticId = randomUUID();
  }

  response(): LudoErrorResponse {
    return {
      contract_version: LUDO_CONTRACT_VERSION,
      error: { code: this.code, message: this.message, diagnostic_id: this.diagnosticId },
    };
  }
}

export function asLudoError(error: unknown): LudoError {
  if (error instanceof LudoError) return error;
  return new LudoError(503, "ludo_unavailable", "Ludo service is unavailable");
}

// ---------------------------------------------------------------------------
// Command-service rejection paths (task 18): a transactional command is
// rejected before any engine logic runs when the match does not exist, the
// caller does not hold a seat in it, it is not the caller's turn, the
// command does not fit the match's current phase, the requested move is not
// legal for the pending roll, or a repeated idempotency key is attached to a
// mismatched command. Every subclass below fixes the status/code so call
// sites only need to supply a message where one varies.
// ---------------------------------------------------------------------------

/** Base class for every `processCommand`/`createMatch`/`joinMatch` rejection. */
export class LudoCommandError extends LudoError {}

export class LudoMatchNotFoundError extends LudoCommandError {
  constructor(matchId: string) {
    super(404, "ludo_match_not_found", `Ludo match not found: ${matchId}`);
  }
}

/** The caller's subject does not own a seat in this match. */
export class LudoForbiddenSeatError extends LudoCommandError {
  constructor(message = "The caller does not control a seat in this match") {
    super(403, "ludo_forbidden_role", message);
  }
}

/** The caller owns a seat, but it is not that seat's turn. */
export class LudoWrongTurnError extends LudoCommandError {
  constructor() {
    super(409, "ludo_wrong_turn", "It is not the caller's turn");
  }
}

/** The command does not apply to the match's current phase/status (e.g. rolling while awaiting a move). */
export class LudoWrongPhaseError extends LudoCommandError {
  constructor(message = "The command is not valid in the match's current phase") {
    super(409, "ludo_wrong_phase", message);
  }
}

/** `move_token` targeted a token id that is not among the current legal moves. */
export class LudoIllegalMoveError extends LudoCommandError {
  constructor(message = "The requested move is not legal for the current roll") {
    super(422, "ludo_illegal_move", message);
  }
}

/** A repeated idempotency key is attached to a command of a different type/payload. */
export class LudoIdempotencyConflictError extends LudoCommandError {
  constructor() {
    super(
      409,
      "ludo_idempotency_conflict",
      "The idempotency key is already attached to a different command",
    );
  }
}

/** `create_match`/`join_match` rejected: bad seat count, full match, already joined, or not waiting. */
export class LudoMatchNotJoinableError extends LudoCommandError {
  constructor(message: string) {
    super(409, "ludo_match_not_joinable", message);
  }
}

/**
 * `claim_timeout` rejected because `now` has not actually passed the
 * caller's own seat's `turn_deadline_at` yet — the lazy check that runs
 * ahead of every read/command (task 19) found nothing to apply.
 */
export class LudoTimeoutNotElapsedError extends LudoCommandError {
  constructor() {
    super(409, "ludo_timeout_not_elapsed", "The current turn has not yet timed out");
  }
}

// ---------------------------------------------------------------------------
// Matchmaking-ticket rejection paths (task 20).
// ---------------------------------------------------------------------------

export class LudoTicketNotFoundError extends LudoCommandError {
  constructor(ticketId: string) {
    super(404, "ludo_ticket_not_found", `Ludo matchmaking ticket not found: ${ticketId}`);
  }
}

/** The caller's subject does not own this ticket. */
export class LudoTicketForbiddenError extends LudoCommandError {
  constructor() {
    super(403, "ludo_ticket_forbidden", "The caller does not own this matchmaking ticket");
  }
}

/** `DELETE .../tickets/:ticketId` on a ticket that is no longer `searching`. */
export class LudoTicketNotCancellableError extends LudoCommandError {
  constructor() {
    super(409, "ludo_ticket_not_cancellable", "The ticket is no longer searching");
  }
}

// ---------------------------------------------------------------------------
// Private-room rejection paths (task 21).
// ---------------------------------------------------------------------------

export class LudoRoomNotFoundError extends LudoCommandError {
  constructor(roomCode: string) {
    super(404, "ludo_room_not_found", `Ludo room not found: ${roomCode}`);
  }
}

/** `POST .../rooms/:roomCode/join` on a room that expired before it filled. */
export class LudoRoomExpiredError extends LudoCommandError {
  constructor(roomCode: string) {
    super(409, "ludo_room_expired", `Ludo room has expired: ${roomCode}`);
  }
}

/** Room-code generation could not find a non-colliding code within its retry budget (practically unreachable). */
export class LudoRoomCodeExhaustedError extends LudoCommandError {
  constructor() {
    super(503, "ludo_room_code_exhausted", "Could not generate a unique room code");
  }
}

/** `GET .../rooms/:roomCode` (task 26) by a caller who isn't the room's owner. */
export class LudoRoomForbiddenError extends LudoCommandError {
  constructor() {
    super(403, "ludo_room_forbidden", "The caller does not own this room");
  }
}

// ---------------------------------------------------------------------------
// Wallet/progression rejection paths (task 26b).
// ---------------------------------------------------------------------------

/** `POST .../xp/claim` with a malformed body (missing/non-positive `xp_delta`,
 * missing `claim_id`, or a negative `elapsed_ms`/`matches_completed`). */
export class LudoXpClaimInvalidError extends LudoCommandError {
  constructor(
    message = "A valid xp_delta, claim_id, elapsed_ms and matches_completed are required",
  ) {
    super(422, "ludo_xp_claim_invalid", message);
  }
}

/** The claim's `xp_delta`, added to what the subject already claimed today
 * (UTC), would exceed `LudoXpConfig.offlineDailyXpCap`. Rejected outright —
 * never clamped — per task 26b's Context. */
export class LudoXpDailyCapExceededError extends LudoCommandError {
  constructor() {
    super(429, "ludo_xp_daily_cap_exceeded", "The subject's daily XP claim cap has been reached");
  }
}

/** The claim's `xp_delta`/`matches_completed`/`elapsed_ms` combination
 * could not plausibly have been earned by legitimate play (e.g. more XP
 * than `matches_completed * matchWinXp`, or more matches than
 * `elapsed_ms` could fit at a generous minimum match duration). */
export class LudoXpClaimImplausibleError extends LudoCommandError {
  constructor(message: string) {
    super(422, "ludo_xp_claim_implausible", message);
  }
}

/** `POST .../daily-reward/claim` called again for a subject that already
 * claimed today (UTC). */
export class LudoDailyRewardAlreadyClaimedError extends LudoCommandError {
  constructor() {
    super(
      409,
      "ludo_daily_reward_already_claimed",
      "The daily reward has already been claimed today",
    );
  }
}
