import { afterEach, describe, expect, it } from "vitest";
import type { LudoEnvironment } from "./contracts";
import {
  LudoTicketForbiddenError,
  LudoTicketNotCancellableError,
  LudoTicketNotFoundError,
} from "./errors";
import {
  cancelTicket,
  createTicket,
  getTicket,
  LUDO_MATCHMAKING_BOT_FILL_DEFAULT_SECONDS,
  LUDO_MATCHMAKING_SWEEP_LIMIT,
  sweepMatchmaking,
} from "./matchmaking-service";
import { InMemoryLudoStore } from "./memory-store";

const ENVIRONMENT: LudoEnvironment = "debug";
const ENV_VAR = "LUDO_MATCHMAKING_BOT_FILL_SECONDS";

afterEach(() => {
  delete process.env[ENV_VAR];
});

async function ageTicket(
  store: InMemoryLudoStore,
  ticketId: string,
  ageSeconds: number,
): Promise<void> {
  await store.transact(ENVIRONMENT, async (state) => {
    const row = state.matchmakingTickets.find((t) => t.ticketId === ticketId);
    if (row) row.createdAt = new Date(Date.now() - ageSeconds * 1000).toISOString();
    return undefined;
  });
}

describe("createTicket", () => {
  it("creates a new searching ticket", async () => {
    const store = new InMemoryLudoStore();
    const result = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    expect(result.idempotent).toBe(false);
    expect(result.ticket.status).toBe("searching");
    expect(result.ticket.subject).toBe("alice");
    expect(result.ticket.mode).toBe("classic");
    expect(result.ticket.seatTarget).toBe(2);
  });

  it("returns the existing searching ticket for a repeated create by the same subject/mode/seatTarget", async () => {
    const store = new InMemoryLudoStore();
    const first = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    const second = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k2",
    });
    expect(second.idempotent).toBe(true);
    expect(second.ticket.ticketId).toBe(first.ticket.ticketId);
    const all = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(all).toHaveLength(1);
  });
});

describe("getTicket", () => {
  it("returns the caller's own ticket", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    const result = await getTicket(store, ENVIRONMENT, "alice", created.ticket.ticketId);
    expect(result.ticket.ticketId).toBe(created.ticket.ticketId);
    expect(result.ticket.status).toBe("searching");
  });

  it("reflects a matched ticket's matchedMatchId once the sweep pairs it", async () => {
    const store = new InMemoryLudoStore();
    const a = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k2",
    });
    await sweepMatchmaking(store, ENVIRONMENT);
    const result = await getTicket(store, ENVIRONMENT, "alice", a.ticket.ticketId);
    expect(result.ticket.status).toBe("matched");
    expect(result.ticket.matchedMatchId).not.toBeNull();
  });

  it("rejects reading a ticket that does not exist", async () => {
    const store = new InMemoryLudoStore();
    await expect(getTicket(store, ENVIRONMENT, "alice", "nope")).rejects.toBeInstanceOf(
      LudoTicketNotFoundError,
    );
  });

  it("rejects reading another subject's ticket", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await expect(
      getTicket(store, ENVIRONMENT, "mallory", created.ticket.ticketId),
    ).rejects.toBeInstanceOf(LudoTicketForbiddenError);
  });
});

describe("cancelTicket", () => {
  it("cancels a searching ticket owned by the caller", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    const result = await cancelTicket(store, ENVIRONMENT, "alice", created.ticket.ticketId);
    expect(result.ticket.status).toBe("cancelled");
  });

  it("rejects cancelling a ticket that does not exist", async () => {
    const store = new InMemoryLudoStore();
    await expect(cancelTicket(store, ENVIRONMENT, "alice", "nope")).rejects.toBeInstanceOf(
      LudoTicketNotFoundError,
    );
  });

  it("rejects cancelling another subject's ticket", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await expect(
      cancelTicket(store, ENVIRONMENT, "mallory", created.ticket.ticketId),
    ).rejects.toBeInstanceOf(LudoTicketForbiddenError);
  });

  it("rejects cancelling an already-matched ticket", async () => {
    const store = new InMemoryLudoStore();
    const a = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k2",
    });
    await sweepMatchmaking(store, ENVIRONMENT);
    await expect(
      cancelTicket(store, ENVIRONMENT, "alice", a.ticket.ticketId),
    ).rejects.toBeInstanceOf(LudoTicketNotCancellableError);
  });
});

describe("sweepMatchmaking", () => {
  it("matches two 2p tickets for the same mode within one sweep", async () => {
    const store = new InMemoryLudoStore();
    await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k2",
    });

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.matched).toBe(1);
    expect(result.botFilled).toBe(0);

    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets.every((t) => t.status === "matched")).toBe(true);
    const matchId = tickets[0].matchedMatchId;
    expect(matchId).toBeTruthy();
    expect(tickets.every((t) => t.matchedMatchId === matchId)).toBe(true);

    const matches = store.snapshot(ENVIRONMENT).matches;
    expect(matches).toHaveLength(1);
    expect(matches[0].matchOrigin).toBe("matchmaking");
    expect(matches[0].status).toBe("active");
    expect(matches[0].seatCount).toBe(2);

    const players = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(players.map((p) => p.subject).sort()).toEqual(["alice", "bob"]);
    expect(players.every((p) => !p.isBot)).toBe(true);
  });

  it("matches four 4p tickets into one 4-seat match", async () => {
    const store = new InMemoryLudoStore();
    for (const subject of ["p1", "p2", "p3", "p4"]) {
      await createTicket(store, ENVIRONMENT, {
        subject,
        mode: "quick",
        seatTarget: 4,
        idempotencyKey: `create-${subject}`,
      });
    }

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.matched).toBe(1);

    const matches = store.snapshot(ENVIRONMENT).matches;
    expect(matches).toHaveLength(1);
    expect(matches[0].seatCount).toBe(4);
    expect(matches[0].mode).toBe("quick");
    expect(matches[0].status).toBe("active");

    const players = store
      .snapshot(ENVIRONMENT)
      .players.filter((p) => p.matchId === matches[0].matchId);
    expect(players).toHaveLength(4);
  });

  it("never cross-matches tickets with different seat_target", async () => {
    const store = new InMemoryLudoStore();
    await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "classic",
      seatTarget: 4,
      idempotencyKey: "k2",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "carol",
      mode: "classic",
      seatTarget: 4,
      idempotencyKey: "k3",
    });

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.matched).toBe(0);
    expect(result.botFilled).toBe(0);
    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets.every((t) => t.status === "searching")).toBe(true);
  });

  it("does not match prematurely when there are too few tickets", async () => {
    const store = new InMemoryLudoStore();
    await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 4,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "classic",
      seatTarget: 4,
      idempotencyKey: "k2",
    });

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.matched).toBe(0);
    expect(result.botFilled).toBe(0);
    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets.every((t) => t.status === "searching")).toBe(true);
  });

  it("bot-fills a ticket older than the configured bot-fill window", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await ageTicket(store, created.ticket.ticketId, LUDO_MATCHMAKING_BOT_FILL_DEFAULT_SECONDS + 5);

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.botFilled).toBe(1);
    expect(result.matched).toBe(0);

    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets[0].status).toBe("matched");
    const matchId = tickets[0].matchedMatchId as string;
    const match = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(match?.status).toBe("active");
    expect(match?.matchOrigin).toBe("matchmaking");

    const players = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(players).toHaveLength(2);
    const human = players.find((p) => p.subject === "alice");
    const bot = players.find((p) => p.subject !== "alice");
    expect(human?.isBot).toBe(false);
    expect(bot?.isBot).toBe(true);
    expect(bot?.botDifficulty).toBe("medium");
  });

  it("does not bot-fill a ticket younger than the bot-fill window", async () => {
    const store = new InMemoryLudoStore();
    await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.botFilled).toBe(0);
    expect(result.matched).toBe(0);
    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets[0].status).toBe("searching");
  });

  it("honors LUDO_MATCHMAKING_BOT_FILL_SECONDS overrides", async () => {
    process.env[ENV_VAR] = "5";
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await ageTicket(store, created.ticket.ticketId, 10);

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.botFilled).toBe(1);
  });

  it("bot-fills the remaining two seats of a partially-filled 4p group", async () => {
    const store = new InMemoryLudoStore();
    const created = await createTicket(store, ENVIRONMENT, {
      subject: "alice",
      mode: "quick",
      seatTarget: 4,
      idempotencyKey: "k1",
    });
    await createTicket(store, ENVIRONMENT, {
      subject: "bob",
      mode: "quick",
      seatTarget: 4,
      idempotencyKey: "k2",
    });
    await ageTicket(store, created.ticket.ticketId, LUDO_MATCHMAKING_BOT_FILL_DEFAULT_SECONDS + 5);

    const result = await sweepMatchmaking(store, ENVIRONMENT);
    expect(result.botFilled).toBe(1);

    const tickets = store.snapshot(ENVIRONMENT).matchmakingTickets;
    expect(tickets.every((t) => t.status === "matched")).toBe(true);
    const matchId = tickets[0].matchedMatchId as string;
    const players = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(players).toHaveLength(4);
    expect(players.filter((p) => p.isBot)).toHaveLength(2);
    expect(players.filter((p) => !p.isBot)).toHaveLength(2);
  });

  it("bounds the number of tickets examined per invocation to the sweep limit", () => {
    expect(LUDO_MATCHMAKING_SWEEP_LIMIT).toBeGreaterThan(0);
  });
});
