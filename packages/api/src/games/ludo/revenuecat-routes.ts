import type { Context, Hono } from "hono";
import { isGameEnvironment } from "../validation";
import type { LudoEnvironment, LudoSession } from "./contracts";
import { getEconomyConfig } from "./economy-config";
import type {
  LudoEconomyStore,
  LudoLedgerAppendInput,
  LudoSubscriptionStatus,
} from "./economy-store";
import {
  asLudoError,
  LudoRevenueCatInvalidPayloadError,
  LudoRevenueCatUnauthorizedError,
  LudoRevenueCatUnknownProductError,
} from "./errors";
import { lookupLudoIapGrant } from "./iap-catalog";
import type { RevenueCatClient } from "./revenuecat-client";
import { NullRevenueCatClient } from "./revenuecat-client";
import type { LudoRouteDependencies } from "./routes-types";

type AuthResult = { ok: true; session: LudoSession } | { ok: false; response: Response };

type AuthenticateGameToken = (
  c: Context,
  dependencies: LudoRouteDependencies,
  environment: LudoEnvironment,
) => Promise<AuthResult>;

interface RevenueCatWebhookEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id: string;
  /** Milliseconds since epoch; present on every subscription-related event
   * RevenueCat sends (including CANCELLATION/EXPIRATION, which still
   * report the access-end timestamp). */
  expiration_at_ms?: number | null;
}

/** Event types that credit/debit a consumable/non-consumable product's
 * currency. Everything else (subscription lifecycle events) is handled by
 * the Vortex Pass branch below. */
const CURRENCY_GRANT_EVENT_TYPES = new Set(["INITIAL_PURCHASE", "NON_SUBSCRIPTION_PURCHASE"]);

/** Maps a Vortex Pass subscription lifecycle event to its resulting
 * status/willRenew pair. `undefined` for event types this handler does not
 * recognize (still consumed for idempotency, but no state change). */
function subscriptionStateForEvent(
  eventType: string,
): { status: LudoSubscriptionStatus; willRenew: boolean } | undefined {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      return { status: "active", willRenew: true };
    case "CANCELLATION":
      return { status: "cancelled", willRenew: false };
    case "EXPIRATION":
      return { status: "expired", willRenew: false };
    case "BILLING_ISSUE":
      return { status: "billing_issue", willRenew: true };
    case "REFUND":
      return { status: "revoked", willRenew: false };
    default:
      return undefined;
  }
}

function parseWebhookEvent(body: unknown): RevenueCatWebhookEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const event = (body as { event?: unknown }).event;
  if (typeof event !== "object" || event === null) return null;
  const e = event as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.type !== "string" ||
    typeof e.app_user_id !== "string" ||
    typeof e.product_id !== "string"
  ) {
    return null;
  }
  const expiresAtMs =
    typeof e.expiration_at_ms === "number"
      ? e.expiration_at_ms
      : e.expiration_at_ms === null
        ? null
        : undefined;
  return {
    id: e.id,
    type: e.type,
    app_user_id: e.app_user_id,
    product_id: e.product_id,
    expiration_at_ms: expiresAtMs,
  };
}

async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

/**
 * Task 26d: RevenueCat webhook + client sync routes. Split out of
 * `routes.ts`/`wallet-routes.ts` for the same file-size reason those two
 * are already split.
 */
export function registerLudoRevenueCatRoutes(
  routes: Hono,
  dependencies: LudoRouteDependencies,
  economyStore: LudoEconomyStore,
  authenticateGameToken: AuthenticateGameToken,
): void {
  const revenueCatClient: RevenueCatClient =
    dependencies.revenueCatClient ?? new NullRevenueCatClient();

  routes.post("/:environment/revenuecat/webhook", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoRevenueCatInvalidPayloadError(
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }

    const secret = dependencies.revenueCatWebhookSecret;
    const header = c.req.header("Authorization");
    if (!secret || header !== secret) {
      const error = new LudoRevenueCatUnauthorizedError();
      return c.json(error.response(), error.status);
    }

    const body = await readJsonBody(c);
    const event = parseWebhookEvent(body);
    if (!event) {
      const error = new LudoRevenueCatInvalidPayloadError();
      return c.json(error.response(), error.status);
    }

    const grant = lookupLudoIapGrant(event.product_id, getEconomyConfig());
    if (!grant) {
      console.warn(`ludo revenuecat webhook: unknown product id ${event.product_id}`);
      const error = new LudoRevenueCatUnknownProductError(event.product_id);
      return c.json(error.response(), error.status);
    }

    const now = new Date().toISOString();
    const ledgerEntries: Omit<LudoLedgerAppendInput, "subject" | "now">[] = [];
    let subscription:
      | {
          productId: string;
          status: LudoSubscriptionStatus;
          willRenew: boolean;
          expiresAt: string | null;
        }
      | undefined;

    if (grant.kind === "currency") {
      const sign = event.type === "REFUND" ? -1 : 1;
      if (CURRENCY_GRANT_EVENT_TYPES.has(event.type) || event.type === "REFUND") {
        for (const credit of grant.credits) {
          ledgerEntries.push({
            currency: credit.currency,
            delta: sign * credit.amount,
            reason: event.type === "REFUND" ? "refund" : "iap_purchase",
            sourceRef: event.product_id,
            idempotencyKey: `${event.id}:${credit.currency}`,
          });
        }
      }
    } else {
      const state = subscriptionStateForEvent(event.type);
      if (state) {
        subscription = {
          productId: event.product_id,
          status: state.status,
          willRenew: state.willRenew,
          expiresAt:
            event.type === "REFUND"
              ? now
              : event.expiration_at_ms
                ? new Date(event.expiration_at_ms).toISOString()
                : null,
        };
      }
    }

    try {
      const result = await economyStore.processRevenueCatEvent(environment, {
        eventId: event.id,
        eventType: event.type,
        productId: event.product_id,
        subject: event.app_user_id,
        now,
        ledgerEntries,
        subscription,
      });
      return c.json({ ok: true, applied: result.applied }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/revenuecat/sync", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoRevenueCatInvalidPayloadError(
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const customerInfo = await revenueCatClient.getCustomerInfo(auth.session.subject);
    if (!customerInfo) {
      return c.json({ synced: false, reason: "revenuecat_unavailable" }, 200);
    }

    const config = getEconomyConfig();
    const now = new Date().toISOString();
    let grantedPurchases = 0;

    for (const purchase of customerInfo.nonSubscriptionPurchases) {
      const grant = lookupLudoIapGrant(purchase.productId, config);
      if (grant?.kind !== "currency") continue;
      const ledgerEntries = grant.credits.map((credit) => ({
        currency: credit.currency,
        delta: credit.amount,
        reason: "iap_purchase" as const,
        sourceRef: purchase.productId,
        idempotencyKey: `${purchase.purchaseId}:${credit.currency}`,
      }));
      const result = await economyStore.processRevenueCatEvent(environment, {
        eventId: `sync:${purchase.purchaseId}`,
        eventType: "SYNC_NON_SUBSCRIPTION_PURCHASE",
        productId: purchase.productId,
        subject: auth.session.subject,
        now,
        ledgerEntries,
      });
      // Count an actual grant, not merely a new sync event id: the ledger's
      // own idempotency key (shared with the webhook path) may already
      // have applied this purchase, in which case nothing new happened.
      if (result.ledgerResults.some((ledgerResult) => ledgerResult.applied)) grantedPurchases += 1;
    }

    const passEntitlement = customerInfo.entitlements.find(
      (entitlement) => entitlement.productId === config.vortexPass.productId,
    );
    let subscription = await economyStore.getSubscription(environment, auth.session.subject);
    if (passEntitlement) {
      const result = await economyStore.processRevenueCatEvent(environment, {
        eventId: `sync:${auth.session.subject}:${passEntitlement.expiresAt ?? "none"}`,
        eventType: "SYNC_SUBSCRIPTION_ACTIVE",
        productId: passEntitlement.productId,
        subject: auth.session.subject,
        now,
        ledgerEntries: [],
        subscription: {
          productId: passEntitlement.productId,
          status: "active",
          willRenew: true,
          expiresAt: passEntitlement.expiresAt,
        },
      });
      if (result.subscription) subscription = result.subscription;
    }

    return c.json({ synced: true, grantedPurchases, subscription }, 200);
  });
}
