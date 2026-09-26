/// Private rooms with shareable invite codes (task 21): create-by-code,
/// join-by-code, and a shareable deep-link invite string, layered on top of
/// `LudoStore` (task 16's `ludo_rooms` table) and task 18's
/// `createMatch`/`joinMatch`.
///
/// `ludo_rooms` has no players-roster column and this task adds no
/// migration, so a room cannot durably track partial joins on its own row.
/// Instead the underlying match is created on the room's *first* join (the
/// owner seated at seat 0 via `createMatch`, `matchOrigin: "room"`, then the
/// joining subject seated via `joinMatch`), and `ludo_rooms.match_id` is set
/// exactly once, at that moment. Every later join against the same room
/// code reuses the already-known `matchId` and is just a plain
/// `joinMatch` call — which already fills the room to `seatTarget` and
/// transitions the match `waiting` -> `active` on its last seat, exactly
/// as task 18 built it. For a 2-seat room (the common friend-duel case)
/// this first join *is* the join-to-full transition; for a 4-seat room the
/// match is simply created earlier and filled progressively, using the
/// same idempotent, atomic `joinMatch` machinery either way.
import { randomInt } from "node:crypto";
import type {
  LudoEnvironment,
  LudoMatchState,
  LudoMode,
  LudoRoom,
  LudoRoomStatus,
} from "./contracts";
import { ludoRoomInviteLink } from "./contracts";
import { LudoRoomCodeExhaustedError, LudoRoomExpiredError, LudoRoomNotFoundError } from "./errors";
import { createMatch, joinMatch } from "./service";
import type { LudoRoomRow, LudoStore } from "./store";

/** Default room fill window, overridable via `LUDO_ROOM_EXPIRY_HOURS`. */
export const LUDO_ROOM_EXPIRY_DEFAULT_HOURS = 24;

/** Bounds how many expired, still-unfilled rooms a single sweep invocation removes. */
export const LUDO_ROOM_SWEEP_LIMIT = 200;

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_MAX_ATTEMPTS = 10;

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

function resolveRoomExpiryMs(): number {
  const raw = process.env.LUDO_ROOM_EXPIRY_HOURS;
  const hours = raw ? Number(raw) : Number.NaN;
  const resolvedHours =
    Number.isFinite(hours) && hours > 0 ? hours : LUDO_ROOM_EXPIRY_DEFAULT_HOURS;
  return resolvedHours * 60 * 60 * 1000;
}

function computeRoomStatus(row: LudoRoomRow, nowMs: number): LudoRoomStatus {
  if (row.matchId) return "matched";
  if (Date.parse(row.expiresAt) <= nowMs) return "expired";
  return "waiting";
}

function toContractRoom(row: LudoRoomRow, nowMs: number = Date.now()): LudoRoom {
  return {
    roomCode: row.roomCode,
    environment: row.environment,
    ownerSubject: row.ownerSubject,
    mode: row.mode,
    seatTarget: row.seatTarget,
    status: computeRoomStatus(row, nowMs),
    matchId: row.matchId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export interface CreateRoomInput {
  subject: string;
  mode: LudoMode;
  seatTarget: number;
  idempotencyKey: string;
}

export interface CreateRoomResult {
  room: LudoRoom;
  inviteLink: string;
  idempotent: boolean;
}

export interface CreateRoomDependencies {
  /** Overridable in tests to force/prove room-code collision retries deterministically. */
  roomCodeGenerator?: () => string;
}

/**
 * Creates a `ludo_rooms` row with a collision-checked `room_code`.
 * `ludo_rooms` has no idempotency-key column, so a repeated call by the
 * same owner for the same still-open (unfilled, unexpired) `(mode,
 * seatTarget)` returns that existing room rather than minting a second
 * code — mirroring `createTicket`'s subject-scoped dedup (task 20).
 */
export async function createRoom(
  store: LudoStore,
  environment: LudoEnvironment,
  input: CreateRoomInput,
  dependencies: CreateRoomDependencies = {},
): Promise<CreateRoomResult> {
  const generateCode = dependencies.roomCodeGenerator ?? generateRoomCode;

  return store.transact(environment, async (state) => {
    const nowIso = new Date().toISOString();
    const nowMs = Date.parse(nowIso);

    const existing = state.rooms.find(
      (r) =>
        r.ownerSubject === input.subject &&
        r.mode === input.mode &&
        r.seatTarget === input.seatTarget &&
        r.matchId === null &&
        Date.parse(r.expiresAt) > nowMs,
    );
    if (existing) {
      return {
        room: toContractRoom(existing, nowMs),
        inviteLink: ludoRoomInviteLink(existing.roomCode),
        idempotent: true,
      };
    }

    let roomCode: string | null = null;
    for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt++) {
      const candidate = generateCode();
      // Collision-checked against unexpired rooms only: an expired code is
      // free to reissue.
      const collides = state.rooms.some(
        (r) => r.roomCode === candidate && Date.parse(r.expiresAt) > nowMs,
      );
      if (!collides) {
        roomCode = candidate;
        break;
      }
    }
    if (roomCode === null) throw new LudoRoomCodeExhaustedError();

    const row: LudoRoomRow = {
      roomCode,
      environment,
      ownerSubject: input.subject,
      mode: input.mode,
      seatTarget: input.seatTarget,
      matchId: null,
      createdAt: nowIso,
      expiresAt: new Date(nowMs + resolveRoomExpiryMs()).toISOString(),
    };
    state.rooms.push(row);

    return {
      room: toContractRoom(row, nowMs),
      inviteLink: ludoRoomInviteLink(roomCode),
      idempotent: false,
    };
  });
}

export interface JoinRoomInput {
  subject: string;
  roomCode: string;
  idempotencyKey: string;
}

export interface JoinRoomResult {
  room: LudoRoom;
  matchState: LudoMatchState;
  idempotent: boolean;
}

/**
 * Joins `input.subject` into the room identified by `input.roomCode`. On
 * the room's first join this also forms the underlying match (see the
 * module doc comment); on every later join it is a plain, idempotent
 * `joinMatch` call against the room's already-known match.
 */
export async function joinRoom(
  store: LudoStore,
  environment: LudoEnvironment,
  input: JoinRoomInput,
): Promise<JoinRoomResult> {
  const roomSnapshot = await store.read(
    environment,
    async (state) => state.rooms.find((r) => r.roomCode === input.roomCode) ?? null,
  );
  if (!roomSnapshot) throw new LudoRoomNotFoundError(input.roomCode);

  const nowMs = Date.now();
  if (!roomSnapshot.matchId && Date.parse(roomSnapshot.expiresAt) <= nowMs) {
    throw new LudoRoomExpiredError(input.roomCode);
  }

  let matchId = roomSnapshot.matchId;
  if (!matchId) {
    const created = await createMatch(
      store,
      environment,
      {
        subject: roomSnapshot.ownerSubject,
        mode: roomSnapshot.mode,
        seats: roomSnapshot.seatTarget,
        // Deterministic per room, so a concurrent/duplicate first join can
        // never spawn a second match for the same room (`createMatch`'s own
        // idempotency-key dedup returns the same match to every caller).
        idempotencyKey: `room:${roomSnapshot.roomCode}:create`,
      },
      "room",
    );
    matchId = created.matchState.matchId;

    await store.transact(environment, async (state) => {
      const row = state.rooms.find((r) => r.roomCode === roomSnapshot.roomCode);
      if (row && !row.matchId) row.matchId = matchId as string;
      return undefined;
    });
  }

  const joinResult = await joinMatch(store, environment, {
    subject: input.subject,
    matchId,
    idempotencyKey: input.idempotencyKey,
  });

  const room = await store.read(environment, async (state) => {
    const row = state.rooms.find((r) => r.roomCode === input.roomCode);
    if (!row) throw new LudoRoomNotFoundError(input.roomCode);
    return toContractRoom(row);
  });

  return { room, matchState: joinResult.matchState, idempotent: joinResult.idempotent };
}

export interface SweepRoomsResult {
  /** Number of expired, still-unfilled rooms removed by this call. */
  expired: number;
}

/**
 * Sweeps rooms that never filled within their window: removes any
 * `matchId === null` room whose `expiresAt` has passed. A room that
 * already has a `matchId` (filled, or in the middle of being filled — see
 * the module doc comment) is never a candidate, regardless of age. Bounded
 * to `LUDO_ROOM_SWEEP_LIMIT` rooms per call, matching the repo's
 * bounded-cursor sweeper convention (`sweepTimeouts`, `sweepMatchmaking`).
 */
export async function sweepExpiredRooms(
  store: LudoStore,
  environment: LudoEnvironment,
  now: Date = new Date(),
  limit: number = LUDO_ROOM_SWEEP_LIMIT,
): Promise<SweepRoomsResult> {
  const nowMs = now.getTime();
  return store.transact(environment, async (state) => {
    const candidates = state.rooms
      .filter((r) => r.matchId === null && Date.parse(r.expiresAt) <= nowMs)
      .slice(0, limit);
    if (candidates.length === 0) return { expired: 0 };
    const removedCodes = new Set(candidates.map((r) => r.roomCode));
    state.rooms = state.rooms.filter((r) => !removedCodes.has(r.roomCode));
    return { expired: candidates.length };
  });
}
