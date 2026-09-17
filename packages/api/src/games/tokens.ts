import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { GameAppId, GameEnvironment, GameRole, GameSession } from "./contracts";
import { isGameAppId, isGameEnvironment, isGameRole } from "./validation";

export interface GameTokenConfig {
  appId: GameAppId;
  environment: GameEnvironment;
  secret: string;
  issuer: string;
  audience: string;
}

export interface GameTokenClaims {
  subject: string;
  role: GameRole;
}

export interface GameTokenVerifier {
  verify(
    token: string,
    expected: { appId: GameAppId; environment: GameEnvironment },
  ): Promise<GameSession>;
}

class GameTokenError extends Error {
  readonly code = "invalid_game_token";
}

export class GameTokenConfigurationError extends Error {
  readonly code = "game_token_configuration_unavailable";
}

function keyName(appId: GameAppId, environment: GameEnvironment): string {
  return `GAME_TOKEN_SECRET_${appId.toUpperCase()}_${environment.toUpperCase()}`;
}

function validateConfig(config: GameTokenConfig): void {
  if (config.secret.length < 32) {
    throw new GameTokenConfigurationError("Game token secret must contain at least 32 characters");
  }
  if (config.issuer.length === 0 || config.audience.length === 0) {
    throw new GameTokenConfigurationError("Game token issuer and audience are required");
  }
}

export class SignedGameTokenVerifier implements GameTokenVerifier {
  private readonly config: GameTokenConfig;
  private readonly secret: Uint8Array;

  constructor(config: GameTokenConfig) {
    validateConfig(config);
    this.config = config;
    this.secret = new TextEncoder().encode(config.secret);
  }

  async verify(
    token: string,
    expected: { appId: GameAppId; environment: GameEnvironment },
  ): Promise<GameSession> {
    if (expected.appId !== this.config.appId || expected.environment !== this.config.environment) {
      throw new GameTokenError("Token verifier scope does not match request scope");
    }

    try {
      const result = await jwtVerify(token, this.secret, {
        algorithms: ["HS256"],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      if (result.protectedHeader.alg !== "HS256") {
        throw new GameTokenError("Unsupported game token algorithm");
      }
      const payload = result.payload;
      validatePayload(payload, expected);
      return {
        appId: expected.appId,
        environment: expected.environment,
        subject: payload.sub as string,
        role: payload.role as GameRole,
      };
    } catch (error) {
      if (error instanceof GameTokenError) throw error;
      throw new GameTokenError("Game token verification failed");
    }
  }
}

export class EnvironmentGameTokenVerifier implements GameTokenVerifier {
  async verify(
    token: string,
    expected: { appId: GameAppId; environment: GameEnvironment },
  ): Promise<GameSession> {
    const secret = process.env[keyName(expected.appId, expected.environment)];
    const issuer = process.env.GAME_TOKEN_ISSUER;
    const audience = process.env.GAME_TOKEN_AUDIENCE;
    if (!secret || !issuer || !audience) {
      throw new GameTokenConfigurationError("Game token environment configuration is unavailable");
    }
    return new SignedGameTokenVerifier({
      appId: expected.appId,
      environment: expected.environment,
      secret,
      issuer,
      audience,
    }).verify(token, expected);
  }
}

function validatePayload(
  payload: JWTPayload,
  expected: { appId: GameAppId; environment: GameEnvironment },
): void {
  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128 ||
    !isSafeSubject(payload.sub)
  ) {
    throw new GameTokenError("Game token subject is invalid");
  }
  if (typeof payload.exp !== "number" || !Number.isInteger(payload.exp)) {
    throw new GameTokenError("Game token expiry is required");
  }
  if (typeof payload.iat !== "number" || !Number.isInteger(payload.iat)) {
    throw new GameTokenError("Game token issued-at time is required");
  }
  if (
    typeof payload.app_id !== "string" ||
    typeof payload.environment !== "string" ||
    payload.app_id !== expected.appId ||
    payload.environment !== expected.environment
  ) {
    throw new GameTokenError("Game token identifiers are invalid");
  }
  if (!isGameAppId(payload.app_id) || !isGameEnvironment(payload.environment)) {
    throw new GameTokenError("Game token identifiers are invalid");
  }
  if (!isGameRole(payload.role)) {
    throw new GameTokenError("Game token role is invalid");
  }
}

function isSafeSubject(value: string): boolean {
  return /^[A-Za-z0-9._:@-]+$/.test(value);
}

export async function signGameToken(
  config: GameTokenConfig,
  claims: GameTokenClaims,
  expiresInSeconds = 300,
): Promise<string> {
  validateConfig(config);
  if (expiresInSeconds < 1 || expiresInSeconds > 86_400) {
    throw new RangeError("Game token expiry must be between 1 and 86400 seconds");
  }
  if (!isSafeSubject(claims.subject) || !isGameRole(claims.role)) {
    throw new TypeError("Game token claims are invalid");
  }
  return new SignJWT({
    app_id: config.appId,
    environment: config.environment,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setSubject(claims.subject)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(new TextEncoder().encode(config.secret));
}
