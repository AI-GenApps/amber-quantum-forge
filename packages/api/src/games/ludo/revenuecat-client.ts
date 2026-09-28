/**
 * Task 26d: server-side RevenueCat REST client, used only by
 * `POST /:environment/revenuecat/sync` to force-refresh entitlement state
 * from a fresh `CustomerInfo` fetch. Behind an interface so routes never
 * call `fetch` directly and tests use `FakeRevenueCatClient` instead of a
 * real network call — no RevenueCat credentials exist in this environment.
 */

export interface RevenueCatEntitlementInfo {
  entitlementId: string;
  productId: string;
  /** `null` for a non-expiring entitlement; otherwise an ISO timestamp. */
  expiresAt: string | null;
}

export interface RevenueCatNonSubscriptionPurchase {
  /** RevenueCat's own id for this specific purchase — stable across
   * fetches, used as the sync path's idempotency key so a purchase already
   * granted by the webhook is never double-granted by `sync`. */
  purchaseId: string;
  productId: string;
  purchasedAt: string;
}

export interface RevenueCatCustomerInfo {
  appUserId: string;
  entitlements: RevenueCatEntitlementInfo[];
  nonSubscriptionPurchases: RevenueCatNonSubscriptionPurchase[];
}

export interface RevenueCatClient {
  /** Returns `null` when the client has no way to answer (no API key
   * configured, or RevenueCat has no record for this subject) — callers
   * must treat `null` as "nothing to reconcile", never as an error. */
  getCustomerInfo(appUserId: string): Promise<RevenueCatCustomerInfo | null>;
}

/** Degrade-gracefully default: no `REVENUECAT_API_KEY_LUDO` configured. */
export class NullRevenueCatClient implements RevenueCatClient {
  async getCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
    return null;
  }
}

interface RawRevenueCatSubscriberResponse {
  subscriber: {
    entitlements?: Record<string, { product_identifier: string; expires_date: string | null }>;
    non_subscriptions?: Record<
      string,
      { id: string; product_id?: string; purchase_date: string }[]
    >;
  };
}

/** Real client, calling RevenueCat's `GET /v1/subscribers/:app_user_id`
 * REST endpoint with the project's secret API key. */
export class HttpRevenueCatClient implements RevenueCatClient {
  constructor(
    private readonly secretApiKey: string,
    private readonly baseUrl = "https://api.revenuecat.com/v1",
  ) {}

  async getCustomerInfo(appUserId: string): Promise<RevenueCatCustomerInfo | null> {
    const response = await fetch(`${this.baseUrl}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { Authorization: `Bearer ${this.secretApiKey}` },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as RawRevenueCatSubscriberResponse;
    const entitlements = Object.entries(body.subscriber.entitlements ?? {}).map(
      ([entitlementId, entitlement]) => ({
        entitlementId,
        productId: entitlement.product_identifier,
        expiresAt: entitlement.expires_date,
      }),
    );
    const nonSubscriptionPurchases = Object.entries(
      body.subscriber.non_subscriptions ?? {},
    ).flatMap(([productId, purchases]) =>
      purchases.map((purchase) => ({
        purchaseId: purchase.id,
        productId: purchase.product_id ?? productId,
        purchasedAt: purchase.purchase_date,
      })),
    );
    return { appUserId, entitlements, nonSubscriptionPurchases };
  }
}

/** In-memory fake for `revenuecat-sync.test.ts`: returns a canned
 * `CustomerInfo` (or `null`) set per app-user-id by the test. */
export class FakeRevenueCatClient implements RevenueCatClient {
  private readonly responses = new Map<string, RevenueCatCustomerInfo | null>();

  setResponse(appUserId: string, info: RevenueCatCustomerInfo | null): void {
    this.responses.set(appUserId, info);
  }

  async getCustomerInfo(appUserId: string): Promise<RevenueCatCustomerInfo | null> {
    return this.responses.get(appUserId) ?? null;
  }
}
