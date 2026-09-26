import { Hono } from "hono";
import { verifyApiToken } from "../../routes/auth-tokens";
import { GameTokenConfigurationError, signGameToken } from "../tokens";
import { isGameEnvironment } from "../validation";
import { LUDO_APP_ID, LUDO_CONTRACT_VERSION } from "./contracts";
import { asLudoError, LudoError } from "./errors";
import { sessionResponseToWire } from "./wire";

const SESSION_TOKEN_TTL_SECONDS = 300;

export interface LudoRouteDependencies {
  signSessionToken: (environment: string, subject: string) => Promise<string>;
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
  });
}
