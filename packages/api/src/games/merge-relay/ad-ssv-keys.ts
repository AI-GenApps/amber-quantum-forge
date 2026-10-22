import type { AdSsvKeySource, AdSsvRuntime } from "./ad-ssv-contracts";
import type { MergeEnvironment } from "./contracts";

const verifierKeysUrl = "https://www.gstatic.com/admob/reward/verifier-keys.json";
const cacheMs = 24 * 60 * 60 * 1000;
const minRefreshMs = 60 * 1000;

export function createAdMobKeySource(fetchImpl: typeof fetch = fetch): AdSsvKeySource {
  let keys = new Map<string, string>();
  let fetchedAt = 0;
  async function refresh(): Promise<void> {
    fetchedAt = Date.now();
    const response = await fetchImpl(verifierKeysUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    const body: unknown = await response.json();
    const list =
      typeof body === "object" && body !== null ? (body as { keys?: unknown }).keys : null;
    if (!Array.isArray(list)) return;
    const next = new Map<string, string>();
    for (const entry of list) {
      const record = entry as { keyId?: unknown; pem?: unknown };
      if (typeof record.pem === "string" && record.keyId !== undefined)
        next.set(String(record.keyId), record.pem);
    }
    keys = next;
  }
  return {
    async getKey(keyId) {
      const age = Date.now() - fetchedAt;
      try {
        if (age > cacheMs || (!keys.has(keyId) && age > minRefreshMs)) await refresh();
      } catch {
        return keys.get(keyId) ?? null;
      }
      return keys.get(keyId) ?? null;
    },
  };
}

export function adSsvRuntimeFromEnvironment(environment: MergeEnvironment): AdSsvRuntime | null {
  const units = process.env[`MERGE_RELAY_ADMOB_${environment.toUpperCase()}_AD_UNIT_IDS`];
  const allowedAdUnits = (units ?? "")
    .split(",")
    .map((unit) => unit.trim())
    .filter((unit) => unit.length > 0);
  if (allowedAdUnits.length === 0) return null;
  return { keySource: sharedKeySource, allowedAdUnits, maxAgeMs: cacheMs };
}

const sharedKeySource = createAdMobKeySource();
