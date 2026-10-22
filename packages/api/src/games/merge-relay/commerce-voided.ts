import type { MergeVoidedPurchase } from "./commerce-contracts";

export interface VoidedPage {
  items: MergeVoidedPurchase[];
  nextPageToken: string | null;
}

export function parseVoidedPage(body: string): VoidedPage | null {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const list = value.voidedPurchases ?? [];
  if (!Array.isArray(list) || list.length > 1000) return null;
  const items: MergeVoidedPurchase[] = [];
  for (const entry of list) {
    if (!isRecord(entry) || entry.kind !== "androidpublisher#voidedPurchase") return null;
    const token = entry.purchaseToken;
    const millis = Number(entry.voidedTimeMillis);
    if (typeof token !== "string" || token.length === 0 || token.length > 4096) return null;
    if (!Number.isSafeInteger(millis) || millis < 0) return null;
    const orderId = typeof entry.orderId === "string" ? entry.orderId.slice(0, 256) : null;
    items.push({ purchaseToken: token, orderId, voidedTimeMillis: millis });
  }
  const pagination = isRecord(value.tokenPagination) ? value.tokenPagination : null;
  const next = pagination?.nextPageToken;
  return { items, nextPageToken: typeof next === "string" && next.length > 0 ? next : null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
