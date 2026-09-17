import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { GameNamespace, GameSession, JsonObject } from "./contracts";
import { GAME_CONTRACT_VERSION } from "./contracts";
import { FileGameStore } from "./file-store";
import { type GameStorage, GameStorageUnavailableError, UnavailableGameStore } from "./storage";
import {
  EnvironmentGameTokenVerifier,
  GameTokenConfigurationError,
  type GameTokenVerifier,
} from "./tokens";
import {
  hasBoundedJsonSize,
  isBoundedMemberList,
  isGameAppId,
  isGameEnvironment,
  isJsonObject,
  isSafeIdentifier,
  MAX_JSON_BYTES,
} from "./validation";

interface GameVariables {
  session: GameSession;
  namespace: GameNamespace;
}

export interface GameRouteDependencies {
  tokenVerifier: GameTokenVerifier;
  store: GameStorage;
}

type GameContext = Context<{ Variables: GameVariables }>;
type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 500 | 503;

export function createGameRoutes(dependencies: GameRouteDependencies): Hono<{
  Variables: GameVariables;
}> {
  const routes = new Hono<{ Variables: GameVariables }>();

  routes.use(
    "/:appId/:environment/*",
    bodyLimit({
      maxSize: MAX_JSON_BYTES,
      onError: (c) =>
        c.json({ contract_version: GAME_CONTRACT_VERSION, error: "body_too_large" }, 413),
    }),
  );

  routes.use("/:appId/:environment/*", async (c, next) => {
    const appId = c.req.param("appId");
    const environment = c.req.param("environment");
    if (!isGameAppId(appId) || !isGameEnvironment(environment)) {
      return error(c, 404, "game_scope_not_found");
    }
    const headerAppId = c.req.header("X-App-Id");
    if (headerAppId && headerAppId !== appId) {
      return error(c, 400, "client_app_scope_mismatch");
    }
    const authorization = c.req.header("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return error(c, 401, "game_token_required");
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) return error(c, 401, "game_token_required");
    try {
      const session = await dependencies.tokenVerifier.verify(token, { appId, environment });
      c.set("session", session);
      c.set("namespace", { appId, environment });
      await next();
    } catch (cause) {
      if (cause instanceof GameTokenConfigurationError) {
        return error(c, 503, "game_token_configuration_unavailable");
      }
      return error(c, 401, "invalid_game_token");
    }
  });

  routes.get("/:appId/:environment/session", (c) => {
    const session = c.get("session");
    return c.json({
      contract_version: GAME_CONTRACT_VERSION,
      app_id: session.appId,
      environment: session.environment,
      subject: session.subject,
      role: session.role,
      namespace: `games.${session.appId}`,
    });
  });

  routes.get("/:appId/:environment/saves/:saveId", async (c) => {
    const saveId = c.req.param("saveId");
    if (!isSafeIdentifier(saveId)) return error(c, 400, "invalid_save_id");
    const session = c.get("session");
    const record = await dependencies.store.getSave(c.get("namespace"), saveId, session.subject);
    if (!record) return error(c, 404, "save_not_found");
    return c.json({ contract_version: GAME_CONTRACT_VERSION, save: record });
  });

  routes.put("/:appId/:environment/saves/:saveId", async (c) => {
    const saveId = c.req.param("saveId");
    if (!isSafeIdentifier(saveId)) return error(c, 400, "invalid_save_id");
    const body = await readObject(c);
    if (!body) return error(c, 400, "invalid_json_body");
    const scopeError = validateBodyScope(body, c.get("namespace"));
    if (scopeError) return error(c, 400, scopeError);
    const schemaVersion = integerValue(body.schema_version);
    const expectedVersion = integerValue(body.expected_version);
    const payload = body.payload;
    if (
      schemaVersion === null ||
      schemaVersion < 1 ||
      schemaVersion > 100 ||
      expectedVersion === null ||
      expectedVersion < 0 ||
      expectedVersion > 2_147_483_647 ||
      !isJsonObject(payload) ||
      !hasBoundedJsonSize(payload)
    ) {
      return error(c, 422, "invalid_save_payload");
    }
    const result = await dependencies.store.putSave(c.get("namespace"), {
      saveId,
      ownerUserId: c.get("session").subject,
      schemaVersion,
      expectedVersion,
      payload,
    });
    if (result.kind === "conflict") {
      return c.json(
        {
          contract_version: GAME_CONTRACT_VERSION,
          error: "save_version_conflict",
          current: result.current,
        },
        409,
      );
    }
    return c.json({ contract_version: GAME_CONTRACT_VERSION, save: result.record }, 200);
  });

  routes.get("/:appId/:environment/entitlements", async (c) => {
    const records = await dependencies.store.listEntitlements(
      c.get("namespace"),
      c.get("session").subject,
    );
    return c.json({ contract_version: GAME_CONTRACT_VERSION, entitlements: records });
  });

  routes.post("/:appId/:environment/purchases/grants", async (c) => {
    if (c.get("session").role !== "service") return error(c, 403, "service_role_required");
    const body = await readObject(c);
    if (!body) return error(c, 400, "invalid_json_body");
    const scopeError = validateBodyScope(body, c.get("namespace"));
    if (scopeError) return error(c, 400, scopeError);
    if (
      !isSafeIdentifier(body.entitlement_id) ||
      !isSafeIdentifier(body.product_id) ||
      !isSafeIdentifier(body.purchase_id) ||
      !isSafeIdentifier(body.user_id)
    ) {
      return error(c, 422, "invalid_purchase_grant");
    }
    const entitlement = await dependencies.store.grantPurchase(c.get("namespace"), {
      entitlementId: body.entitlement_id,
      productId: body.product_id,
      purchaseId: body.purchase_id,
      userId: body.user_id,
    });
    return c.json({ contract_version: GAME_CONTRACT_VERSION, entitlement }, 200);
  });

  routes.post("/:appId/:environment/challenges/:challengeId", async (c) => {
    const body = await readObject(c);
    if (!body) return error(c, 400, "invalid_json_body");
    const scopeError = validateBodyScope(body, c.get("namespace"));
    if (scopeError) return error(c, 400, scopeError);
    const session = c.get("session");
    const challengeId = c.req.param("challengeId");
    if (
      !isSafeIdentifier(challengeId) ||
      (body.challenge_id !== undefined && body.challenge_id !== challengeId)
    ) {
      return error(c, 400, "invalid_challenge_id");
    }
    if (body.owner_user_id !== undefined && body.owner_user_id !== session.subject) {
      return error(c, 400, "client_owner_scope_mismatch");
    }
    if (
      !isBoundedMemberList(body.member_user_ids) ||
      !isJsonObject(body.payload) ||
      !hasBoundedJsonSize(body.payload)
    ) {
      return error(c, 422, "invalid_challenge_payload");
    }
    const memberUserIds = Array.from(new Set([session.subject, ...body.member_user_ids]));
    const challenge = await dependencies.store.createChallenge(c.get("namespace"), {
      challengeId,
      ownerUserId: session.subject,
      memberUserIds,
      payload: body.payload,
    });
    return c.json({ contract_version: GAME_CONTRACT_VERSION, challenge }, 201);
  });

  routes.get("/:appId/:environment/challenges/:challengeId", async (c) => {
    const challengeId = c.req.param("challengeId");
    if (!isSafeIdentifier(challengeId)) return error(c, 400, "invalid_challenge_id");
    const challenge = await dependencies.store.getChallenge(c.get("namespace"), challengeId);
    if (!challenge) return error(c, 404, "challenge_not_found");
    const subject = c.get("session").subject;
    if (challenge.ownerUserId !== subject && !challenge.memberUserIds.includes(subject)) {
      return error(c, 403, "challenge_membership_required");
    }
    return c.json({ contract_version: GAME_CONTRACT_VERSION, challenge });
  });

  routes.get("/:appId/:environment/admin/summary", async (c) => {
    if (c.get("session").role !== "game_admin") return error(c, 403, "game_admin_role_required");
    const summary = await dependencies.store.getAdminSummary(c.get("namespace"));
    return c.json({ contract_version: GAME_CONTRACT_VERSION, summary });
  });

  routes.onError((cause, c) => {
    if (cause instanceof GameStorageUnavailableError) {
      return error(c, 503, "game_storage_unavailable");
    }
    if (cause instanceof Error && cause.message === "Challenge already exists") {
      return error(c, 409, "challenge_exists");
    }
    return error(c, 500, "game_route_failed");
  });

  return routes;
}

export function createConfiguredGameRoutes(): Hono<{ Variables: GameVariables }> {
  const root = process.env.GAME_STORAGE_ROOT;
  return createGameRoutes({
    tokenVerifier: new EnvironmentGameTokenVerifier(),
    store: root ? new FileGameStore(root) : new UnavailableGameStore(),
  });
}

async function readObject(c: GameContext): Promise<JsonObject | null> {
  try {
    const value = await c.req.json<unknown>();
    return isJsonObject(value) && hasBoundedJsonSize(value) ? value : null;
  } catch {
    return null;
  }
}

function validateBodyScope(body: JsonObject, namespace: GameNamespace): string | null {
  if (body.app_id !== undefined && body.app_id !== namespace.appId) {
    return "client_app_scope_mismatch";
  }
  if (body.environment !== undefined && body.environment !== namespace.environment) {
    return "client_environment_scope_mismatch";
  }
  return null;
}

function integerValue(value: JsonObject[string]): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function error(c: GameContext, status: ErrorStatus, code: string): Response {
  return c.json({ contract_version: GAME_CONTRACT_VERSION, error: code }, status);
}
