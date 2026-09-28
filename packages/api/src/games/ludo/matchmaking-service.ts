/// Random matchmaking with bot-fill (task 20): FIFO ticket matching plus a
/// bot-fill sweep for a ticket that has been `searching` too long, layered
/// on top of `LudoStore` (task 16's `ludo_matchmaking_tickets` table) and
/// task 18's `createMatch`/`joinMatch`.
///
/// `createTicket`/`cancelTicket` are simple per-ticket transactions.
/// `sweepMatchmaking` is the FIFO-scan-and-match sweeper, invoked from the
/// same Cron cadence as task 19's timeout sweeper (see `cron-routes.ts`):
/// for each `(mode, seatTarget)` group of `searching` tickets, oldest
/// first, it forms as many full-size matches as it can, then — if the
/// group's oldest remaining ticket has been searching longer than
/// `LUDO_MATCHMAKING_BOT_FILL_SECONDS` — fills the remaining seats with
/// bot players and starts the match immediately.
import { randomUUID } from "node:crypto";
import type { LudoEnvironment, LudoMatchmakingTicket, LudoMode } from "./contracts";
import type { LudoCoinTableTier } from "./economy-config";
import {
  LudoTicketForbiddenError,
  LudoTicketNotCancellableError,
  LudoTicketNotFoundError,
} from "./errors";
import { createMatch, joinMatch, type LudoServiceDependencies } from "./service";
import type { LudoMatchmakingTicketRow, LudoStore } from "./store";

/** Default bot-fill wait, overridable via `LUDO_MATCHMAKING_BOT_FILL_SECONDS`. */
export const LUDO_MATCHMAKING_BOT_FILL_DEFAULT_SECONDS = 20;

/** How long an uncancelled, unmatched ticket is retained before it would be considered stale (row shape only; expiry sweeping is out of scope for this task). */
const LUDO_MATCHMAKING_TICKET_TTL_MS = 30 * 60 * 1000;

/** Bounds how many `searching` tickets a single sweep invocation examines. */
export const LUDO_MATCHMAKING_SWEEP_LIMIT = 200;

/** Default bot difficulty assigned to a bot-filled seat, per the task's Context/Decisions. */
const DEFAULT_BOT_DIFFICULTY = "medium";

export interface CreateTicketInput {
  subject: string;
  mode: LudoMode;
  seatTarget: number;
  idempotencyKey: string;
  /** Coin-stake table tier (task 26c). Omitted for a free-play ticket. A
   * coin-stake ticket is only ever FIFO-matched against other tickets of
   * the same `(mode, seatTarget, coinTier)` — see `sweepMatchmaking`'s
   * grouping — and is never bot-filled (a bot cannot pay an entry fee). */
  coinTier?: LudoCoinTableTier;
}

export interface CreateTicketResult {
  ticket: LudoMatchmakingTicket;
  idempotent: boolean;
}

function toContractTicket(row: LudoMatchmakingTicketRow): LudoMatchmakingTicket {
  return {
    ticketId: row.ticketId,
    environment: row.environment,
    subject: row.subject,
    mode: row.mode,
    seatTarget: row.seatTarget,
    status: row.status,
    matchedMatchId: row.matchedMatchId,
    coinTier: row.coinTier,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

function computeTicketExpiry(nowIso: string): string {
  return new Date(Date.parse(nowIso) + LUDO_MATCHMAKING_TICKET_TTL_MS).toISOString();
}

function resolveBotFillWindowMs(): number {
  const raw = process.env.LUDO_MATCHMAKING_BOT_FILL_SECONDS;
  const seconds = raw ? Number(raw) : Number.NaN;
  const resolvedSeconds =
    Number.isFinite(seconds) && seconds > 0 ? seconds : LUDO_MATCHMAKING_BOT_FILL_DEFAULT_SECONDS;
  return resolvedSeconds * 1000;
}

/**
 * Submits a ticket into the matchmaking pool. Idempotency is enforced by
 * subject rather than a stored key (the `ludo_matchmaking_tickets` schema
 * from task 16 has no idempotency-key column, and no migration is added by
 * this task): a subject that already has a `searching` ticket for the same
 * `(mode, seatTarget)` gets that existing ticket back unchanged, so a
 * client retry after a dropped response can never create a duplicate
 * ticket for the same search.
 */
export async function createTicket(
  store: LudoStore,
  environment: LudoEnvironment,
  input: CreateTicketInput,
): Promise<CreateTicketResult> {
  return store.transact(environment, async (state) => {
    const existing = state.matchmakingTickets.find(
      (t) =>
        t.subject === input.subject &&
        t.status === "searching" &&
        t.mode === input.mode &&
        t.seatTarget === input.seatTarget &&
        (t.coinTier ?? undefined) === input.coinTier,
    );
    if (existing) return { ticket: toContractTicket(existing), idempotent: true };

    const now = new Date().toISOString();
    const row: LudoMatchmakingTicketRow = {
      ticketId: randomUUID(),
      environment,
      subject: input.subject,
      mode: input.mode,
      seatTarget: input.seatTarget,
      status: "searching",
      matchedMatchId: null,
      coinTier: input.coinTier ?? null,
      createdAt: now,
      expiresAt: computeTicketExpiry(now),
    };
    state.matchmakingTickets.push(row);
    return { ticket: toContractTicket(row), idempotent: false };
  });
}

/**
 * Reads a ticket's current status for the owning subject (task 26's
 * matchmaking-search client poll — this is the only way the client learns
 * a ticket transitioned to `matched`, since `POST .../tickets`'s own
 * idempotent-replay lookup only ever finds a still-`searching` ticket, per
 * this function's docstring above).
 */
export async function getTicket(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  ticketId: string,
): Promise<{ ticket: LudoMatchmakingTicket }> {
  return store.read(environment, async (state) => {
    const row = state.matchmakingTickets.find((t) => t.ticketId === ticketId);
    if (!row) throw new LudoTicketNotFoundError(ticketId);
    if (row.subject !== subject) throw new LudoTicketForbiddenError();
    return { ticket: toContractTicket(row) };
  });
}

/** Cancels a `searching` ticket owned by `subject`. */
export async function cancelTicket(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  ticketId: string,
): Promise<{ ticket: LudoMatchmakingTicket }> {
  return store.transact(environment, async (state) => {
    const row = state.matchmakingTickets.find((t) => t.ticketId === ticketId);
    if (!row) throw new LudoTicketNotFoundError(ticketId);
    if (row.subject !== subject) throw new LudoTicketForbiddenError();
    if (row.status !== "searching") throw new LudoTicketNotCancellableError();
    row.status = "cancelled";
    return { ticket: toContractTicket(row) };
  });
}

export interface SweepMatchmakingResult {
  /** Number of matches formed purely from FIFO-matched human tickets. */
  matched: number;
  /** Number of matches started by filling a stalled group's remaining seats with bots. */
  botFilled: number;
}

/**
 * Forms one match from `humanTickets` (whose subjects fill the first
 * seats, in FIFO order) plus `botsNeeded` synthetic bot seats, via task
 * 18's `createMatch`/`joinMatch` — passing `matchOrigin: "matchmaking"` —
 * then marks every matched ticket row `matched` with `matchedMatchId` set.
 * `humanTickets.length + botsNeeded` must equal `humanTickets[0].seatTarget`
 * exactly, so the match's roster fills completely and transitions
 * `waiting` -> `active` as its very last join.
 */
async function formMatch(
  store: LudoStore,
  environment: LudoEnvironment,
  humanTickets: readonly LudoMatchmakingTicketRow[],
  botsNeeded: number,
  dependencies: LudoServiceDependencies = {},
): Promise<string> {
  const [first, ...rest] = humanTickets;
  const seats = first.seatTarget;
  const created = await createMatch(
    store,
    environment,
    {
      subject: first.subject,
      mode: first.mode,
      seats,
      idempotencyKey: `matchmaking:${first.ticketId}`,
      coinTier: first.coinTier ?? undefined,
    },
    "matchmaking",
    dependencies,
  );
  const matchId = created.matchState.matchId;

  for (const ticket of rest) {
    await joinMatch(
      store,
      environment,
      {
        subject: ticket.subject,
        matchId,
        idempotencyKey: `matchmaking:${ticket.ticketId}`,
      },
      dependencies,
    );
  }
  for (let i = 0; i < botsNeeded; i++) {
    await joinMatch(
      store,
      environment,
      {
        subject: `bot:${randomUUID()}`,
        matchId,
        idempotencyKey: `matchmaking-bot-fill:${matchId}:${i}`,
        bot: { difficulty: DEFAULT_BOT_DIFFICULTY },
      },
      dependencies,
    );
  }

  await store.transact(environment, async (state) => {
    const matchedIds = new Set(humanTickets.map((t) => t.ticketId));
    for (const row of state.matchmakingTickets) {
      if (matchedIds.has(row.ticketId)) {
        row.status = "matched";
        row.matchedMatchId = matchId;
      }
    }
  });

  return matchId;
}

/**
 * Sweeps one environment's `searching` tickets: FIFO-matches full groups,
 * then bot-fills the oldest remaining group past the bot-fill window.
 * Bounded to `LUDO_MATCHMAKING_SWEEP_LIMIT` tickets examined per call,
 * matching `sweepTimeouts`'s bounded-cursor convention.
 */
export async function sweepMatchmaking(
  store: LudoStore,
  environment: LudoEnvironment,
  limit: number = LUDO_MATCHMAKING_SWEEP_LIMIT,
  dependencies: LudoServiceDependencies = {},
): Promise<SweepMatchmakingResult> {
  const nowMs = Date.now();
  const botFillWindowMs = resolveBotFillWindowMs();

  const candidates = await store.read(environment, async (state) =>
    state.matchmakingTickets
      .filter((t) => t.status === "searching")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit),
  );

  // Grouped by (mode, seatTarget, coinTier) so a coin-stake ticket is never
  // FIFO-matched against a free-play one, or against a different tier.
  const groups = new Map<string, LudoMatchmakingTicketRow[]>();
  for (const ticket of candidates) {
    const key = `${ticket.mode}\u0000${ticket.seatTarget}\u0000${ticket.coinTier ?? ""}`;
    const list = groups.get(key);
    if (list) list.push(ticket);
    else groups.set(key, [ticket]);
  }

  let matched = 0;
  let botFilled = 0;

  for (const ticketsInGroup of Array.from(groups.values())) {
    const seatTarget = ticketsInGroup[0].seatTarget;
    let remaining = [...ticketsInGroup].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    while (remaining.length >= seatTarget) {
      const batch = remaining.slice(0, seatTarget);
      remaining = remaining.slice(seatTarget);
      await formMatch(store, environment, batch, 0, dependencies);
      matched += 1;
    }

    // A coin-stake group is never bot-filled: a bot has no wallet to debit
    // an entry fee from, so a stalled coin-stake ticket just keeps
    // searching rather than being seated against an unpaid bot.
    if (remaining.length > 0 && remaining[0].coinTier === null) {
      const oldest = remaining[0];
      const ageMs = nowMs - Date.parse(oldest.createdAt);
      if (ageMs >= botFillWindowMs) {
        const botsNeeded = seatTarget - remaining.length;
        await formMatch(store, environment, remaining, botsNeeded, dependencies);
        botFilled += 1;
      }
    }
  }

  return { matched, botFilled };
}
