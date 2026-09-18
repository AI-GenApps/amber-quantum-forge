import type {
  MergeAlias,
  MergeAttempt,
  MergeChallenge,
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEnvironment,
  MergeEvent,
  MergeGuest,
  MergeRelayState,
  MergeResult,
  MergeReward,
  MergeSave,
  MergeSocialRecord,
} from "./contracts";
import { artifactRow as row } from "./drizzle-artifacts";
import { emptyMergeRelayState, MergeRelayStorageError } from "./store";

const recordTypes = [
  "challenge",
  "attempt",
  "result",
  "save",
  "guest",
  "daily",
  "config",
  "event",
  "social",
  "reward",
  "alias",
] as const;
type RecordType = (typeof recordTypes)[number];

export function fromRows(rows: Array<{ recordType: string; payload: unknown }>): MergeRelayState {
  if (rows.some((candidate) => !recordTypes.includes(candidate.recordType as RecordType)))
    throw new MergeRelayStorageError("Merge Relay contains an unknown record type");
  const state = emptyMergeRelayState();
  state.challenges = rows
    .filter((row) => row.recordType === "challenge")
    .map((row) => row.payload as MergeChallenge);
  state.attempts = rows
    .filter((row) => row.recordType === "attempt")
    .map((row) => row.payload as MergeAttempt);
  state.results = rows
    .filter((row) => row.recordType === "result")
    .map((row) => row.payload as MergeResult);
  state.saves = rows
    .filter((row) => row.recordType === "save")
    .map((row) => row.payload as MergeSave);
  state.guests = rows
    .filter((row) => row.recordType === "guest")
    .map((row) => row.payload as MergeGuest);
  state.daily = rows
    .filter((row) => row.recordType === "daily")
    .map((row) => row.payload as MergeDailyChallenge);
  state.configs = rows
    .filter((row) => row.recordType === "config")
    .map((row) => row.payload as MergeConfigRevision);
  state.events = rows
    .filter((row) => row.recordType === "event")
    .map((row) => row.payload as MergeEvent);
  state.social = rows
    .filter((row) => row.recordType === "social")
    .map((row) => row.payload as MergeSocialRecord);
  state.rewards = rows
    .filter((row) => row.recordType === "reward")
    .map((row) => row.payload as MergeReward);
  state.aliases = rows
    .filter((row) => row.recordType === "alias")
    .map((row) => row.payload as MergeAlias);
  return state;
}

export function rowsForState(environment: MergeEnvironment, state: MergeRelayState) {
  return [
    ...state.challenges.map((payload) =>
      row(environment, "challenge", payload.challengeId, payload, {
        ownerSubject: payload.ownerSubject,
        idempotencyKey: payload.idempotencyKey,
      }),
    ),
    ...state.attempts.map((payload) =>
      row(environment, "attempt", payload.attemptId, payload, {
        ownerSubject: payload.recipientSubject,
        challengeId: payload.challengeId,
      }),
    ),
    ...state.results.map((payload) =>
      row(environment, "result", payload.resultId, payload, {
        ownerSubject: payload.recipientSubject,
        challengeId: payload.challengeId,
        idempotencyKey: payload.idempotencyKey,
      }),
    ),
    ...state.saves.map((payload) =>
      row(environment, "save", JSON.stringify([payload.subject, payload.saveId]), payload, {
        ownerSubject: payload.subject,
      }),
    ),
    ...state.guests.map((payload) =>
      row(environment, "guest", payload.guestId, payload, {
        ownerSubject: payload.subject,
        lookupKey: payload.recoveryTokenHash,
      }),
    ),
    ...state.daily.map((payload) => row(environment, "daily", payload.date, payload)),
    ...state.configs.map((payload) =>
      row(environment, "config", String(payload.revision), payload),
    ),
    ...state.events.map((payload) =>
      row(environment, "event", payload.eventId, payload, {
        ownerSubject: payload.subject,
        idempotencyKey: payload.idempotencyKey,
      }),
    ),
    ...state.social.map((payload) =>
      row(environment, "social", payload.recordId, payload, {
        ownerSubject: payload.subject,
        targetSubject: payload.targetSubject,
      }),
    ),
    ...state.rewards.map((payload) =>
      row(environment, "reward", payload.rewardId, payload, {
        ownerSubject: payload.subject,
        resultId: payload.resultId,
        idempotencyKey: payload.providerTransactionId,
      }),
    ),
    ...state.aliases.map((payload) =>
      row(environment, "alias", payload.aliasId, payload, {
        ownerSubject: payload.subject,
        alias: payload.alias,
      }),
    ),
  ];
}

export function rowKey(recordType: string, recordId: string): string {
  return `${recordType}\u0000${recordId}`;
}
