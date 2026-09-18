import { isGameEnvironment } from "../validation";
import type {
  MergeAlias,
  MergeAttempt,
  MergeChallenge,
  MergeEnvironment,
  MergeEvent,
} from "./contracts";

export function validateAlias(value: MergeAlias): void {
  if (
    !isId(value.aliasId) ||
    !isAlias(value.alias) ||
    !isId(value.subject) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay alias is invalid");
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function isId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
}

export function isAlias(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 40;
}

export function isReason(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256;
}

export function isHex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isEnvironment(value: unknown): value is MergeEnvironment {
  return typeof value === "string" && isGameEnvironment(value);
}

export function isMode(value: unknown): value is MergeChallenge["mode"] {
  return value === "rescue" || value === "daily" || value === "endless";
}

export function isStatus(value: unknown): value is MergeChallenge["status"] {
  return value === "open" || value === "retired";
}

export function isAttemptStatus(value: unknown): value is MergeAttempt["status"] {
  return (
    value === "reserved" || value === "completed" || value === "abandoned" || value === "cancelled"
  );
}

export function isEventType(value: unknown): value is MergeEvent["type"] {
  return [
    "challenge_created",
    "challenge_opened",
    "challenge_retired",
    "checkpoint_saved",
    "relay_attempt_reserved",
    "relay_attempt_abandoned",
    "relay_attempt_cancelled",
    "attempt_reserved",
    "attempt_abandoned",
    "attempt_completed",
    "relay_return_created",
    "replay_viewed",
    "validation_rejected",
    "daily_run_complete",
    "practice_rewind_used",
  ].includes(value as string);
}
