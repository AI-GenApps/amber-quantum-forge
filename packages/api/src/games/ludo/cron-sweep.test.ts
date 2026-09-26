import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createLudoCronRoutes } from "./cron-routes";
import { InMemoryLudoStore } from "./memory-store";
import { createMatch, joinMatch } from "./service";

const ENVIRONMENT = "debug" as const;
const CRON_SECRET = "test-cron-secret";

let matchCounter = 0;

async function createActiveTwoSeatMatch(store: InMemoryLudoStore): Promise<string> {
  const suffix = matchCounter++;
  const created = await createMatch(
    store,
    ENVIRONMENT,
    { subject: `alice-${suffix}`, mode: "classic", seats: 2, idempotencyKey: `create-${suffix}` },
    "direct",
  );
  const matchId = created.matchState.matchId;
  await joinMatch(store, ENVIRONMENT, {
    subject: `bob-${suffix}`,
    matchId,
    idempotencyKey: `join-${suffix}`,
  });
  return matchId;
}

async function expireDeadline(store: InMemoryLudoStore, matchId: string): Promise<void> {
  await store.transact(ENVIRONMENT, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (row) row.turnDeadlineAt = new Date(Date.now() - 60_000).toISOString();
    return undefined;
  });
}

function harness(store: InMemoryLudoStore, cronSecret: string | undefined = CRON_SECRET) {
  const app = new Hono();
  app.route("/games/ludo/cron", createLudoCronRoutes({ store, cronSecret }));
  return app;
}

describe("Ludo cron sweeper route", () => {
  it("sweeps an expired match and applies the timeout transition", async () => {
    const store = new InMemoryLudoStore();
    const matchId = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { swept: Record<string, number> };
    expect(body.swept[ENVIRONMENT]).toBe(1);

    const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(row?.currentTurnSeat).toBe(1);
    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events.map((e) => e.eventType)).toEqual(["turn_timed_out"]);
  });

  it("leaves a non-expired match untouched", async () => {
    const store = new InMemoryLudoStore();
    const matchId = await createActiveTwoSeatMatch(store);

    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = (await response.json()) as { swept: Record<string, number> };
    expect(body.swept[ENVIRONMENT]).toBe(0);

    const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(row?.currentTurnSeat).toBe(0);
    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events).toHaveLength(0);
  });

  it("rejects a missing Authorization header", async () => {
    const store = new InMemoryLudoStore();
    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts");
    expect(response.status).toBe(401);
  });

  it("rejects an incorrect CRON_SECRET", async () => {
    const store = new InMemoryLudoStore();
    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(response.status).toBe(401);
  });

  it("fails closed when CRON_SECRET is not configured, even with a matching-looking header", async () => {
    const store = new InMemoryLudoStore();
    const app = harness(store, undefined);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: "Bearer undefined" },
    });
    expect(response.status).toBe(401);
  });

  it("is idempotent: sweeping an already-swept match twice does not duplicate turn_timed_out events", async () => {
    const store = new InMemoryLudoStore();
    const matchId = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    const app = harness(store);
    await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const secondResponse = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const secondBody = (await secondResponse.json()) as { swept: Record<string, number> };
    // The first sweep already reset the (new current seat's) deadline into
    // the future, so the second sweep finds nothing left to do.
    expect(secondBody.swept[ENVIRONMENT]).toBe(0);

    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events.map((e) => e.eventType)).toEqual(["turn_timed_out"]);
  });

  it("supports POST as well as GET, matching Vercel Cron's invocation", async () => {
    const store = new InMemoryLudoStore();
    const matchId = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);
    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(response.status).toBe(200);
  });

  it("bounds the number of matches processed per invocation to LUDO_SWEEP_BATCH_LIMIT", async () => {
    const store = new InMemoryLudoStore();
    const { LUDO_SWEEP_BATCH_LIMIT } = await import("./service");
    const matchIds: string[] = [];
    for (let i = 0; i < LUDO_SWEEP_BATCH_LIMIT + 3; i++) {
      const matchId = await createActiveTwoSeatMatch(store);
      await expireDeadline(store, matchId);
      matchIds.push(matchId);
    }

    const app = harness(store);
    const response = await app.request("/games/ludo/cron/sweep-timeouts", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = (await response.json()) as { swept: Record<string, number> };
    expect(body.swept[ENVIRONMENT]).toBe(LUDO_SWEEP_BATCH_LIMIT);
  });
});
