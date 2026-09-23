import {
  getCommerceCatalog,
  listCommerceEntitlements,
  settleCommercePurchase,
} from "./commerce-service";
import { parseCommercePurchase } from "./commerce-validation";
import {
  commerceCatalogToWire,
  commerceEntitlementToWire,
  commercePurchaseToWire,
} from "./commerce-wire";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";

export function registerCommerceRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.get("/:environment/commerce/catalog", async (c) =>
    respond(c, {
      catalog: commerceCatalogToWire(await getCommerceCatalog(dependencies, c.get("environment"))),
    }),
  );

  routes.get("/:environment/commerce/entitlements", async (c) =>
    respond(c, {
      entitlements: (
        await listCommerceEntitlements(dependencies, c.get("environment"), c.get("session"))
      ).map(commerceEntitlementToWire),
    }),
  );

  routes.post("/:environment/commerce/google-play/purchases", async (c) => {
    const input = parseCommercePurchase(await readBody(c));
    if (!input) return fail(c, 422, "invalid_purchase", "The purchase payload is invalid");
    const settlement = await settleCommercePurchase(
      dependencies,
      c.get("environment"),
      c.get("session"),
      input,
      false,
    );
    return respond(c, settlementToWire(settlement));
  });

  routes.post("/:environment/commerce/google-play/restore", async (c) => {
    const input = parseCommercePurchase(await readBody(c));
    if (!input) return fail(c, 422, "invalid_purchase", "The restore payload is invalid");
    const settlement = await settleCommercePurchase(
      dependencies,
      c.get("environment"),
      c.get("session"),
      input,
      true,
    );
    return respond(c, settlementToWire(settlement));
  });
}

function settlementToWire(value: Awaited<ReturnType<typeof settleCommercePurchase>>) {
  return {
    purchase: commercePurchaseToWire(value.purchase),
    entitlement: value.entitlement ? commerceEntitlementToWire(value.entitlement) : null,
    replayed: value.replayed,
    restored: value.restored,
  };
}
