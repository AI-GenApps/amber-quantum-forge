import type { Context } from "hono";
import { Hono } from "hono";
import { verifyApiToken } from "../../routes/auth-tokens";
import {
  EnvironmentGameTokenVerifier,
  GameTokenConfigurationError,
  signGameToken,
} from "../tokens";
import { isGameEnvironment } from "../validation";
import type { LudoEnvironment, LudoSession } from "./contracts";
import { LUDO_APP_ID, LUDO_CONTRACT_VERSION } from "./contracts";
import { resolveMatchViewPublisher } from "./dependencies";
import { DrizzleLudoStore } from "./drizzle-store";
import { DrizzleLudoEconomyStore } from "./economy-drizzle-store";
import type { LudoEconomyStore } from "./economy-store";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { asLudoError, LudoError } from "./errors";
import { NullMatchViewPublisher } from "./match-view-publisher";
import { cancelTicket, createTicket, getTicket } from "./matchmaking-service";
import { InMemoryLudoStore } from "./memory-store";
import { HttpRevenueCatClient } from "./revenuecat-client";
import { registerLudoRevenueCatRoutes } from "./revenuecat-routes";
import { createRoom, getRoom, joinRoom } from "./room-service";
import type { LudoRouteDependencies } from "./routes-types";
import { createMatch, getMatchState, getMatchView, processCommand } from "./service";
import { LudoStorageError, type LudoStore, UnavailableLudoStore } from "./store";
import {
  parseCreateMatchmakingTicketRequest,
  parseCreateRoomRequest,
  parseJoinRoomRequest,
  parseLudoCommand,
  parseRoomCodeParam,
  parseTicketIdParam,
} from "./validation";
import { registerLudoWalletRoutes } from "./wallet-routes";
import {
  matchmakingTicketToWire,
  matchViewToWire,
  roomToWire,
  sessionResponseToWire,
  toWireMatchState,
} from "./wire";

const SESSION_TOKEN_TTL_SECONDS = 300;

export type { LudoRouteDependencies } from "./routes-types";

type AuthResult = { ok: true; session: LudoSession } | { ok: false; response: Response };

async function authenticateGameToken(
  c: Context,
  dependencies: LudoRouteDependencies,
  environment: LudoEnvironment,
): Promise<AuthResult> {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    const error = new LudoError(
      401,
      "ludo_authentication_required",
      "A valid Ludo game token is required",
    );
    return { ok: false, response: c.json(error.response(), error.status) };
  }
  try {
    const session = await dependencies.verifyGameToken.verify(token, {
      appId: LUDO_APP_ID,
      environment,
    });
    return { ok: true, session: session as LudoSession };
  } catch {
    const error = new LudoError(
      401,
      "ludo_authentication_required",
      "A valid Ludo game token is required",
    );
    return { ok: false, response: c.json(error.response(), error.status) };
  }
}

async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

export function createLudoRoutes(dependencies: LudoRouteDependencies): Hono {
  const routes = new Hono();
  const matchViewPublisher = dependencies.matchViewPublisher ?? new NullMatchViewPublisher();
  const economyStore = dependencies.economyStore ?? new InMemoryLudoEconomyStore();

  routes.post("/:environment/session", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const verification = await verifyApiToken(c.req.header("Authorization"));
    if (!verification.ok) {
      const error = new LudoError(
        401,
        "ludo_authentication_required",
        "A valid API access token is required",
      );
      return c.json(error.response(), error.status);
    }
    const subject = verification.payload.sub;
    try {
      const gameToken = await dependencies.signSessionToken(environment, subject);
      return c.json(
        sessionResponseToWire({
          contractVersion: LUDO_CONTRACT_VERSION,
          gameToken,
          appId: LUDO_APP_ID,
          environment,
          subject,
          expiresIn: SESSION_TOKEN_TTL_SECONDS,
        }),
        200,
      );
    } catch (cause) {
      if (cause instanceof GameTokenConfigurationError) {
        const error = new LudoError(
          503,
          "ludo_token_configuration_unavailable",
          "Ludo game token configuration is unavailable",
        );
        return c.json(error.response(), error.status);
      }
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/matches", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsed = parseLudoCommand(await readJsonBody(c));
    if (!parsed.ok || parsed.value.type !== "create_match") {
      const error = new LudoError(
        422,
        "ludo_invalid_command",
        "A valid create_match payload (mode, seats, idempotency_key) is required",
      );
      return c.json(error.response(), error.status);
    }

    try {
      const result = await createMatch(
        dependencies.store,
        environment,
        {
          subject: auth.session.subject,
          mode: parsed.value.mode,
          seats: parsed.value.seats,
          idempotencyKey: parsed.value.idempotencyKey,
          coinTier: parsed.value.coinTier,
        },
        "direct",
        { matchViewPublisher, economyStore },
      );
      return c.json(
        { match_state: toWireMatchState(result.matchState), idempotent: result.idempotent },
        201,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.get("/:environment/matches/:matchId", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const matchId = c.req.param("matchId");
    try {
      // Applies task 19's lazy timeout check before returning: a client
      // polling a stalled opponent's match always observes the
      // post-timeout state on its very next read.
      const result = await getMatchState(
        dependencies.store,
        environment,
        auth.session.subject,
        matchId,
        { economyStore },
      );
      return c.json({ match_state: toWireMatchState(result.matchState) }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  // Task 22: HTTP polling fallback for clients without Firestore
  // connectivity. Returns the exact `LudoMatchView` shape a
  // `MatchViewPublisher.publish()` call would carry, synchronously from
  // `LudoStore` (the ground truth the Firestore mirror only fast-forwards
  // from). Seat ownership is enforced the same way as the plain match-state
  // route above: `getMatchView` -> `getMatchState` throws
  // `ludo_forbidden_role` for a caller not seated in this match.
  routes.get("/:environment/matches/:matchId/state", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const matchId = c.req.param("matchId");
    try {
      const result = await getMatchView(
        dependencies.store,
        environment,
        auth.session.subject,
        matchId,
        { economyStore },
      );
      return c.json({ match_view: matchViewToWire(result.matchView) }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/matches/:matchId/commands", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const matchId = c.req.param("matchId");
    const parsed = parseLudoCommand(await readJsonBody(c));
    if (!parsed.ok || parsed.value.type === "create_match" || parsed.value.matchId !== matchId) {
      const error = new LudoError(
        422,
        "ludo_invalid_command",
        "A valid command payload whose match_id matches :matchId is required",
      );
      return c.json(error.response(), error.status);
    }

    try {
      const result = await processCommand(
        dependencies.store,
        environment,
        auth.session.subject,
        parsed.value,
        { matchViewPublisher, economyStore },
      );
      return c.json(
        { match_state: toWireMatchState(result.matchState), idempotent: result.idempotent },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/matchmaking/tickets", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsed = parseCreateMatchmakingTicketRequest(await readJsonBody(c));
    if (!parsed.ok) {
      const error = new LudoError(
        422,
        "ludo_invalid_command",
        "A valid matchmaking ticket payload (mode, seat_target, idempotency_key) is required",
      );
      return c.json(error.response(), error.status);
    }

    try {
      const result = await createTicket(dependencies.store, environment, {
        subject: auth.session.subject,
        mode: parsed.value.mode,
        seatTarget: parsed.value.seatTarget,
        idempotencyKey: parsed.value.idempotencyKey,
        coinTier: parsed.value.coinTier,
      });
      return c.json(
        { ticket: matchmakingTicketToWire(result.ticket), idempotent: result.idempotent },
        201,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  // Task 26: the client's only way to learn a ticket transitioned to
  // `matched` (and which match it landed in) — a searching ticket's
  // idempotent-create replay never surfaces this (see `getTicket`'s
  // docstring), so the matchmaking-search screen polls this route instead.
  routes.get("/:environment/matchmaking/tickets/:ticketId", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsedTicketId = parseTicketIdParam(c.req.param("ticketId"));
    if (!parsedTicketId.ok) {
      const error = new LudoError(422, "ludo_invalid_command", "A valid ticket id is required");
      return c.json(error.response(), error.status);
    }

    try {
      const result = await getTicket(
        dependencies.store,
        environment,
        auth.session.subject,
        parsedTicketId.value,
      );
      return c.json({ ticket: matchmakingTicketToWire(result.ticket) }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.delete("/:environment/matchmaking/tickets/:ticketId", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsedTicketId = parseTicketIdParam(c.req.param("ticketId"));
    if (!parsedTicketId.ok) {
      const error = new LudoError(422, "ludo_invalid_command", "A valid ticket id is required");
      return c.json(error.response(), error.status);
    }

    try {
      const result = await cancelTicket(
        dependencies.store,
        environment,
        auth.session.subject,
        parsedTicketId.value,
      );
      return c.json({ ticket: matchmakingTicketToWire(result.ticket) }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/rooms", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsed = parseCreateRoomRequest(await readJsonBody(c));
    if (!parsed.ok) {
      const error = new LudoError(
        422,
        "ludo_invalid_command",
        "A valid room payload (mode, seat_target, idempotency_key) is required",
      );
      return c.json(error.response(), error.status);
    }

    try {
      const result = await createRoom(dependencies.store, environment, {
        subject: auth.session.subject,
        mode: parsed.value.mode,
        seatTarget: parsed.value.seatTarget,
        idempotencyKey: parsed.value.idempotencyKey,
        coinTier: parsed.value.coinTier,
      });
      return c.json(
        {
          room: roomToWire(result.room),
          invite_link: result.inviteLink,
          idempotent: result.idempotent,
        },
        201,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  // Task 26: the room creator's only way to learn another player joined and
  // filled their room (a joining caller already gets `match_state` back
  // synchronously from the join route below) — mirrors the matchmaking
  // ticket GET route above for the identical reason.
  routes.get("/:environment/rooms/:roomCode", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsedRoomCode = parseRoomCodeParam(c.req.param("roomCode"));
    if (!parsedRoomCode.ok) {
      const error = new LudoError(422, "ludo_invalid_command", "A valid room code is required");
      return c.json(error.response(), error.status);
    }

    try {
      const result = await getRoom(
        dependencies.store,
        environment,
        auth.session.subject,
        parsedRoomCode.value,
      );
      return c.json({ room: roomToWire(result.room) }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/rooms/:roomCode/join", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsedRoomCode = parseRoomCodeParam(c.req.param("roomCode"));
    const parsedBody = parseJoinRoomRequest(await readJsonBody(c));
    if (!parsedRoomCode.ok || !parsedBody.ok) {
      const error = new LudoError(
        422,
        "ludo_invalid_command",
        "A valid room code and idempotency_key are required",
      );
      return c.json(error.response(), error.status);
    }

    try {
      const result = await joinRoom(
        dependencies.store,
        environment,
        {
          subject: auth.session.subject,
          roomCode: parsedRoomCode.value,
          idempotencyKey: parsedBody.value.idempotencyKey,
        },
        { matchViewPublisher, economyStore },
      );
      return c.json(
        {
          room: roomToWire(result.room),
          match_state: toWireMatchState(result.matchState),
          idempotent: result.idempotent,
        },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  registerLudoWalletRoutes(routes, dependencies, economyStore, authenticateGameToken);
  registerLudoRevenueCatRoutes(routes, dependencies, economyStore, authenticateGameToken);

  return routes;
}

export function createConfiguredLudoRoutes(): Hono {
  return createLudoRoutes({
    signSessionToken: async (environment, subject) => {
      const secret = process.env[`GAME_TOKEN_SECRET_LUDO_${environment.toUpperCase()}`];
      const issuer = process.env.GAME_TOKEN_ISSUER;
      const audience = process.env.GAME_TOKEN_AUDIENCE;
      if (!secret || !issuer || !audience) {
        throw new GameTokenConfigurationError(
          "Ludo game token environment configuration is unavailable",
        );
      }
      return signGameToken(
        {
          appId: LUDO_APP_ID,
          environment: environment as "debug" | "staging" | "production",
          secret,
          issuer,
          audience,
        },
        { subject, role: "player" },
        SESSION_TOKEN_TTL_SECONDS,
      );
    },
    verifyGameToken: new EnvironmentGameTokenVerifier(),
    store: configuredLudoStore(),
    matchViewPublisher: resolveMatchViewPublisher(),
    economyStore: configuredLudoEconomyStore(),
    revenueCatWebhookSecret: configuredRevenueCatWebhookSecret(),
    revenueCatClient: configuredRevenueCatClient(),
  });
}

/** Task 26d: a Ludo-specific secret (`REVENUECAT_WEBHOOK_SECRET_LUDO`)
 * takes precedence; falls back to the shared `REVENUECAT_WEBHOOK_SECRET`
 * documented in `docs-internal/setup/02-env-vars.md` for a deploy that
 * reuses one RevenueCat webhook secret across apps. No server-side route
 * reads `REVENUECAT_WEBHOOK_SECRET` today (only `apps/native`'s client SDK
 * reads an unrelated public API key), so this is a safe first use. */
function configuredRevenueCatWebhookSecret(): string | undefined {
  return process.env.REVENUECAT_WEBHOOK_SECRET_LUDO ?? process.env.REVENUECAT_WEBHOOK_SECRET;
}

/** Degrades to `NullRevenueCatClient` (via `registerLudoRevenueCatRoutes`'s
 * default) when `REVENUECAT_API_KEY_LUDO` is absent — no RevenueCat
 * credentials exist in this environment. */
function configuredRevenueCatClient(): HttpRevenueCatClient | undefined {
  const secretApiKey = process.env.REVENUECAT_API_KEY_LUDO;
  return secretApiKey ? new HttpRevenueCatClient(secretApiKey) : undefined;
}

export function configuredLudoStore(): LudoStore {
  if (process.env.NODE_ENV !== "production" && process.env.LUDO_LOCAL_STORE === "memory") {
    return new InMemoryLudoStore();
  }
  if (process.env.DATABASE_URL) return new DrizzleLudoStore();
  return new UnavailableLudoStore();
}

/** Mirrors `configuredLudoStore()`. `LudoEconomyStore` has no `Unavailable`
 * variant (unlike `LudoStore`) — without `DATABASE_URL` this falls back to
 * an in-memory store rather than failing route construction, matching this
 * epic's "degrade gracefully when credentials/config are absent" rule; a
 * misconfigured production deploy still fails match/session routes via
 * `UnavailableLudoStore` regardless. */
export function configuredLudoEconomyStore(): LudoEconomyStore {
  if (process.env.NODE_ENV !== "production" && process.env.LUDO_LOCAL_STORE === "memory") {
    return new InMemoryLudoEconomyStore();
  }
  if (process.env.DATABASE_URL) return new DrizzleLudoEconomyStore();
  return new InMemoryLudoEconomyStore();
}

// Re-exported so callers that only need the storage error type (e.g. a
// future health check) do not need to import from `./store` directly.
export { LudoStorageError };
