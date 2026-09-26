/// Pure, storage-shape helpers shared between `service.ts`'s command path
/// and its read paths (`getMatchState`/`getMatchView`/`publishMatchView`):
/// converting a `ludo_events` row into the contract-level `LudoEvent`
/// shape, loading the most recent window of those rows for a match, and
/// reconstructing the wire-level `LudoMatchState` (either directly, for a
/// still-`"waiting"` match, or via full event replay through the pure TS
/// engine). Split out of `service.ts` (task 22) purely to keep that file
/// under the repo's per-file line limit — these functions have no
/// transaction or fan-out concerns of their own.
import type { LudoEnvironment, LudoEvent, LudoMatchState as WireMatchState } from "./contracts";
import { LUDO_MATCH_VIEW_EVENT_LIMIT } from "./contracts";
import {
  createMatchState,
  type LudoMatchState as EngineMatchState,
  eventFromJson,
  LUDO_COLOR_ORDER,
  LUDO_MIN_SEATS,
  LUDO_RULESETS_BY_ID,
  type LudoReplayEvent,
  replay,
} from "./engine";
import { LudoMatchNotJoinableError } from "./errors";
import type { LudoEventRow, LudoMatchRow, LudoPlayerRow, LudoStore } from "./store";

/** Maps an engine replay event's `type` to the `ludo_events.event_type` column value. */
export const WIRE_EVENT_TYPE: Record<LudoReplayEvent["type"], string> = {
  diceRolled: "dice_rolled",
  tokenMoved: "token_moved",
  tokenCaptured: "token_captured",
  tokenFinished: "token_finished",
  turnForfeited: "turn_forfeited",
  matchFinished: "match_finished",
  turnTimedOut: "turn_timed_out",
  seatForfeited: "seat_forfeited",
  matchAbandoned: "match_abandoned",
};

/** Maps the engine's internal phase names to the wire contract's phase names. */
export const ENGINE_PHASE_TO_WIRE: Record<EngineMatchState["phase"], WireMatchState["phase"]> = {
  awaitingRoll: "awaiting_roll",
  awaitingMove: "awaiting_move",
  finished: "finished",
};

/**
 * Converts one `ludo_events` row into the contract-level `LudoEvent` shape
 * (task 22). `LudoEventRow` has no durable event id of its own, so one is
 * synthesized as `${matchId}:${sequence}` — stable and unique per match.
 *
 * `token_captured` is a documented simplification: the engine's
 * `tokenCaptured` event (see `engine-model.ts`) does not carry the
 * capturing token's id, only the captured seat/token and the capturing
 * seat (`byseat`) — so `tokenId` here mirrors `capturedTokenId` rather than
 * the capturing token's own id, until a future engine change records it.
 */
export function contractEventFromRow(row: LudoEventRow): LudoEvent {
  const base = {
    eventId: `${row.matchId}:${row.sequence}`,
    matchId: row.matchId,
    sequence: row.sequence,
    createdAt: row.createdAt,
  };
  const engineEvent = eventFromJson(row.payload as Record<string, unknown>);
  switch (engineEvent.type) {
    case "diceRolled":
      return { type: "dice_rolled", ...base, seat: engineEvent.seat, roll: engineEvent.roll };
    case "tokenMoved":
      return {
        type: "token_moved",
        ...base,
        seat: engineEvent.seat,
        tokenId: engineEvent.tokenId,
        fromPathPosition: engineEvent.from,
        toPathPosition: engineEvent.to,
      };
    case "tokenCaptured":
      return {
        type: "token_captured",
        ...base,
        seat: engineEvent.byseat,
        tokenId: engineEvent.tokenId,
        capturedSeat: engineEvent.seat,
        capturedTokenId: engineEvent.tokenId,
      };
    case "tokenFinished":
      return {
        type: "token_finished",
        ...base,
        seat: engineEvent.seat,
        tokenId: engineEvent.tokenId,
      };
    case "turnForfeited":
      return {
        type: "turn_forfeited",
        ...base,
        seat: engineEvent.seat,
        reason: engineEvent.reason,
      };
    case "matchFinished":
      return { type: "match_finished", ...base, winnerOrder: [...engineEvent.winnerOrder] };
    case "turnTimedOut":
      return { type: "turn_timed_out", ...base, seat: engineEvent.seat };
    case "seatForfeited":
      return { type: "seat_forfeited", ...base, seat: engineEvent.seat };
    case "matchAbandoned":
      return { type: "match_abandoned", ...base };
  }
}

/**
 * Loads the most recent `LUDO_MATCH_VIEW_EVENT_LIMIT` `ludo_events` rows for
 * `matchId`, oldest first, converted to the contract-level `LudoEvent`
 * shape. Shared by `publishMatchView` and `getMatchView` so the Firestore
 * mirror and the polling fallback always carry the identical event window.
 */
export async function loadRecentEvents(
  store: LudoStore,
  environment: LudoEnvironment,
  matchId: string,
): Promise<LudoEvent[]> {
  return store.read(environment, async (state) =>
    state.events
      .filter((e) => e.matchId === matchId)
      .sort((a, b) => a.sequence - b.sequence)
      .slice(-LUDO_MATCH_VIEW_EVENT_LIMIT)
      .map(contractEventFromRow),
  );
}

/**
 * Builds the wire-shaped `LudoMatchState` for a match row: while `"waiting"`
 * (roster incomplete), reports the joined seats with empty token lists;
 * once seats are full, reconstructs the full engine state by replay and
 * projects it onto the wire shape (which is a superset of the engine's:
 * `matchId`/`environment`/`mode`/`status`/`deadlineAt`/`updatedAt` come from
 * the row, everything else from the reconstructed state).
 */
export function publicStateFor(
  state: { players: readonly LudoPlayerRow[]; events: readonly LudoEventRow[] },
  row: LudoMatchRow,
): WireMatchState {
  const playerRows = state.players
    .filter((p) => p.matchId === row.matchId)
    .sort((a, b) => a.seat - b.seat);

  if (row.status === "waiting") {
    return {
      matchId: row.matchId,
      environment: row.environment,
      mode: row.mode,
      status: row.status,
      players: playerRows.map((p) => ({
        seat: p.seat,
        subject: p.subject ?? "",
        color: LUDO_COLOR_ORDER[p.seat],
        tokens: [],
        captureCount: 0,
      })),
      currentPlayerIndex: 0,
      phase: "awaiting_roll",
      currentRoll: null,
      consecutiveSixes: 0,
      winnerOrder: [],
      deadlineAt: row.turnDeadlineAt,
      updatedAt: row.updatedAt,
    };
  }

  const engineState = reconstructEngineState(row, playerRows, state.events);
  return {
    matchId: row.matchId,
    environment: row.environment,
    mode: row.mode,
    status: row.status as WireMatchState["status"],
    players: engineState.players.map((p) => ({
      seat: p.seat,
      subject: p.subject,
      color: p.color,
      tokens: p.tokens.map((t) => ({ id: t.id, pathPosition: t.pathPosition })),
      captureCount: p.captureCount,
    })),
    currentPlayerIndex: engineState.currentPlayerIndex,
    phase: ENGINE_PHASE_TO_WIRE[engineState.phase],
    currentRoll: engineState.currentRoll,
    consecutiveSixes: engineState.consecutiveSixes,
    winnerOrder: [...engineState.winnerOrder],
    deadlineAt: row.turnDeadlineAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Reconstructs the current engine `LudoMatchState` for an active/finished
 * match: the initial roster/ruleset (colors and pre-released tokens are a
 * pure function of the ruleset and seat order) replayed through every
 * `ludo_events` row recorded so far, in `sequence` order. This — not a
 * persisted state blob — is the source of truth for token positions,
 * mirroring `parity.test.ts`'s use of `replay()` against fixture event
 * logs.
 */
export function reconstructEngineState(
  row: LudoMatchRow,
  sortedPlayerRows: readonly LudoPlayerRow[],
  eventRows: readonly LudoEventRow[],
): EngineMatchState {
  const ruleset = LUDO_RULESETS_BY_ID[row.mode];
  const subjects = sortedPlayerRows.map((p) => p.subject);
  if (subjects.length < LUDO_MIN_SEATS || subjects.some((s) => s === null)) {
    throw new LudoMatchNotJoinableError("Match roster is incomplete");
  }
  const initial = createMatchState({ ruleset, subjects: subjects as string[] });
  const events = eventRows
    .filter((e) => e.matchId === row.matchId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((e) => eventFromJson(e.payload as Record<string, unknown>));
  return replay(events, { ruleset, initialPlayers: initial.players });
}
