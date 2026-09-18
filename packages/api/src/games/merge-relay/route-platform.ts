import { dispatchPgsOutbox } from "./pgs-dispatch";
import { getPgsIdentityStatus, linkPgsIdentity } from "./pgs-service";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";

export function registerPlatformRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.get("/:environment/platform/google-play-games/identity", async (c) => {
    const identity = await getPgsIdentityStatus(
      dependencies,
      c.get("environment"),
      c.get("session"),
    );
    return respond(c, {
      identity: {
        provider: identity.provider,
        configured: identity.configured,
        status: identity.status,
      },
    });
  });

  routes.post("/:environment/platform/google-play-games/identity", async (c) => {
    const body = await readBody(c);
    const serverAuthCode = body?.server_auth_code;
    if (
      typeof serverAuthCode !== "string" ||
      serverAuthCode.length < 1 ||
      serverAuthCode.length > 4096
    )
      return fail(c, 422, "invalid_pgs_auth_code", "The provider auth code is invalid");
    const identity = await linkPgsIdentity(
      dependencies,
      c.get("environment"),
      c.get("session"),
      serverAuthCode,
    );
    return respond(c, {
      identity: {
        identity_id: identity.identityId,
        provider: identity.provider,
        player_id: identity.playerId,
        status: identity.status,
        verified_at: identity.verifiedAt,
      },
    });
  });

  routes.post("/:environment/platform/google-play-games/outbox/dispatch", async (c) => {
    if (c.get("session").role !== "service")
      return fail(c, 403, "service_role_required", "A service role is required");
    const body = await readBody(c);
    const requestedLimit = body?.limit;
    if (
      requestedLimit !== undefined &&
      (typeof requestedLimit !== "number" ||
        !Number.isSafeInteger(requestedLimit) ||
        requestedLimit < 1 ||
        requestedLimit > 20)
    )
      return fail(c, 422, "invalid_pgs_dispatch", "The dispatch limit is invalid");
    const summary = await dispatchPgsOutbox(
      dependencies,
      c.get("environment"),
      c.get("session"),
      requestedLimit === undefined ? 20 : requestedLimit,
    );
    return respond(c, { dispatch: summary });
  });
}
