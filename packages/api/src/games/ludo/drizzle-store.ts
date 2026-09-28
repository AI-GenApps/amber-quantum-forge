import {
  and,
  db,
  eq,
  ludoCommands,
  ludoEvents,
  ludoMatches,
  ludoMatchmakingTickets,
  ludoPlayers,
  ludoRooms,
} from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import {
  LUDO_STATE_SCHEMA_VERSION,
  LUDO_STORE_APP_ID,
  type LudoCommandRow,
  type LudoEventRow,
  type LudoMatchmakingTicketRow,
  type LudoMatchRow,
  type LudoPlayerRow,
  type LudoRoomRow,
  type LudoState,
  LudoStorageError,
  type LudoStore,
} from "./store";

export type LudoDrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Targeted per-row Drizzle implementation of `LudoStore`.
 *
 * Unlike Merge Relay's original whole-scope read-and-rewrite, every table
 * here is written to directly, keyed by its own primary key, inside a
 * single transaction per `transact()` call: only rows that actually
 * changed are upserted, and only rows that disappeared from the working
 * state are deleted. `ludo_matches` additionally carries a revision guard
 * on its update so a concurrent writer that raced past the read gets a
 * conflict instead of silently clobbering the other writer's change.
 */
export class DrizzleLudoStore implements LudoStore {
  constructor(private readonly database: typeof db = db) {}

  async read<T>(
    environment: LudoEnvironment,
    operation: (state: LudoState) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      const state = await selectState(transaction, environment);
      return operation(state);
    });
  }

  async transact<T>(
    environment: LudoEnvironment,
    operation: (state: LudoState) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      const before = await selectState(transaction, environment);
      const working = cloneState(before);
      const result = await operation(working);
      await syncMatches(transaction, environment, before.matches, working.matches);
      await syncPlayers(transaction, environment, before.players, working.players);
      await syncEvents(transaction, environment, before.events, working.events);
      await syncCommands(transaction, environment, before.commands, working.commands);
      await syncTickets(
        transaction,
        environment,
        before.matchmakingTickets,
        working.matchmakingTickets,
      );
      await syncRooms(transaction, environment, before.rooms, working.rooms);
      return result;
    });
  }
}

function cloneState(state: LudoState): LudoState {
  return JSON.parse(JSON.stringify(state)) as LudoState;
}

async function selectState(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
): Promise<LudoState> {
  const [matches, players, events, commands, matchmakingTickets, rooms] = await Promise.all([
    transaction
      .select()
      .from(ludoMatches)
      .where(
        and(eq(ludoMatches.appId, LUDO_STORE_APP_ID), eq(ludoMatches.environment, environment)),
      ),
    transaction
      .select()
      .from(ludoPlayers)
      .where(
        and(eq(ludoPlayers.appId, LUDO_STORE_APP_ID), eq(ludoPlayers.environment, environment)),
      ),
    transaction
      .select()
      .from(ludoEvents)
      .where(and(eq(ludoEvents.appId, LUDO_STORE_APP_ID), eq(ludoEvents.environment, environment))),
    transaction
      .select()
      .from(ludoCommands)
      .where(
        and(eq(ludoCommands.appId, LUDO_STORE_APP_ID), eq(ludoCommands.environment, environment)),
      ),
    transaction
      .select()
      .from(ludoMatchmakingTickets)
      .where(
        and(
          eq(ludoMatchmakingTickets.appId, LUDO_STORE_APP_ID),
          eq(ludoMatchmakingTickets.environment, environment),
        ),
      ),
    transaction
      .select()
      .from(ludoRooms)
      .where(and(eq(ludoRooms.appId, LUDO_STORE_APP_ID), eq(ludoRooms.environment, environment))),
  ]);
  return {
    schemaVersion: LUDO_STATE_SCHEMA_VERSION,
    matches: matches.map(rowToMatch),
    players: players.map(rowToPlayer),
    events: events.map(rowToEvent),
    commands: commands.map(rowToCommand),
    matchmakingTickets: matchmakingTickets.map(rowToTicket),
    rooms: rooms.map(rowToRoom),
  };
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new LudoStorageError("Ludo row has an invalid timestamp");
}

function isoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return iso(value);
}

function toDate(value: string): Date {
  return new Date(value);
}

function toDateOrNull(value: string | null): Date | null {
  return value === null ? null : toDate(value);
}

function rowToMatch(row: Record<string, unknown>): LudoMatchRow {
  return {
    matchId: row.matchId as string,
    environment: row.environment as LudoEnvironment,
    mode: row.mode as LudoMatchRow["mode"],
    status: row.status as string,
    seatCount: row.seatCount as number,
    rulesVersion: row.rulesVersion as string,
    currentTurnSeat: row.currentTurnSeat as number,
    phase: row.phase as string,
    sixStreak: row.sixStreak as number,
    turnDeadlineAt: isoOrNull(row.turnDeadlineAt),
    revision: row.revision as number,
    matchOrigin: row.matchOrigin as LudoMatchRow["matchOrigin"],
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function rowToPlayer(row: Record<string, unknown>): LudoPlayerRow {
  return {
    matchId: row.matchId as string,
    environment: row.environment as LudoEnvironment,
    seat: row.seat as number,
    subject: (row.subject as string | null) ?? null,
    isBot: row.isBot as boolean,
    botDifficulty: (row.botDifficulty as string | null) ?? null,
    displayNameCache: (row.displayNameCache as string | null) ?? null,
    connectedAt: isoOrNull(row.connectedAt),
    missCount: row.missCount as number,
  };
}

function rowToEvent(row: Record<string, unknown>): LudoEventRow {
  return {
    matchId: row.matchId as string,
    environment: row.environment as LudoEnvironment,
    sequence: row.sequence as number,
    eventType: row.eventType as string,
    payload: row.payload,
    createdAt: iso(row.createdAt),
  };
}

function rowToCommand(row: Record<string, unknown>): LudoCommandRow {
  return {
    matchId: row.matchId as string,
    environment: row.environment as LudoEnvironment,
    idempotencyKey: row.idempotencyKey as string,
    commandType: row.commandType as string,
    resultSummary: row.resultSummary,
    createdAt: iso(row.createdAt),
  };
}

function rowToTicket(row: Record<string, unknown>): LudoMatchmakingTicketRow {
  return {
    ticketId: row.ticketId as string,
    environment: row.environment as LudoEnvironment,
    subject: row.subject as string,
    mode: row.mode as LudoMatchmakingTicketRow["mode"],
    seatTarget: row.seatTarget as number,
    status: row.status as LudoMatchmakingTicketRow["status"],
    matchedMatchId: (row.matchedMatchId as string | null) ?? null,
    coinTier: (row.coinTier as LudoMatchmakingTicketRow["coinTier"]) ?? null,
    createdAt: iso(row.createdAt),
    expiresAt: iso(row.expiresAt),
  };
}

function rowToRoom(row: Record<string, unknown>): LudoRoomRow {
  return {
    roomCode: row.roomCode as string,
    environment: row.environment as LudoEnvironment,
    ownerSubject: row.ownerSubject as string,
    mode: row.mode as LudoRoomRow["mode"],
    seatTarget: row.seatTarget as number,
    matchId: (row.matchId as string | null) ?? null,
    coinTier: (row.coinTier as LudoRoomRow["coinTier"]) ?? null,
    createdAt: iso(row.createdAt),
    expiresAt: iso(row.expiresAt),
  };
}

function byKey<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  return new Map(rows.map((row) => [key(row), row]));
}

const matchKey = (row: LudoMatchRow) => row.matchId;
const playerKey = (row: LudoPlayerRow) => `${row.matchId}\u0000${row.seat}`;
const eventKey = (row: LudoEventRow) => `${row.matchId}\u0000${row.sequence}`;
const commandKey = (row: LudoCommandRow) => `${row.matchId}\u0000${row.idempotencyKey}`;
const ticketKey = (row: LudoMatchmakingTicketRow) => row.ticketId;
const roomKey = (row: LudoRoomRow) => row.roomCode;

async function syncMatches(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoMatchRow[],
  after: LudoMatchRow[],
): Promise<void> {
  const beforeByKey = byKey(before, matchKey);
  const afterByKey = byKey(after, matchKey);
  for (const row of before) {
    if (!afterByKey.has(matchKey(row)))
      await transaction
        .delete(ludoMatches)
        .where(
          and(
            eq(ludoMatches.appId, LUDO_STORE_APP_ID),
            eq(ludoMatches.environment, environment),
            eq(ludoMatches.matchId, row.matchId),
          ),
        );
  }
  for (const row of after) {
    const existing = beforeByKey.get(matchKey(row));
    if (existing && JSON.stringify(existing) === JSON.stringify(row)) continue;
    const values = {
      appId: LUDO_STORE_APP_ID,
      environment,
      matchId: row.matchId,
      mode: row.mode,
      status: row.status,
      seatCount: row.seatCount,
      rulesVersion: row.rulesVersion,
      currentTurnSeat: row.currentTurnSeat,
      phase: row.phase,
      sixStreak: row.sixStreak,
      turnDeadlineAt: toDateOrNull(row.turnDeadlineAt),
      revision: row.revision,
      matchOrigin: row.matchOrigin,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt),
    };
    if (!existing) {
      await transaction.insert(ludoMatches).values(values);
      continue;
    }
    // Optimistic-concurrency guard: only apply the update if the row's
    // revision still matches the value this transaction read. A row
    // updated concurrently between our read and this write means another
    // writer committed first — surface that as a conflict rather than
    // silently overwriting it.
    const updated = await transaction
      .update(ludoMatches)
      .set(values)
      .where(
        and(
          eq(ludoMatches.appId, LUDO_STORE_APP_ID),
          eq(ludoMatches.environment, environment),
          eq(ludoMatches.matchId, row.matchId),
          eq(ludoMatches.revision, existing.revision),
        ),
      )
      .returning({ matchId: ludoMatches.matchId });
    if (updated.length === 0)
      throw new LudoStorageError(
        `Ludo match ${row.matchId} was modified by another writer`,
        "ludo_match_conflict",
      );
  }
}

async function syncPlayers(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoPlayerRow[],
  after: LudoPlayerRow[],
): Promise<void> {
  const beforeByKey = byKey(before, playerKey);
  const afterByKey = byKey(after, playerKey);
  for (const row of before) {
    if (!afterByKey.has(playerKey(row)))
      await transaction
        .delete(ludoPlayers)
        .where(
          and(
            eq(ludoPlayers.appId, LUDO_STORE_APP_ID),
            eq(ludoPlayers.environment, environment),
            eq(ludoPlayers.matchId, row.matchId),
            eq(ludoPlayers.seat, row.seat),
          ),
        );
  }
  for (const row of after) {
    const existing = beforeByKey.get(playerKey(row));
    if (existing && JSON.stringify(existing) === JSON.stringify(row)) continue;
    const values = {
      appId: LUDO_STORE_APP_ID,
      environment,
      matchId: row.matchId,
      seat: row.seat,
      subject: row.subject,
      isBot: row.isBot,
      botDifficulty: row.botDifficulty,
      displayNameCache: row.displayNameCache,
      connectedAt: toDateOrNull(row.connectedAt),
      missCount: row.missCount,
    };
    await transaction
      .insert(ludoPlayers)
      .values(values)
      .onConflictDoUpdate({
        target: [ludoPlayers.appId, ludoPlayers.environment, ludoPlayers.matchId, ludoPlayers.seat],
        set: values,
      });
  }
}

async function syncEvents(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoEventRow[],
  after: LudoEventRow[],
): Promise<void> {
  // Append-only: events are never mutated or removed once written, so the
  // only targeted write is inserting rows that are new since `before`.
  const beforeKeys = new Set(before.map(eventKey));
  const additions = after.filter((row) => !beforeKeys.has(eventKey(row)));
  for (const row of additions) {
    await transaction
      .insert(ludoEvents)
      .values({
        appId: LUDO_STORE_APP_ID,
        environment,
        matchId: row.matchId,
        sequence: row.sequence,
        eventType: row.eventType,
        payload: row.payload,
        createdAt: toDate(row.createdAt),
      })
      .onConflictDoNothing({
        target: [ludoEvents.appId, ludoEvents.environment, ludoEvents.matchId, ludoEvents.sequence],
      });
  }
}

async function syncCommands(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoCommandRow[],
  after: LudoCommandRow[],
): Promise<void> {
  // Append-only idempotency ledger: a repeated idempotency key is a no-op
  // insert (the caller reads the existing row's result_summary instead of
  // re-running the command), so this never overwrites a prior result.
  const beforeKeys = new Set(before.map(commandKey));
  const additions = after.filter((row) => !beforeKeys.has(commandKey(row)));
  for (const row of additions) {
    await transaction
      .insert(ludoCommands)
      .values({
        appId: LUDO_STORE_APP_ID,
        environment,
        matchId: row.matchId,
        idempotencyKey: row.idempotencyKey,
        commandType: row.commandType,
        resultSummary: row.resultSummary,
        createdAt: toDate(row.createdAt),
      })
      .onConflictDoNothing({
        target: [
          ludoCommands.appId,
          ludoCommands.environment,
          ludoCommands.matchId,
          ludoCommands.idempotencyKey,
        ],
      });
  }
}

async function syncTickets(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoMatchmakingTicketRow[],
  after: LudoMatchmakingTicketRow[],
): Promise<void> {
  const beforeByKey = byKey(before, ticketKey);
  const afterByKey = byKey(after, ticketKey);
  for (const row of before) {
    if (!afterByKey.has(ticketKey(row)))
      await transaction
        .delete(ludoMatchmakingTickets)
        .where(
          and(
            eq(ludoMatchmakingTickets.appId, LUDO_STORE_APP_ID),
            eq(ludoMatchmakingTickets.environment, environment),
            eq(ludoMatchmakingTickets.ticketId, row.ticketId),
          ),
        );
  }
  for (const row of after) {
    const existing = beforeByKey.get(ticketKey(row));
    if (existing && JSON.stringify(existing) === JSON.stringify(row)) continue;
    const values = {
      appId: LUDO_STORE_APP_ID,
      environment,
      ticketId: row.ticketId,
      subject: row.subject,
      mode: row.mode,
      seatTarget: row.seatTarget,
      status: row.status,
      matchedMatchId: row.matchedMatchId,
      coinTier: row.coinTier,
      createdAt: toDate(row.createdAt),
      expiresAt: toDate(row.expiresAt),
    };
    await transaction
      .insert(ludoMatchmakingTickets)
      .values(values)
      .onConflictDoUpdate({
        target: [
          ludoMatchmakingTickets.appId,
          ludoMatchmakingTickets.environment,
          ludoMatchmakingTickets.ticketId,
        ],
        set: values,
      });
  }
}

async function syncRooms(
  transaction: LudoDrizzleTransaction,
  environment: LudoEnvironment,
  before: LudoRoomRow[],
  after: LudoRoomRow[],
): Promise<void> {
  const beforeByKey = byKey(before, roomKey);
  const afterByKey = byKey(after, roomKey);
  for (const row of before) {
    if (!afterByKey.has(roomKey(row)))
      await transaction
        .delete(ludoRooms)
        .where(
          and(
            eq(ludoRooms.appId, LUDO_STORE_APP_ID),
            eq(ludoRooms.environment, environment),
            eq(ludoRooms.roomCode, row.roomCode),
          ),
        );
  }
  for (const row of after) {
    const existing = beforeByKey.get(roomKey(row));
    if (existing && JSON.stringify(existing) === JSON.stringify(row)) continue;
    const values = {
      appId: LUDO_STORE_APP_ID,
      environment,
      roomCode: row.roomCode,
      ownerSubject: row.ownerSubject,
      mode: row.mode,
      seatTarget: row.seatTarget,
      matchId: row.matchId,
      coinTier: row.coinTier,
      createdAt: toDate(row.createdAt),
      expiresAt: toDate(row.expiresAt),
    };
    await transaction
      .insert(ludoRooms)
      .values(values)
      .onConflictDoUpdate({
        target: [ludoRooms.appId, ludoRooms.environment, ludoRooms.roomCode],
        set: values,
      });
  }
}
