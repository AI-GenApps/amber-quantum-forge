import type { Context } from "hono";
import { Hono } from "hono";
import { verifyApiToken } from "../../routes/auth-tokens";
import type { GameTokenVerifier } from "../tokens";
import {
  EnvironmentGameTokenVerifier,
  GameTokenConfigurationError,
  signGameToken,
} from "../tokens";
import { isGameEnvironment } from "../validation";
import type { LudoEnvironment, LudoSession } from "./contracts";
import { LUDO_APP_ID, LUDO_CONTRACT_VERSION } from "./contracts";
import { DrizzleLudoStore } from "./drizzle-store";
import { asLudoError, LudoError } from "./errors";
import { cancelTicket, createTicket } from "./matchmaking-service";
import { InMemoryLudoStore } from "./memory-store";
import { createMatch, getMatchState, processCommand } from "./service";
import { LudoStorageError, type LudoStore, UnavailableLudoStore } from "./store";
import {
  parseCreateMatchmakingTicketRequest,
  parseLudoCommand,
  parseTicketIdParam,
} from "./validation";
import { matchmakingTicketToWire, sessionResponseToWire, toWireMatchState } from "./wire";

const SESSION_TOKEN_TTL_SECONDS = 300;

export interface LudoRouteDependencies {
  signSessionToken: (environment: string, subject: string) => Promise<string>;
  verifyGameToken: GameTokenVerifier;
  store: LudoStore;
}

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
        },
        "direct",
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
      );
      return c.json({ match_state: toWireMatchState(result.matchState) }, 200);
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
  });
}

export function configuredLudoStore(): LudoStore {
  if (process.env.NODE_ENV !== "production" && process.env.LUDO_LOCAL_STORE === "memory") {
    return new InMemoryLudoStore();
  }
  if (process.env.DATABASE_URL) return new DrizzleLudoStore();
  return new UnavailableLudoStore();
}

// Re-exported so callers that only need the storage error type (e.g. a
// future health check) do not need to import from `./store` directly.
export { LudoStorageError };
