import type { LudoEnvironment, LudoMode } from "./contracts";

export const LUDO_STORE_APP_ID = "ludo" as const;
export const LUDO_STATE_SCHEMA_VERSION = 1 as const;

/** Storage-row shape for `ludo_matches`; distinct from the wire-level `LudoMatchState`. */
export interface LudoMatchRow {
  matchId: string;
  environment: LudoEnvironment;
  mode: LudoMode;
  status: string;
  seatCount: number;
  rulesVersion: string;
  currentTurnSeat: number;
  phase: string;
  sixStreak: number;
  turnDeadlineAt: string | null;
  revision: number;
  matchOrigin: "matchmaking" | "room" | "direct";
  createdAt: string;
  updatedAt: string;
}

export interface LudoPlayerRow {
  matchId: string;
  environment: LudoEnvironment;
  seat: number;
  subject: string | null;
  isBot: boolean;
  botDifficulty: string | null;
  displayNameCache: string | null;
  connectedAt: string | null;
  missCount: number;
}

export interface LudoEventRow {
  matchId: string;
  environment: LudoEnvironment;
  sequence: number;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

export interface LudoCommandRow {
  matchId: string;
  environment: LudoEnvironment;
  idempotencyKey: string;
  commandType: string;
  resultSummary: unknown;
  createdAt: string;
}

export interface LudoMatchmakingTicketRow {
  ticketId: string;
  environment: LudoEnvironment;
  subject: string;
  mode: LudoMode;
  seatTarget: number;
  status: "searching" | "matched" | "cancelled" | "expired";
  matchedMatchId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface LudoRoomRow {
  roomCode: string;
  environment: LudoEnvironment;
  ownerSubject: string;
  mode: LudoMode;
  seatTarget: number;
  matchId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface LudoState {
  schemaVersion: typeof LUDO_STATE_SCHEMA_VERSION;
  matches: LudoMatchRow[];
  players: LudoPlayerRow[];
  events: LudoEventRow[];
  commands: LudoCommandRow[];
  matchmakingTickets: LudoMatchmakingTicketRow[];
  rooms: LudoRoomRow[];
}

export interface LudoStore {
  read<T>(environment: LudoEnvironment, operation: (state: LudoState) => Promise<T>): Promise<T>;
  transact<T>(
    environment: LudoEnvironment,
    operation: (state: LudoState) => Promise<T>,
  ): Promise<T>;
}

export function emptyLudoState(): LudoState {
  return {
    schemaVersion: LUDO_STATE_SCHEMA_VERSION,
    matches: [],
    players: [],
    events: [],
    commands: [],
    matchmakingTickets: [],
    rooms: [],
  };
}

export function cloneLudoState(state: LudoState): LudoState {
  return JSON.parse(JSON.stringify(state)) as LudoState;
}

export class LudoStorageError extends Error {
  readonly code: string;

  constructor(message: string, code = "ludo_storage_unavailable") {
    super(message);
    this.code = code;
  }
}

export class UnavailableLudoStore implements LudoStore {
  async read<T>(): Promise<T> {
    throw new LudoStorageError("No Ludo database is configured");
  }

  async transact<T>(): Promise<T> {
    throw new LudoStorageError("No Ludo database is configured");
  }
}
