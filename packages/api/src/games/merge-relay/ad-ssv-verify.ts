import { createPublicKey, createVerify } from "node:crypto";
import type { AdSsvRecord, AdSsvRuntime } from "./ad-ssv-contracts";

const maxQueryLength = 4096;
const signatureMarker = "&signature=";

export async function verifyAdSsvQuery(
  rawQuery: string,
  runtime: AdSsvRuntime,
  nowMs: number,
): Promise<Omit<AdSsvRecord, "environment" | "receivedAt"> | null> {
  if (rawQuery.length === 0 || rawQuery.length > maxQueryLength) return null;
  const split = rawQuery.lastIndexOf(signatureMarker);
  if (split < 0) return null;
  const message = rawQuery.slice(0, split);
  const tail = new URLSearchParams(rawQuery.slice(split + 1));
  const signature = tail.get("signature");
  const keyId = tail.get("key_id");
  if (!signature || !keyId || [...tail.keys()].length !== 2) return null;
  const pem = await runtime.keySource.getKey(keyId);
  if (!pem || !signatureValid(message, signature, pem)) return null;
  const params = new URLSearchParams(message);
  const transactionId = params.get("transaction_id");
  const subject = params.get("user_id");
  const resultId = params.get("custom_data");
  const adUnit = params.get("ad_unit");
  const rewardItem = params.get("reward_item") ?? "";
  const rewardAmount = Number(params.get("reward_amount"));
  const timestampMs = Number(params.get("timestamp"));
  if (!transactionId || !subject || !resultId || !adUnit) return null;
  if (!runtime.allowedAdUnits.includes(adUnit)) return null;
  if (!Number.isSafeInteger(rewardAmount) || rewardAmount < 0) return null;
  if (!Number.isSafeInteger(timestampMs)) return null;
  if (Math.abs(nowMs - timestampMs) > runtime.maxAgeMs) return null;
  return { transactionId, subject, resultId, adUnit, rewardAmount, rewardItem, timestampMs };
}

function signatureValid(message: string, signature: string, pem: string): boolean {
  try {
    const verifier = createVerify("SHA256");
    verifier.update(message, "utf8");
    return verifier.verify(createPublicKey(pem), Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}
