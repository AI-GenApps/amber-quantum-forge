import type { LudoSubscriptionRow } from "./economy-store";

/** A Vortex Pass entitles the subject while its subscription is paid up:
 * `active`, or a `cancelled`/`billing_issue` pass whose current period has not
 * ended yet. `expired` and `revoked` never entitle. `expiresAt: null` on an
 * entitling status means no known end, so it still entitles. */
export function isVortexPassActive(
  subscription: Pick<LudoSubscriptionRow, "status" | "expiresAt"> | null,
  nowMs: number,
): boolean {
  if (!subscription) return false;
  if (subscription.status === "expired" || subscription.status === "revoked") return false;
  if (subscription.expiresAt === null) return true;
  return new Date(subscription.expiresAt).getTime() > nowMs;
}
