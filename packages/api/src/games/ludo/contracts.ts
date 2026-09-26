import type { GameEnvironment, GameSession } from "../contracts";

export const LUDO_APP_ID = "ludo" as const;
export const LUDO_CONTRACT_VERSION = "ludo.v1" as const;
export const LUDO_SCHEMA_VERSION = 1 as const;

export type LudoMode = "classic" | "quick";
export type LudoMatchStatus = "waiting" | "active" | "finished" | "abandoned";
export type LudoTokenPlayState = "yard" | "active" | "finished";
export type LudoMatchPhase = "awaiting_roll" | "awaiting_move" | "finished";
export type LudoColor = "red" | "green" | "yellow" | "blue";
export type LudoEnvironment = GameEnvironment;
export type LudoSession = GameSession & { appId: typeof LUDO_APP_ID };

export interface LudoToken {
  id: number;
  pathPosition: number;
}

export interface LudoPlayerState {
  seat: number;
  subject: string;
  color: LudoColor;
  tokens: LudoToken[];
  captureCount: number;
}

export interface LudoMatchSummary {
  matchId: string;
  environment: LudoEnvironment;
  mode: LudoMode;
  status: LudoMatchStatus;
  playerCount: number;
  seats: number;
  createdAt: string;
  updatedAt: string;
}

export interface LudoMatchState {
  matchId: string;
  environment: LudoEnvironment;
  mode: LudoMode;
  status: LudoMatchStatus;
  players: LudoPlayerState[];
  currentPlayerIndex: number;
  phase: LudoMatchPhase;
  currentRoll: number | null;
  consecutiveSixes: number;
  winnerOrder: number[];
  deadlineAt: string | null;
  updatedAt: string;
}

interface LudoCommandBase {
  idempotencyKey: string;
}

export interface LudoCreateMatchCommand extends LudoCommandBase {
  type: "create_match";
  mode: LudoMode;
  seats: number;
}

export interface LudoJoinMatchCommand extends LudoCommandBase {
  type: "join_match";
  matchId: string;
}

export interface LudoRollDiceCommand extends LudoCommandBase {
  type: "roll_dice";
  matchId: string;
}

export interface LudoMoveTokenCommand extends LudoCommandBase {
  type: "move_token";
  matchId: string;
  tokenId: number;
}

export interface LudoClaimTimeoutCommand extends LudoCommandBase {
  type: "claim_timeout";
  matchId: string;
}

export interface LudoSurrenderCommand extends LudoCommandBase {
  type: "surrender";
  matchId: string;
}

export interface LudoRematchCommand extends LudoCommandBase {
  type: "rematch";
  matchId: string;
}

export type LudoCommand =
  | LudoCreateMatchCommand
  | LudoJoinMatchCommand
  | LudoRollDiceCommand
  | LudoMoveTokenCommand
  | LudoClaimTimeoutCommand
  | LudoSurrenderCommand
  | LudoRematchCommand;

export type LudoCommandType = LudoCommand["type"];

interface LudoEventBase {
  eventId: string;
  matchId: string;
  sequence: number;
  createdAt: string;
}

export interface LudoDiceRolledEvent extends LudoEventBase {
  type: "dice_rolled";
  seat: number;
  roll: number;
}

export interface LudoTokenMovedEvent extends LudoEventBase {
  type: "token_moved";
  seat: number;
  tokenId: number;
  fromPathPosition: number;
  toPathPosition: number;
}

export interface LudoTokenCapturedEvent extends LudoEventBase {
  type: "token_captured";
  seat: number;
  tokenId: number;
  capturedSeat: number;
  capturedTokenId: number;
}

export interface LudoTokenFinishedEvent extends LudoEventBase {
  type: "token_finished";
  seat: number;
  tokenId: number;
}

export interface LudoTurnForfeitedEvent extends LudoEventBase {
  type: "turn_forfeited";
  seat: number;
  reason: string;
}

export interface LudoMatchFinishedEvent extends LudoEventBase {
  type: "match_finished";
  winnerOrder: number[];
}

export interface LudoPlayerJoinedEvent extends LudoEventBase {
  type: "player_joined";
  seat: number;
  subject: string;
}

export interface LudoPlayerLeftEvent extends LudoEventBase {
  type: "player_left";
  seat: number;
}

export interface LudoBotFilledEvent extends LudoEventBase {
  type: "bot_filled";
  seat: number;
}

export interface LudoTurnTimedOutEvent extends LudoEventBase {
  type: "turn_timed_out";
  seat: number;
}

export interface LudoSeatForfeitedEvent extends LudoEventBase {
  type: "seat_forfeited";
  seat: number;
}

export interface LudoMatchAbandonedEvent extends LudoEventBase {
  type: "match_abandoned";
}

export type LudoEvent =
  | LudoDiceRolledEvent
  | LudoTokenMovedEvent
  | LudoTokenCapturedEvent
  | LudoTokenFinishedEvent
  | LudoTurnForfeitedEvent
  | LudoMatchFinishedEvent
  | LudoPlayerJoinedEvent
  | LudoPlayerLeftEvent
  | LudoBotFilledEvent
  | LudoTurnTimedOutEvent
  | LudoSeatForfeitedEvent
  | LudoMatchAbandonedEvent;

export type LudoEventType = LudoEvent["type"];

export type LudoMatchmakingTicketStatus = "searching" | "matched" | "cancelled" | "expired";

/** Wire-facing shape of a `ludo_matchmaking_tickets` row (task 20). */
export interface LudoMatchmakingTicket {
  ticketId: string;
  environment: LudoEnvironment;
  subject: string;
  mode: LudoMode;
  seatTarget: number;
  status: LudoMatchmakingTicketStatus;
  matchedMatchId: string | null;
  createdAt: string;
  expiresAt: string;
}

/** `POST /:environment/matchmaking/tickets` request body. */
export interface LudoCreateMatchmakingTicketRequest {
  mode: LudoMode;
  seatTarget: number;
  idempotencyKey: string;
}

export type LudoRoomStatus = "waiting" | "matched" | "expired";

/** Wire-facing shape of a `ludo_rooms` row (task 16's schema, task 21's private-rooms flow). */
export interface LudoRoom {
  roomCode: string;
  environment: LudoEnvironment;
  ownerSubject: string;
  mode: LudoMode;
  seatTarget: number;
  /** Derived, not stored: `"matched"` once `matchId` is set, else `"expired"` past `expiresAt`, else `"waiting"`. */
  status: LudoRoomStatus;
  matchId: string | null;
  createdAt: string;
  expiresAt: string;
}

/** `POST /:environment/rooms` request body. */
export interface LudoCreateRoomRequest {
  mode: LudoMode;
  seatTarget: number;
  idempotencyKey: string;
}

/** `POST /:environment/rooms/:roomCode/join` request body. */
export interface LudoJoinRoomRequest {
  idempotencyKey: string;
}

/**
 * Deep-link scheme for Ludo, mirroring `namespaces("ludo").deepLink` from
 * the game registry (`scripts/games/registry-games.ts`, task 00:
 * `w3dev-${id}`). Duplicated here as a plain constant rather than imported,
 * since `packages/api` does not depend on `scripts/games` (its `tsconfig.json`
 * scopes `rootDir`/`include` to `src`).
 */
export const LUDO_DEEP_LINK_SCHEME = "w3dev-ludo" as const;

/** Shareable deep-link invite string for a room's `room_code` (client-side handling is task 26). */
export function ludoRoomInviteLink(roomCode: string): string {
  return `${LUDO_DEEP_LINK_SCHEME}://room/${roomCode}`;
}

export interface LudoSessionResponse {
  contractVersion: typeof LUDO_CONTRACT_VERSION;
  gameToken: string;
  appId: typeof LUDO_APP_ID;
  environment: LudoEnvironment;
  subject: string;
  expiresIn: number;
}

export interface LudoErrorResponse {
  contract_version: typeof LUDO_CONTRACT_VERSION;
  error: {
    code: string;
    message: string;
    diagnostic_id: string;
  };
}
