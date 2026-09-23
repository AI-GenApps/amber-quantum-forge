import { createHash } from "node:crypto";
import type { CreateChallengeRequest, MergeMode } from "./contracts";

export function requestFingerprint(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function isCanonicalJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "string") return true;
  if (typeof value === "number")
    return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value));
  if (Array.isArray(value)) return value.every(isCanonicalJsonValue);
  if (typeof value !== "object" || value === undefined) return false;
  return Object.values(value).every(isCanonicalJsonValue);
}

export function challengeFingerprint(input: CreateChallengeRequest, originMode: MergeMode): string {
  return requestFingerprint({
    creatorAlias: input.creatorAlias,
    mode: "rescue",
    originMode,
    maxLegalMoves: input.maxLegalMoves ?? 3,
    contentId: input.contentId ?? input.checkpoint.contentId ?? null,
    contentVersion: input.contentVersion ?? input.checkpoint.contentVersion ?? null,
    parentChallengeId: input.parentChallengeId ?? null,
    checkpoint: input.checkpoint,
  });
}

function stableJson(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value !== "object") throw new Error("Unsupported canonical JSON value");
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(",")}}`;
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Canonical JSON numbers must be finite");
  if (Object.is(value, -0)) return "0";
  if (Number.isInteger(value) && !Number.isSafeInteger(value))
    throw new Error("Canonical JSON integers must be JavaScript-safe");
  return JSON.stringify(value);
}
