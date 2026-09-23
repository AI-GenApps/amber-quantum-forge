import type {
  MERGE_RELAY_THEME_PRODUCT_ID,
  MergeCommercePurchaseState,
  MergePlayPurchaseAttestation,
  MergePlayPurchaseProvider,
} from "./commerce-contracts";
import type { GooglePlayAccessTokenSource } from "./commerce-google-auth";
import { readProviderResponse } from "./pgs-provider-body";

const publisherRoot = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const providerTimeoutMs = 10_000;

export class GooglePlayPurchaseProviderError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

export class GooglePlayPurchaseProvider implements MergePlayPurchaseProvider {
  constructor(
    private readonly packageName: string,
    private readonly accessTokenSource: GooglePlayAccessTokenSource,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = providerTimeoutMs,
  ) {}

  async verifyPurchase(input: {
    productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
    purchaseToken: string;
  }): Promise<MergePlayPurchaseAttestation> {
    const token = await this.accessTokenSource.getAccessToken();
    const response = await this.request(
      `${publisherRoot}/applications/${encodeURIComponent(this.packageName)}/purchases/productsv2/tokens/${encodeURIComponent(input.purchaseToken)}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    if (!response.ok) throw providerHttpError(response.status);
    return parseProductPurchase(response.body, input.productId);
  }

  async acknowledgePurchase(input: {
    productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
    purchaseToken: string;
  }): Promise<void> {
    const token = await this.accessTokenSource.getAccessToken();
    const response = await this.request(
      `${publisherRoot}/applications/${encodeURIComponent(this.packageName)}/purchases/products/${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}:acknowledge`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: "{}",
      },
    );
    if (!response.ok) throw providerHttpError(response.status);
    if (response.body.length > 0)
      throw new GooglePlayPurchaseProviderError("acknowledge_response_invalid", false);
  }

  private async request(
    url: string,
    init: RequestInit,
  ): Promise<{ ok: boolean; status: number; body: string }> {
    const controller = new AbortController();
    const deadline = Date.now() + this.timeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new GooglePlayPurchaseProviderError("provider_timeout", true));
        }, this.timeoutMs);
      });
      const response = await Promise.race([
        this.fetchImpl(url, { ...init, signal: controller.signal }),
        timeout,
      ]);
      const body = await readProviderResponse(
        response,
        controller,
        deadline,
        (code, retryable) => new GooglePlayPurchaseProviderError(code, retryable),
      );
      return { ok: response.ok, status: response.status, body };
    } catch (error) {
      if (error instanceof GooglePlayPurchaseProviderError) throw error;
      if (controller.signal.aborted)
        throw new GooglePlayPurchaseProviderError("provider_timeout", true);
      throw new GooglePlayPurchaseProviderError("provider_network", true);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

function parseProductPurchase(
  value: string,
  expectedProductId: typeof MERGE_RELAY_THEME_PRODUCT_ID,
): MergePlayPurchaseAttestation {
  const record = parseRecord(value);
  if (record.kind !== "androidpublisher#productPurchaseV2")
    throw new GooglePlayPurchaseProviderError("provider_response_invalid", false);
  const lines = record.productLineItem;
  if (!Array.isArray(lines) || lines.length !== 1)
    throw new GooglePlayPurchaseProviderError("provider_response_invalid", false);
  const line = parseRecordValue(lines[0]);
  if (line === null || line.productId !== expectedProductId)
    throw new GooglePlayPurchaseProviderError("provider_product_mismatch", false);
  const context = parseRecordValue(record.purchaseStateContext);
  const rawState = context?.purchaseState;
  const state = purchaseState(rawState);
  const acknowledgementState = acknowledgement(record.acknowledgementState);
  if (!state || !acknowledgementState)
    throw new GooglePlayPurchaseProviderError("provider_response_invalid", false);
  return {
    state,
    productId: expectedProductId,
    orderId: optionalText(record.orderId, 256),
    acknowledged: acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    obfuscatedExternalAccountId: optionalText(record.obfuscatedExternalAccountId, 256),
  };
}

function parseRecord(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    const record = parseRecordValue(parsed);
    if (record === null) throw new Error();
    return record;
  } catch (error) {
    if (error instanceof GooglePlayPurchaseProviderError) throw error;
    throw new GooglePlayPurchaseProviderError("provider_response_invalid", false);
  }
}

function parseRecordValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function purchaseState(value: unknown): MergeCommercePurchaseState | null {
  if (value === "PENDING") return "pending";
  if (value === "PURCHASED") return "purchased";
  if (value === "CANCELLED") return "cancelled";
  return null;
}

function acknowledgement(value: unknown): string | null {
  return value === "ACKNOWLEDGEMENT_STATE_PENDING" || value === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED"
    ? value
    : null;
}

function optionalText(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > max)
    throw new GooglePlayPurchaseProviderError("provider_response_invalid", false);
  return value;
}

function providerHttpError(status: number): GooglePlayPurchaseProviderError {
  return new GooglePlayPurchaseProviderError(
    status === 401 || status === 403
      ? "provider_authorization_rejected"
      : status === 404
        ? "purchase_not_found"
        : `provider_http_${status}`,
    status === 429 || status >= 500,
  );
}
