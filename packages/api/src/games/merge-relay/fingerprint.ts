import { createHash } from "node:crypto";
import type { CreateChallengeRequest, MergeMode } from "./contracts";

export function requestFingerprint(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
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
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(",")}}`;
}
