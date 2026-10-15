import { createPublicKey, verify } from "node:crypto";

/** Google's published rewarded-ad SSV verifier keys. */
export const ADMOB_VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";

const KEY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const UNKNOWN_KEY_REFETCH_MIN_INTERVAL_MS = 60 * 1000;

/** Looks up an AdMob SSV verifier public key (PEM) by `key_id`. Injected so
 * tests never touch the network. */
export interface AdMobVerifierKeyProvider {
  getPublicKeyPem(keyId: string): Promise<string | null>;
}

/**
 * Fetches and caches AdMob's public verifier keys. The key list is cached
 * for 24 hours; an unknown `key_id` triggers at most one refetch per minute
 * (Google rotates keys, but an attacker must not be able to turn every bogus
 * `key_id` into an outbound request). A fetch failure never throws: it
 * resolves `null`, so a callback is rejected rather than accepted unverified.
 */
export class HttpAdMobVerifierKeyProvider implements AdMobVerifierKeyProvider {
  private keys = new Map<string, string>();
  private fetchedAt = 0;
  private lastRefetchAt = 0;

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async getPublicKeyPem(keyId: string): Promise<string | null> {
    const now = this.now();
    if (now - this.fetchedAt > KEY_CACHE_TTL_MS) await this.refresh(now);
    const cached = this.keys.get(keyId);
    if (cached) return cached;
    if (now - this.lastRefetchAt >= UNKNOWN_KEY_REFETCH_MIN_INTERVAL_MS) await this.refresh(now);
    return this.keys.get(keyId) ?? null;
  }

  private async refresh(now: number): Promise<void> {
    this.lastRefetchAt = now;
    try {
      const response = await this.fetchImpl(ADMOB_VERIFIER_KEYS_URL);
      if (!response.ok) return;
      const body = (await response.json()) as { keys?: { keyId?: unknown; pem?: unknown }[] };
      const next = new Map<string, string>();
      for (const key of body.keys ?? []) {
        if ((typeof key.keyId === "number" || typeof key.keyId === "string") && key.pem) {
          next.set(String(key.keyId), String(key.pem));
        }
      }
      if (next.size > 0) {
        this.keys = next;
        this.fetchedAt = now;
      }
    } catch {
      // Keep whatever is cached; an unverifiable callback is rejected.
    }
  }
}

export type AdMobSsvVerification =
  | { ok: true; params: URLSearchParams }
  | { ok: false; reason: "malformed" | "unknown_key" | "bad_signature" };

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Verifies an AdMob SSV callback per Google's documentation: the signature is
 * ECDSA (P-256, SHA-256, DER) over the raw query string up to, not including,
 * `&signature=`, and `signature` and `key_id` are always the last two
 * parameters. Returns the decoded signed parameters on success. Anything that
 * does not match that exact shape is rejected, never treated as unsigned-OK.
 */
export async function verifyAdMobSsvCallback(
  rawQuery: string,
  keys: AdMobVerifierKeyProvider,
): Promise<AdMobSsvVerification> {
  const match = /^(.+)&signature=([A-Za-z0-9_-]+)&key_id=([0-9]+)$/.exec(rawQuery);
  if (!match) return { ok: false, reason: "malformed" };
  const [, signedContent, signature, keyId] = match;
  const pem = await keys.getPublicKeyPem(keyId);
  if (!pem) return { ok: false, reason: "unknown_key" };
  let valid = false;
  try {
    valid = verify(
      "sha256",
      Buffer.from(signedContent, "utf8"),
      createPublicKey(pem),
      decodeBase64Url(signature),
    );
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "bad_signature" };
  return { ok: true, params: new URLSearchParams(signedContent) };
}
