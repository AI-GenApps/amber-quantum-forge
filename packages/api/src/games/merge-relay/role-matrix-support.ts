import { Hono } from "hono";
import { SignJWT } from "jose";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

export const matrixTokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-role-matrix-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-role-matrix",
};

export const PRINCIPALS = [
  "none",
  "malformed_token",
  "expired_token",
  "wrong_secret",
  "wrong_app_claim",
  "wrong_environment_claim",
  "forged_role_claim",
  "app_header_mismatch",
  "player",
  "guest",
  "moderator",
  "game_admin",
  "service",
] as const;

export type Principal = (typeof PRINCIPALS)[number];

export const ROLE_PRINCIPALS = ["player", "guest", "moderator", "game_admin", "service"] as const;

const claims = (overrides: Record<string, unknown>) => ({
  app_id: matrixTokenConfig.appId,
  environment: matrixTokenConfig.environment,
  role: "player",
  ...overrides,
});

async function rawToken(
  payload: Record<string, unknown>,
  options: { secret?: string; expiresAt?: number; subject?: string } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(matrixTokenConfig.issuer)
    .setAudience(matrixTokenConfig.audience)
    .setSubject(options.subject ?? "matrix_player")
    .setIssuedAt(now - 100)
    .setExpirationTime(options.expiresAt ?? now + 300)
    .sign(new TextEncoder().encode(options.secret ?? matrixTokenConfig.secret));
}

export async function principalHeaders(principal: Principal): Promise<Record<string, string>> {
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
  const now = Math.floor(Date.now() / 1000);
  if (principal === "none") return {};
  if (principal === "malformed_token") return bearer("not-a-jwt");
  if (principal === "expired_token")
    return bearer(await rawToken(claims({}), { expiresAt: now - 30 }));
  if (principal === "wrong_secret")
    return bearer(
      await rawToken(claims({}), { secret: "another-secret-with-at-least-32-characters-x" }),
    );
  if (principal === "wrong_app_claim")
    return bearer(await rawToken(claims({ app_id: "pocket_biome" })));
  if (principal === "wrong_environment_claim")
    return bearer(await rawToken(claims({ environment: "staging" })));
  if (principal === "forged_role_claim")
    return bearer(await rawToken(claims({ role: "superadmin" })));
  const role = principal === "guest" || principal === "app_header_mismatch" ? "player" : principal;
  const subject = principal === "guest" ? "guest_matrix" : `matrix_${principal}`;
  const token = await signGameToken(matrixTokenConfig, { subject, role });
  if (principal === "app_header_mismatch") return { ...bearer(token), "X-App-Id": "pocket_biome" };
  return bearer(token);
}

export function createMatrixApp(): {
  app: Hono;
  registered: Array<{ method: string; path: string }>;
} {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("matrix config missing");
  config.features.rankedRelay = true;
  const routes = createMergeRelayRoutes({
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: { now: () => new Date("2026-02-03T10:00:00.000Z") },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(matrixTokenConfig),
  });
  const app = new Hono();
  app.route("/games/merge_relay", routes);
  return {
    app,
    registered: routes.routes
      .filter((route) => route.method !== "ALL")
      .map((route) => ({ method: route.method, path: route.path })),
  };
}

export interface MatrixOutcome {
  status: number;
  code: string | null;
}

export async function probe(
  app: Hono,
  principal: Principal,
  route: { method: string; path: string; body?: unknown },
): Promise<MatrixOutcome> {
  const headers: Record<string, string> = await principalHeaders(principal);
  if (route.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await app.request(`/games/merge_relay/debug${route.path}`, {
    method: route.method,
    headers,
    body: route.body === undefined ? undefined : JSON.stringify(route.body),
  });
  const parsed = (await response.json().catch(() => null)) as {
    error?: { code?: string };
  } | null;
  return { status: response.status, code: parsed?.error?.code ?? null };
}
