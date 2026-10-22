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

function withoutStatus(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const { status: _status, ...rest } = value as Record<string, unknown>;
  return rest;
}

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
): void {
  const type = recordType as MergeRelayRecordType;
  if (type !== "challenge" && type !== "result") return;
  if (before === undefined || before === null) return;
  const frozenBefore = type === "challenge" ? withoutStatus(before) : before;
  const frozenAfter = type === "challenge" ? withoutStatus(after) : after;
  if (canonical(frozenBefore) !== canonical(frozenAfter))
    throw new MergeRelayStorageError(`Merge Relay ${type} ${recordId} is immutable`);
  if (type === "challenge" && statusOf(before) === "retired" && statusOf(after) !== "retired")
    throw new MergeRelayStorageError(`Merge Relay challenge ${recordId} cannot be reopened`);
}

export function assertStateImmutable(before: MergeRelayState, after: MergeRelayState): void {
  for (const challenge of before.challenges) {
    const next = after.challenges.find((value) => value.challengeId === challenge.challengeId);
    if (next) assertArtifactImmutable("challenge", challenge.challengeId, challenge, next);
  }
  for (const result of before.results) {
    const next = after.results.find((value) => value.resultId === result.resultId);
    if (next) assertArtifactImmutable("result", result.resultId, result, next);
  }
}
