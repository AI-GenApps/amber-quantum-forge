import { recordAdSsv } from "./ad-ssv-service";
import { reconcileVoidedPurchases } from "./commerce-reconcile";
import { handleRtdn } from "./commerce-rtdn";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { respond } from "./route-context";

export function registerCallbackRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.post("/:environment/commerce/google-play/rtdn", async (c) => {
    let body: unknown = null;
    try {
      body = await c.req.json<unknown>();
    } catch {
      body = null;
    }
    const outcome = await handleRtdn(
      dependencies,
      c.get("environment"),
      c.req.header("Authorization") ?? null,
      body,
    );
    if (outcome === "unconfirmed") return c.json({ outcome }, 503);
    return c.json({ outcome }, 200);
  });

  routes.post("/:environment/commerce/google-play/voided/reconcile", async (c) =>
    respond(
      c,
      await reconcileVoidedPurchases(dependencies, c.get("environment"), c.get("session")),
    ),
  );

  routes.get("/:environment/rewards/admob/ssv", async (c) => {
    const query = new URL(c.req.url).search.slice(1);
    const result = await recordAdSsv(dependencies, c.get("environment"), query);
    return c.json({ replayed: result.replayed }, 200);
  });
}
