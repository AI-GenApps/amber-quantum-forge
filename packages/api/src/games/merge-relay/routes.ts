import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  EnvironmentGameTokenVerifier,
  type GameTokenConfig,
  GameTokenConfigurationError,
  signGameToken,
} from "../tokens";
import { isGameEnvironment } from "../validation";
import { createCommerceRuntimeFromEnvironment } from "./commerce-runtime";
import {
  MERGE_RELAY_APP_ID,
  MERGE_RELAY_CONTRACT_VERSION,
  type MergeEnvironment,
  type MergeSession,
} from "./contracts";
import { systemMergeRelayClock } from "./dependencies";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { asMergeError } from "./errors";
import { effectiveSubject } from "./identity-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createPgsRuntimeFromEnvironment } from "./pgs-runtime";
import { registerCommerceRoutes } from "./route-commerce";
import {
  fail,
  isPublicPath,
  type MergeRelayRouteDependencies,
  type MergeRoutes,
} from "./route-context";
import { registerDataRoutes } from "./route-data";
import { registerPlatformRoutes } from "./route-platform";
import { registerPublicRoutes } from "./route-public";
import { registerRelayRoutes } from "./route-relay";
import { MergeRelayStorageError, UnavailableMergeRelayStore } from "./store";

export type { MergeRelayRouteDependencies } from "./route-context";

export function createMergeRelayRoutes(dependencies: MergeRelayRouteDependencies): MergeRoutes {
  const routes = new Hono<{
    Variables: { environment: MergeEnvironment; session: MergeSession };
  }>();
  routes.use(
    "/:environment/*",
    bodyLimit({
      maxSize: 64 * 1024,
      onError: (c) =>
        c.json(
          {
            contract_version: MERGE_RELAY_CONTRACT_VERSION,
            error: {
              code: "body_too_large",
              message: "Request body is too large",
              diagnostic_id: "body-limit",
            },
          },
          413,
        ),
    }),
  );
  routes.use("/:environment/*", async (c, next) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment))
      return fail(c, 404, "environment_not_found", "Environment was not found");
    if (isPublicPath(c.req.path, environment, c.req.method)) {
      c.set("environment", environment);
      return next();
    }
    if (c.req.header("X-App-Id") && c.req.header("X-App-Id") !== MERGE_RELAY_APP_ID)
      return fail(
        c,
        400,
        "client_app_scope_mismatch",
        "The client app scope does not match Merge Relay",
      );
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ") || header.slice(7).trim().length === 0)
      return fail(c, 401, "game_token_required", "A verified game token is required");
    try {
      const session = await dependencies.tokenVerifier.verify(header.slice(7).trim(), {
        appId: MERGE_RELAY_APP_ID,
        environment,
      });
      if (session.appId !== MERGE_RELAY_APP_ID || session.environment !== environment)
        return fail(c, 401, "invalid_game_token", "The game token scope is invalid");
      c.set("environment", environment);
      c.set("session", {
        ...(session as import("./contracts").MergeSession),
        subject: await effectiveSubject(dependencies, environment, session.subject),
      });
      return next();
    } catch (error) {
      if (error instanceof GameTokenConfigurationError)
        return fail(c, 503, error.code, error.message);
      return fail(c, 401, "invalid_game_token", "The game token could not be verified");
    }
  });

  registerPublicRoutes(routes, dependencies);
  registerRelayRoutes(routes, dependencies);
  registerDataRoutes(routes, dependencies);
  registerCommerceRoutes(routes, dependencies);
  registerPlatformRoutes(routes, dependencies);
  routes.onError((error, c) => {
    const mapped = asMergeError(error);
    if (error instanceof MergeRelayStorageError)
      return fail(c, 503, error.code, "Merge Relay storage is unavailable");
    if (error instanceof GameTokenConfigurationError)
      return fail(c, 503, error.code, error.message);
    return c.json(mapped.response(), mapped.status);
  });
  return routes;
}

export function createConfiguredMergeRelayRoutes(): MergeRoutes {
  const store = configuredStore();
  return createMergeRelayRoutes({
    store,
    clock: systemMergeRelayClock,
    rewardProvider: null,
    pgsRuntimeForEnvironment: createPgsRuntimeFromEnvironment,
    commerceRuntimeForEnvironment: createCommerceRuntimeFromEnvironment,
    tokenVerifier: new EnvironmentGameTokenVerifier(),
    issueGuestToken: issueConfiguredGuestToken,
  });
}

function configuredStore() {
  if (process.env.NODE_ENV !== "production" && process.env.MERGE_RELAY_LOCAL_STORE === "memory")
    return new InMemoryMergeRelayStore();
  if (process.env.DATABASE_URL) return new DrizzleMergeRelayStore();
  return new UnavailableMergeRelayStore();
}

async function issueConfiguredGuestToken(
  environment: MergeEnvironment,
  subject: string,
): Promise<string> {
  const config = tokenConfig(environment);
  return signGameToken(config, { subject, role: "player" }, 86_400);
}

function tokenConfig(environment: MergeEnvironment): GameTokenConfig {
  const secret =
    process.env[
      `GAME_TOKEN_SECRET_${MERGE_RELAY_APP_ID.toUpperCase()}_${environment.toUpperCase()}`
    ];
  const issuer = process.env.GAME_TOKEN_ISSUER;
  const audience = process.env.GAME_TOKEN_AUDIENCE;
  if (!secret || !issuer || !audience)
    throw new GameTokenConfigurationError("Guest token configuration is unavailable");
  return { appId: MERGE_RELAY_APP_ID, environment, secret, issuer, audience };
}
