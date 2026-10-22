import type { MergeRelayRecordType } from "./artifact-store";
import type { MergeRelayState } from "./contracts";
import { MergeRelayStorageError } from "./store";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function withoutFields(value: unknown, fields: readonly string[]): unknown {
  if (typeof value !== "object" || value === null) return value;
  const rest: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const field of fields) delete rest[field];
  return rest;
}

const identityFields = ["ownerSubject", "recipientSubject"] as const;

function statusOf(value: unknown): unknown {
  return typeof value === "object" && value !== null
    ? (value as { status?: unknown }).status
    : undefined;
}

export function assertArtifactImmutable(
  recordType: string,
  recordId: string,
  before: unknown,
  after: unknown,
  options: { rebindIdentity?: boolean } = {},
): void {
  const type = recordType as MergeRelayRecordType;
  if (type !== "challenge" && type !== "result") return;
  if (before === undefined || before === null) return;
  const ignored: string[] = [];
  if (type === "challenge") ignored.push("status");
  if (options.rebindIdentity) ignored.push(...identityFields);
  const frozenBefore = withoutFields(before, ignored);
  const frozenAfter = withoutFields(after, ignored);
  if (canonical(frozenBefore) !== canonical(frozenAfter))
    throw new MergeRelayStorageError(`Merge Relay ${type} ${recordId} is immutable`);
  if (type === "challenge" && statusOf(before) === "retired" && statusOf(after) !== "retired")
    throw new MergeRelayStorageError(`Merge Relay challenge ${recordId} cannot be reopened`);
}

export function assertStateImmutable(
  before: MergeRelayState,
  after: MergeRelayState,
  rebound: ReadonlySet<string> = new Set(),
): void {
  for (const challenge of before.challenges) {
    const next = after.challenges.find((value) => value.challengeId === challenge.challengeId);
    if (next)
      assertArtifactImmutable("challenge", challenge.challengeId, challenge, next, {
        rebindIdentity: rebound.has(`challenge:${challenge.challengeId}`),
      });
  }
  for (const result of before.results) {
    const next = after.results.find((value) => value.resultId === result.resultId);
    if (next)
      assertArtifactImmutable("result", result.resultId, result, next, {
        rebindIdentity: rebound.has(`result:${result.resultId}`),
      });
  }
}
