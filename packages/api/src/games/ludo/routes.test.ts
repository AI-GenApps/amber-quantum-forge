import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { signAccessToken } from "../../lib/jwt";
import { EnvironmentGameTokenVerifier, signGameToken } from "../tokens";
import { InMemoryLudoStore } from "./memory-store";
import { createConfiguredLudoRoutes, createLudoRoutes } from "./routes";

const TEST_GAME_TOKEN_SECRET = "ludo-route-test-secret-with-at-least-32-characters";
const TEST_GAME_TOKEN_ISSUER = "https://issuer.test/games";
const TEST_GAME_TOKEN_AUDIENCE = "ludo-api-test";

/**
 * A store + already-signed game token, for tests that exercise the
 * match/command routes. Sets `GAME_TOKEN_SECRET_LUDO_DEBUG`/issuer/audience
 * on `process.env` (matching `EnvironmentGameTokenVerifier`'s lookup) —
 * callers must wrap their test in `saveEnv()`/`restoreEnv()` as the
 * existing session-route tests below do.
 */
async function testHarness(subject = "seat-owner") {
  process.env.GAME_TOKEN_SECRET_LUDO_DEBUG = TEST_GAME_TOKEN_SECRET;
  process.env.GAME_TOKEN_ISSUER = TEST_GAME_TOKEN_ISSUER;
  process.env.GAME_TOKEN_AUDIENCE = TEST_GAME_TOKEN_AUDIENCE;
  const store = new InMemoryLudoStore();
  const verifyGameToken = new EnvironmentGameTokenVerifier();
  const gameToken = await signGameToken(
    {
      appId: "ludo",
      environment: "debug",
      secret: TEST_GAME_TOKEN_SECRET,
      issuer: TEST_GAME_TOKEN_ISSUER,
      audience: TEST_GAME_TOKEN_AUDIENCE,
    },
    { subject, role: "player" },
    300,
  );
  const app = new Hono();
  app.route(
    "/games/ludo",
    createLudoRoutes({ signSessionToken: async () => "unused", verifyGameToken, store }),
  );
  return { app, store, gameToken };
}

const ENV_KEYS = [
  "GAME_TOKEN_SECRET_LUDO_DEBUG",
  "GAME_TOKEN_ISSUER",
  "GAME_TOKEN_AUDIENCE",
] as const;

function saveEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

async function apiToken(sub = "firebase-uid-123") {
  return signAccessToken({
    sub,
    uid: sub,
    email: "player@example.test",
    emailVerified: true,
    provider: "google.com",
    admin: false,
  });
}

function stubDependencies() {
  return {
    signSessionToken: async () => "unused",
    verifyGameToken: new EnvironmentGameTokenVerifier(),
    store: new InMemoryLudoStore(),
  };
}

describe("Ludo session route", () => {
  it("rejects a request without a valid API access token", async () => {
    const app = new Hono();
    app.route("/games/ludo", createLudoRoutes(stubDependencies()));
    const response = await app.request("/games/ludo/debug/session", { method: "POST" });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("ludo_authentication_required");
  });

  it("rejects a request whose :environment is not a recognized game environment", async () => {
    const app = new Hono();
    app.route("/games/ludo", createLudoRoutes(stubDependencies()));
    const token = await apiToken();
    const response = await app.request("/games/ludo/production-typo/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("ludo_invalid_environment");
  });

  it("issues a token whose subject matches the caller's Firebase UID and verifies for appId ludo", async () => {
    const saved = saveEnv();
    process.env.GAME_TOKEN_SECRET_LUDO_DEBUG = "ludo-route-test-secret-with-at-least-32-characters";
    process.env.GAME_TOKEN_ISSUER = "https://issuer.test/games";
    process.env.GAME_TOKEN_AUDIENCE = "ludo-api-test";
    try {
      const app = new Hono();
      app.route("/games/ludo", createConfiguredLudoRoutes());
      const token = await apiToken("firebase-uid-abc");
      const response = await app.request("/games/ludo/debug/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.subject).toBe("firebase-uid-abc");
      expect(body.app_id).toBe("ludo");
      expect(body.environment).toBe("debug");
      const session = await new EnvironmentGameTokenVerifier().verify(body.game_token, {
        appId: "ludo",
        environment: "debug",
      });
      expect(session).toEqual({
        appId: "ludo",
        environment: "debug",
        subject: "firebase-uid-abc",
        role: "player",
      });
    } finally {
      restoreEnv(saved);
    }
  });

  it("fails closed with ludo_token_configuration_unavailable when unconfigured", async () => {
    const saved = saveEnv();
    delete process.env.GAME_TOKEN_SECRET_LUDO_DEBUG;
    delete process.env.GAME_TOKEN_ISSUER;
    delete process.env.GAME_TOKEN_AUDIENCE;
    try {
      const app = new Hono();
      app.route("/games/ludo", createConfiguredLudoRoutes());
      const token = await apiToken();
      const response = await app.request("/games/ludo/debug/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe("ludo_token_configuration_unavailable");
    } finally {
      restoreEnv(saved);
    }
  });
});

describe("Ludo match/command routes", () => {
  it("rejects a create-match request without a valid Ludo game token", async () => {
    const saved = saveEnv();
    try {
      const { app } = await testHarness();
      const response = await app.request("/games/ludo/debug/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_match",
          mode: "classic",
          seats: 2,
          idempotency_key: "k1",
        }),
      });
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("ludo_authentication_required");
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects a command from a subject that does not hold a seat in the match (wrong seat)", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("owner-subject");
      const createResponse = await app.request("/games/ludo/debug/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({
          type: "create_match",
          mode: "classic",
          seats: 2,
          idempotency_key: "create-1",
        }),
      });
      expect(createResponse.status).toBe(201);
      const matchId = (await createResponse.json()).match_state.match_id;

      const intruderToken = await signGameToken(
        {
          appId: "ludo",
          environment: "debug",
          secret: TEST_GAME_TOKEN_SECRET,
          issuer: TEST_GAME_TOKEN_ISSUER,
          audience: TEST_GAME_TOKEN_AUDIENCE,
        },
        { subject: "intruder-subject", role: "player" },
        300,
      );
      const response = await app.request(`/games/ludo/debug/matches/${matchId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${intruderToken}` },
        body: JSON.stringify({ type: "roll_dice", match_id: matchId, idempotency_key: "roll-1" }),
      });
      expect(response.status).toBe(403);
      expect((await response.json()).error.code).toBe("ludo_forbidden_role");
    } finally {
      restoreEnv(saved);
    }
  });

  it("creates a match, joins a second seat and plays a roll-then-move round trip", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken: ownerToken } = await testHarness("owner-subject");
      const createResponse = await app.request("/games/ludo/debug/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          type: "create_match",
          mode: "classic",
          seats: 2,
          idempotency_key: "create-1",
        }),
      });
      expect(createResponse.status).toBe(201);
      const matchId = (await createResponse.json()).match_state.match_id;

      const joinerToken = await signGameToken(
        {
          appId: "ludo",
          environment: "debug",
          secret: TEST_GAME_TOKEN_SECRET,
          issuer: TEST_GAME_TOKEN_ISSUER,
          audience: TEST_GAME_TOKEN_AUDIENCE,
        },
        { subject: "joiner-subject", role: "player" },
        300,
      );
      const joinResponse = await app.request(`/games/ludo/debug/matches/${matchId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${joinerToken}` },
        body: JSON.stringify({ type: "join_match", match_id: matchId, idempotency_key: "join-1" }),
      });
      expect(joinResponse.status).toBe(200);
      const joinBody = await joinResponse.json();
      expect(joinBody.match_state.status).toBe("active");

      // The route uses the real CSPRNG dice source, so drive real rolls
      // until one has a legal move (every token starts in the yard;
      // Classic requires a 6 to exit) — each non-6 auto-forfeits to the
      // other seat, so the acting token must track whichever seat's turn
      // it now is. Bounded so a run of bad luck can never hang the test.
      const tokenBySubject: Record<string, string> = {
        "owner-subject": ownerToken,
        "joiner-subject": joinerToken,
      };
      let matchState = joinBody.match_state;
      let attempt = 0;
      while (matchState.phase !== "awaiting_move" && attempt < 50) {
        const actingSubject = matchState.players[matchState.current_player_index].subject;
        const rollResponse = await app.request(`/games/ludo/debug/matches/${matchId}/commands`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenBySubject[actingSubject]}`,
          },
          body: JSON.stringify({
            type: "roll_dice",
            match_id: matchId,
            idempotency_key: `roll-${attempt}`,
          }),
        });
        expect(rollResponse.status).toBe(200);
        matchState = (await rollResponse.json()).match_state;
        attempt++;
      }
      expect(matchState.phase).toBe("awaiting_move");
      expect(matchState.current_roll).toBe(6);

      const actingSubject: string = matchState.players[matchState.current_player_index].subject;
      const moveResponse = await app.request(`/games/ludo/debug/matches/${matchId}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenBySubject[actingSubject]}`,
        },
        body: JSON.stringify({
          type: "move_token",
          match_id: matchId,
          token_id: 0,
          idempotency_key: "move-1",
        }),
      });
      expect(moveResponse.status).toBe(200);
      const moveBody = await moveResponse.json();
      const movedPlayer = moveBody.match_state.players.find(
        (p: { subject: string }) => p.subject === actingSubject,
      );
      expect(movedPlayer.tokens[0].path_position).toBe(0);
    } finally {
      restoreEnv(saved);
    }
  });
});

describe("Ludo matchmaking-ticket routes", () => {
  it("rejects a create-ticket request without a valid Ludo game token", async () => {
    const saved = saveEnv();
    try {
      const { app } = await testHarness();
      const response = await app.request("/games/ludo/debug/matchmaking/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("ludo_authentication_required");
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects an invalid create-ticket payload", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const response = await app.request("/games/ludo/debug/matchmaking/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 3, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe("ludo_invalid_command");
    } finally {
      restoreEnv(saved);
    }
  });

  it("creates a searching ticket for an authenticated caller", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const response = await app.request("/games/ludo/debug/matchmaking/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.ticket.status).toBe("searching");
      expect(body.ticket.subject).toBe("alice");
      expect(body.idempotent).toBe(false);
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects a cancel-ticket request without a valid Ludo game token", async () => {
    const saved = saveEnv();
    try {
      const { app } = await testHarness();
      const response = await app.request("/games/ludo/debug/matchmaking/tickets/some-ticket-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(401);
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects cancelling a ticket owned by a different subject", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken, store } = await testHarness("alice");
      const { createTicket } = await import("./matchmaking-service");
      const created = await createTicket(store, "debug", {
        subject: "someone-else",
        mode: "classic",
        seatTarget: 2,
        idempotencyKey: "k1",
      });
      const response = await app.request(
        `/games/ludo/debug/matchmaking/tickets/${created.ticket.ticketId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${gameToken}` } },
      );
      expect(response.status).toBe(403);
      expect((await response.json()).error.code).toBe("ludo_ticket_forbidden");
    } finally {
      restoreEnv(saved);
    }
  });

  it("cancels the caller's own searching ticket", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const createResponse = await app.request("/games/ludo/debug/matchmaking/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      const ticketId = (await createResponse.json()).ticket.ticket_id;
      const response = await app.request(`/games/ludo/debug/matchmaking/tickets/${ticketId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${gameToken}` },
      });
      expect(response.status).toBe(200);
      expect((await response.json()).ticket.status).toBe("cancelled");
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects cancelling a ticket that does not exist", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const response = await app.request("/games/ludo/debug/matchmaking/tickets/nonexistent-id", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${gameToken}` },
      });
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("ludo_ticket_not_found");
    } finally {
      restoreEnv(saved);
    }
  });
});

describe("Ludo private-room routes (task 21)", () => {
  it("rejects a create-room request without a valid Ludo game token", async () => {
    const saved = saveEnv();
    try {
      const { app } = await testHarness();
      const response = await app.request("/games/ludo/debug/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("ludo_authentication_required");
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects an invalid create-room payload", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const response = await app.request("/games/ludo/debug/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 3, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe("ludo_invalid_command");
    } finally {
      restoreEnv(saved);
    }
  });

  it("creates a room and returns a shareable deep-link invite string", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const response = await app.request("/games/ludo/debug/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.room.status).toBe("waiting");
      expect(body.room.owner_subject).toBe("alice");
      expect(body.room.room_code).toMatch(/^[A-Z0-9]{6}$/);
      expect(body.invite_link).toBe(`w3dev-ludo://room/${body.room.room_code}`);
      expect(body.idempotent).toBe(false);
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects a join-room request without a valid Ludo game token", async () => {
    const saved = saveEnv();
    try {
      const { app } = await testHarness();
      const response = await app.request("/games/ludo/debug/rooms/ABCDEF/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotency_key: "k1" }),
      });
      expect(response.status).toBe(401);
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects an invalid room code on join", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("bob");
      const response = await app.request("/games/ludo/debug/rooms/not-a-code/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ idempotency_key: "k1" }),
      });
      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe("ludo_invalid_command");
    } finally {
      restoreEnv(saved);
    }
  });

  it("rejects joining a room code that does not exist", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("bob");
      const response = await app.request("/games/ludo/debug/rooms/ABCDEF/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ idempotency_key: "k1" }),
      });
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("ludo_room_not_found");
    } finally {
      restoreEnv(saved);
    }
  });

  it("joins a room by code and returns the active match once full", async () => {
    const saved = saveEnv();
    try {
      const { app, gameToken } = await testHarness("alice");
      const createResponse = await app.request("/games/ludo/debug/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gameToken}` },
        body: JSON.stringify({ mode: "classic", seat_target: 2, idempotency_key: "k1" }),
      });
      const roomCode = (await createResponse.json()).room.room_code;

      const bobToken = await signGameToken(
        {
          appId: "ludo",
          environment: "debug",
          secret: TEST_GAME_TOKEN_SECRET,
          issuer: TEST_GAME_TOKEN_ISSUER,
          audience: TEST_GAME_TOKEN_AUDIENCE,
        },
        { subject: "bob", role: "player" },
        300,
      );
      const response = await app.request(`/games/ludo/debug/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bobToken}` },
        body: JSON.stringify({ idempotency_key: "join-1" }),
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.room.status).toBe("matched");
      expect(body.match_state.status).toBe("active");
      expect(body.match_state.players).toHaveLength(2);
      expect(body.idempotent).toBe(false);
    } finally {
      restoreEnv(saved);
    }
  });
});
