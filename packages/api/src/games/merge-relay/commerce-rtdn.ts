import { reconcileVoided, requeryPurchase } from "./commerce-reconcile";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredCommerceRuntime } from "./dependencies";
import { MergeRelayError } from "./errors";

export type RtdnOutcome = "applied" | "replayed" | "ignored" | "unconfirmed";

const maxEnvelopeBytes = 16_384;

interface RtdnNotification {
  packageName: string;
  kind: "one_time" | "voided" | "other";
  purchaseToken: string | null;
  sku: string | null;
}

export async function handleRtdn(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  authorizationHeader: string | null,
  body: unknown,
): Promise<RtdnOutcome> {
  const runtime = configuredCommerceRuntime(dependencies, environment);
  if (!runtime?.rtdnAuthenticator)
    throw new MergeRelayError(503, "rtdn_unconfigured", "RTDN is unavailable");
  if (!(await runtime.rtdnAuthenticator.authenticate(authorizationHeader)))
    throw new MergeRelayError(401, "rtdn_unauthorized", "The RTDN caller is not authorized");
  const notification = parseNotification(body);
  if (!notification) throw new MergeRelayError(422, "rtdn_invalid", "The RTDN payload is invalid");
  if (notification.packageName !== runtime.config.packageName || notification.kind === "other")
    return "ignored";
  if (!notification.purchaseToken) return "ignored";
  if (notification.kind === "voided") {
    const result = await reconcileVoided(dependencies, environment, [notification.purchaseToken]);
    if (result.voided === 0) return "unconfirmed";
    return result.applied > 0 ? "applied" : "replayed";
  }
  if (notification.sku !== runtime.config.productId) return "ignored";
  const settlement = await requeryPurchase(dependencies, environment, notification.purchaseToken);
  if (!settlement) return "ignored";
  return settlement.replayed ? "replayed" : "applied";
}

function parseNotification(body: unknown): RtdnNotification | null {
  if (!isRecord(body) || !isRecord(body.message)) return null;
  const data = body.message.data;
  if (typeof data !== "string" || data.length === 0 || data.length > maxEnvelopeBytes) return null;
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return null;
  }
  if (!isRecord(decoded) || typeof decoded.packageName !== "string") return null;
  const packageName = decoded.packageName;
  const oneTime = decoded.oneTimeProductNotification;
  if (isRecord(oneTime)) {
    const token = text(oneTime.purchaseToken);
    const sku = text(oneTime.sku);
    if (!token || !sku) return null;
    const type = oneTime.notificationType;
    if (type !== 1 && type !== 2) return { packageName, kind: "other", purchaseToken: null, sku };
    return { packageName, kind: "one_time", purchaseToken: token, sku };
  }
  const voided = decoded.voidedPurchaseNotification;
  if (isRecord(voided)) {
    const token = text(voided.purchaseToken);
    if (!token) return null;
    return voided.productType === 1
      ? { packageName, kind: "voided", purchaseToken: token, sku: null }
      : { packageName, kind: "other", purchaseToken: null, sku: null };
  }
  return { packageName, kind: "other", purchaseToken: null, sku: null };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 4096 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
