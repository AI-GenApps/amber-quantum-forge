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
  | LudoTurnTimedOutEvent;

export type LudoEventType = LudoEvent["type"];

/**
 * Stub type names only, deferred to tasks 20/21 — exported now so those
 * tasks do not need to touch this module's export list twice.
 */
export interface LudoDailyMatchmakingTicket {
  ticketId: string;
  subject: string;
  mode: LudoMode;
  createdAt: string;
}

export interface LudoRoom {
  roomId: string;
  inviteCode: string;
  hostSubject: string;
  mode: LudoMode;
  createdAt: string;
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
