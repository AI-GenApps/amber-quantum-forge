import type {
  LudoCommand,
  LudoEvent,
  LudoMatchmakingTicket,
  LudoMatchState,
  LudoMatchSummary,
  LudoMode,
  LudoPlayerState,
  LudoRoom,
  LudoSessionResponse,
  LudoToken,
} from "./contracts";

function tokenToWire(value: LudoToken) {
  return { id: value.id, path_position: value.pathPosition };
}

function tokenFromWire(value: { id: number; path_position: number }): LudoToken {
  return { id: value.id, pathPosition: value.path_position };
}

function playerToWire(value: LudoPlayerState) {
  return {
    seat: value.seat,
    subject: value.subject,
    color: value.color,
    tokens: value.tokens.map(tokenToWire),
    capture_count: value.captureCount,
  };
}

function playerFromWire(value: {
  seat: number;
  subject: string;
  color: LudoPlayerState["color"];
  tokens: { id: number; path_position: number }[];
  capture_count: number;
}): LudoPlayerState {
  return {
    seat: value.seat,
    subject: value.subject,
    color: value.color,
    tokens: value.tokens.map(tokenFromWire),
    captureCount: value.capture_count,
  };
}

export function matchSummaryToWire(value: LudoMatchSummary) {
  return {
    match_id: value.matchId,
    environment: value.environment,
    mode: value.mode,
    status: value.status,
    player_count: value.playerCount,
    seats: value.seats,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
  };
}

export function matchSummaryFromWire(
  value: ReturnType<typeof matchSummaryToWire>,
): LudoMatchSummary {
  return {
    matchId: value.match_id,
    environment: value.environment,
    mode: value.mode,
    status: value.status,
    playerCount: value.player_count,
    seats: value.seats,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export function toWireMatchState(value: LudoMatchState) {
  return {
    match_id: value.matchId,
    environment: value.environment,
    mode: value.mode,
    status: value.status,
    players: value.players.map(playerToWire),
    current_player_index: value.currentPlayerIndex,
    phase: value.phase,
    current_roll: value.currentRoll,
    consecutive_sixes: value.consecutiveSixes,
    winner_order: [...value.winnerOrder],
    deadline_at: value.deadlineAt,
    updated_at: value.updatedAt,
  };
}

export function fromWireMatchState(value: ReturnType<typeof toWireMatchState>): LudoMatchState {
  return {
    matchId: value.match_id,
    environment: value.environment,
    mode: value.mode,
    status: value.status,
    players: value.players.map(playerFromWire),
    currentPlayerIndex: value.current_player_index,
    phase: value.phase,
    currentRoll: value.current_roll,
    consecutiveSixes: value.consecutive_sixes,
    winnerOrder: [...value.winner_order],
    deadlineAt: value.deadline_at,
    updatedAt: value.updated_at,
  };
}

export function toWireCommand(value: LudoCommand): Record<string, unknown> {
  const { type, idempotencyKey, ...rest } = value;
  const wire: Record<string, unknown> = { type, idempotency_key: idempotencyKey };
  if ("matchId" in rest) wire.match_id = (rest as { matchId: string }).matchId;
  if ("mode" in rest) wire.mode = (rest as { mode: string }).mode;
  if ("seats" in rest) wire.seats = (rest as { seats: number }).seats;
  if ("tokenId" in rest) wire.token_id = (rest as { tokenId: number }).tokenId;
  return wire;
}

export function fromWireCommand(value: Record<string, unknown>): LudoCommand | null {
  const type = value.type;
  const idempotencyKey = value.idempotency_key;
  if (typeof type !== "string" || typeof idempotencyKey !== "string") return null;
  const base = { idempotencyKey };
  switch (type) {
    case "create_match":
      if (typeof value.mode !== "string" || typeof value.seats !== "number") return null;
      return {
        type,
        ...base,
        mode: value.mode as LudoMode,
        seats: value.seats,
      };
    case "join_match":
    case "roll_dice":
    case "claim_timeout":
    case "surrender":
    case "rematch":
      if (typeof value.match_id !== "string") return null;
      return { type, ...base, matchId: value.match_id };
    case "move_token":
      if (typeof value.match_id !== "string" || typeof value.token_id !== "number") return null;
      return { type, ...base, matchId: value.match_id, tokenId: value.token_id };
    default:
      return null;
  }
}

export function eventToWire(value: LudoEvent): Record<string, unknown> {
  const { type, eventId, matchId, sequence, createdAt, ...rest } = value;
  return {
    type,
    event_id: eventId,
    match_id: matchId,
    sequence,
    created_at: createdAt,
    ...snakeCaseShallow(rest as Record<string, unknown>),
  };
}

function snakeCaseShallow(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = val;
  }
  return result;
}

export function eventFromWire(value: Record<string, unknown>): LudoEvent | null {
  const type = value.type;
  const eventId = value.event_id;
  const matchId = value.match_id;
  const sequence = value.sequence;
  const createdAt = value.created_at;
  if (
    typeof type !== "string" ||
    typeof eventId !== "string" ||
    typeof matchId !== "string" ||
    typeof sequence !== "number" ||
    typeof createdAt !== "string"
  )
    return null;
  const base = { eventId, matchId, sequence, createdAt };
  switch (type) {
    case "dice_rolled":
      if (typeof value.seat !== "number" || typeof value.roll !== "number") return null;
      return { type, ...base, seat: value.seat, roll: value.roll };
    case "token_moved":
      if (
        typeof value.seat !== "number" ||
        typeof value.token_id !== "number" ||
        typeof value.from_path_position !== "number" ||
        typeof value.to_path_position !== "number"
      )
        return null;
      return {
        type,
        ...base,
        seat: value.seat,
        tokenId: value.token_id,
        fromPathPosition: value.from_path_position,
        toPathPosition: value.to_path_position,
      };
    case "token_captured":
      if (
        typeof value.seat !== "number" ||
        typeof value.token_id !== "number" ||
        typeof value.captured_seat !== "number" ||
        typeof value.captured_token_id !== "number"
      )
        return null;
      return {
        type,
        ...base,
        seat: value.seat,
        tokenId: value.token_id,
        capturedSeat: value.captured_seat,
        capturedTokenId: value.captured_token_id,
      };
    case "token_finished":
      if (typeof value.seat !== "number" || typeof value.token_id !== "number") return null;
      return { type, ...base, seat: value.seat, tokenId: value.token_id };
    case "turn_forfeited":
      if (typeof value.seat !== "number" || typeof value.reason !== "string") return null;
      return { type, ...base, seat: value.seat, reason: value.reason };
    case "match_finished":
      if (!Array.isArray(value.winner_order)) return null;
      return { type, ...base, winnerOrder: value.winner_order as number[] };
    case "player_joined":
      if (typeof value.seat !== "number" || typeof value.subject !== "string") return null;
      return { type, ...base, seat: value.seat, subject: value.subject };
    case "player_left":
      if (typeof value.seat !== "number") return null;
      return { type, ...base, seat: value.seat };
    case "bot_filled":
      if (typeof value.seat !== "number") return null;
      return { type, ...base, seat: value.seat };
    case "turn_timed_out":
      if (typeof value.seat !== "number") return null;
      return { type, ...base, seat: value.seat };
    case "seat_forfeited":
      if (typeof value.seat !== "number") return null;
      return { type, ...base, seat: value.seat };
    case "match_abandoned":
      return { type, ...base };
    default:
      return null;
  }
}

export function matchmakingTicketToWire(value: LudoMatchmakingTicket) {
  return {
    ticket_id: value.ticketId,
    environment: value.environment,
    subject: value.subject,
    mode: value.mode,
    seat_target: value.seatTarget,
    status: value.status,
    matched_match_id: value.matchedMatchId,
    created_at: value.createdAt,
    expires_at: value.expiresAt,
  };
}

export function matchmakingTicketFromWire(
  value: ReturnType<typeof matchmakingTicketToWire>,
): LudoMatchmakingTicket {
  return {
    ticketId: value.ticket_id,
    environment: value.environment,
    subject: value.subject,
    mode: value.mode,
    seatTarget: value.seat_target,
    status: value.status,
    matchedMatchId: value.matched_match_id,
    createdAt: value.created_at,
    expiresAt: value.expires_at,
  };
}

/** Wire shape of a `ludo_rooms` row (task 21). */
export function roomToWire(value: LudoRoom) {
  return {
    room_code: value.roomCode,
    environment: value.environment,
    owner_subject: value.ownerSubject,
    mode: value.mode,
    seat_target: value.seatTarget,
    status: value.status,
    match_id: value.matchId,
    created_at: value.createdAt,
    expires_at: value.expiresAt,
  };
}

export function roomFromWire(value: ReturnType<typeof roomToWire>): LudoRoom {
  return {
    roomCode: value.room_code,
    environment: value.environment,
    ownerSubject: value.owner_subject,
    mode: value.mode,
    seatTarget: value.seat_target,
    status: value.status,
    matchId: value.match_id,
    createdAt: value.created_at,
    expiresAt: value.expires_at,
  };
}

export function sessionResponseToWire(value: LudoSessionResponse) {
  return {
    contract_version: value.contractVersion,
    game_token: value.gameToken,
    app_id: value.appId,
    environment: value.environment,
    subject: value.subject,
    expires_in: value.expiresIn,
  };
}
