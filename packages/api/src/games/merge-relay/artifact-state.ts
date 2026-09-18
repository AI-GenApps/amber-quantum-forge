import { clone, matches } from "./artifact-state-helpers";
import {
  artifactRecordId,
  type MergeRelayArtifactFilter,
  type MergeRelayArtifactPage,
  type MergeRelayRecordType,
  mergeRelayRecordTypes,
  validateArtifactPageLimit,
} from "./artifact-store";
import type {
  MergeAlias,
  MergeAttempt,
  MergeChallenge,
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEvent,
  MergeGuest,
  MergeRelayState,
  MergeResult,
  MergeReward,
  MergeSave,
  MergeSocialRecord,
} from "./contracts";

export interface MemoryArtifact {
  recordType: MergeRelayRecordType;
  recordId: string;
  payload: unknown;
  ownerSubject: string | null;
  challengeId: string | null;
  resultId: string | null;
  idempotencyKey: string | null;
  alias: string | null;
  targetSubject: string | null;
  lookupKey: string | null;
  parentRecordType?: MergeRelayRecordType | null;
  parentRecordId?: string | null;
}

export function pageStateArtifacts<T>(
  state: MergeRelayState,
  filter: MergeRelayArtifactFilter,
  parse: (payload: unknown) => T,
): MergeRelayArtifactPage<T> {
  validateArtifactPageLimit(filter.limit);
  const rows = stateArtifacts(state)
    .filter((row) => matches(row, filter))
    .sort((left, right) => compareRecordIds(filter.recordType, left.recordId, right.recordId));
  if (filter.direction === "desc") rows.reverse();
  const selected = rows
    .filter(
      (row) =>
        filter.afterRecordId === undefined ||
        compareAfterRecordId(
          filter.recordType,
          row.recordId,
          filter.afterRecordId,
          filter.direction,
        ),
    )
    .slice(0, filter.limit + 1);
  const items = selected.slice(0, filter.limit).map((row) => parse(clone(row.payload)));
  return {
    items,
    nextCursor:
      selected.length > filter.limit ? (selected[filter.limit - 1]?.recordId ?? null) : null,
  };
}

function compareRecordIds(recordType: MergeRelayRecordType, left: string, right: string): number {
  if (recordType === "config") {
    const leftRevision = Number(left);
    const rightRevision = Number(right);
    if (Number.isSafeInteger(leftRevision) && Number.isSafeInteger(rightRevision))
      return leftRevision - rightRevision;
  }
  return left.localeCompare(right);
}

function compareAfterRecordId(
  recordType: MergeRelayRecordType,
  recordId: string,
  cursor: string,
  direction: "asc" | "desc" | undefined,
): boolean {
  if (recordType === "config") {
    const revision = Number(recordId);
    const cursorRevision = Number(cursor);
    if (Number.isSafeInteger(revision) && Number.isSafeInteger(cursorRevision))
      return direction === "desc" ? revision < cursorRevision : revision > cursorRevision;
    return false;
  }
  return direction === "desc" ? recordId < cursor : recordId > cursor;
}

export function putStateArtifact(
  state: MergeRelayState,
  recordType: MergeRelayRecordType,
  recordId: string,
  payload: unknown,
): void {
  removeStateArtifact(state, recordType, recordId);
  if (recordType === "challenge") state.challenges.push(payload as MergeChallenge);
  else if (recordType === "attempt") state.attempts.push(payload as MergeAttempt);
  else if (recordType === "result") state.results.push(payload as MergeResult);
  else if (recordType === "save") state.saves.push(payload as MergeSave);
  else if (recordType === "guest") state.guests.push(payload as MergeGuest);
  else if (recordType === "daily") state.daily.push(payload as MergeDailyChallenge);
  else if (recordType === "config") state.configs.push(payload as MergeConfigRevision);
  else if (recordType === "event") state.events.push(payload as MergeEvent);
  else if (recordType === "social") state.social.push(payload as MergeSocialRecord);
  else if (recordType === "reward") state.rewards.push(payload as MergeReward);
  else if (recordType === "alias") state.aliases.push(payload as MergeAlias);
}

export function removeStateArtifact(
  state: MergeRelayState,
  recordType: MergeRelayRecordType,
  recordId: string,
): void {
  const collection = collectionForType(state, recordType);
  const index = collection.findIndex((value) => recordIdFor(recordType, value) === recordId);
  if (index >= 0) collection.splice(index, 1);
}

function stateArtifacts(state: MergeRelayState): MemoryArtifact[] {
  return mergeRelayRecordTypes.flatMap((recordType) => recordsForType(state, recordType));
}

function recordsForType(
  state: MergeRelayState,
  recordType: MergeRelayRecordType,
): MemoryArtifact[] {
  if (recordType === "challenge")
    return state.challenges.map((payload) =>
      artifact(
        recordType,
        payload.challengeId,
        payload,
        payload.ownerSubject,
        null,
        null,
        payload.idempotencyKey,
        null,
      ),
    );
  if (recordType === "attempt")
    return state.attempts.map((payload) =>
      artifact(
        recordType,
        payload.attemptId,
        payload,
        payload.recipientSubject,
        payload.challengeId,
        null,
        null,
        null,
      ),
    );
  if (recordType === "result")
    return state.results.map((payload) =>
      artifact(
        recordType,
        payload.resultId,
        payload,
        payload.recipientSubject,
        payload.challengeId,
        null,
        payload.idempotencyKey,
        null,
      ),
    );
  if (recordType === "save")
    return state.saves.map((payload) =>
      artifact(
        recordType,
        artifactRecordId(payload.subject, payload.saveId),
        payload,
        payload.subject,
        null,
        null,
        null,
        null,
      ),
    );
  if (recordType === "guest")
    return state.guests.map((payload) =>
      artifact(
        recordType,
        payload.guestId,
        payload,
        payload.subject,
        null,
        null,
        null,
        null,
        null,
        payload.recoveryTokenHash,
      ),
    );
  if (recordType === "daily")
    return state.daily.map((payload) =>
      artifact(recordType, payload.date, payload, null, null, null, null, null),
    );
  if (recordType === "config")
    return state.configs.map((payload) =>
      artifact(recordType, String(payload.revision), payload, null, null, null, null, null),
    );
  if (recordType === "event")
    return state.events.map((payload) =>
      artifact(
        recordType,
        payload.eventId,
        payload,
        payload.subject,
        null,
        null,
        payload.idempotencyKey,
        null,
      ),
    );
  if (recordType === "social")
    return state.social.map((payload) =>
      artifact(
        recordType,
        payload.recordId,
        payload,
        payload.subject,
        null,
        null,
        null,
        null,
        payload.targetSubject,
      ),
    );
  if (recordType === "reward")
    return state.rewards.map((payload) =>
      artifact(
        recordType,
        payload.rewardId,
        payload,
        payload.subject,
        null,
        payload.resultId,
        payload.providerTransactionId,
        null,
      ),
    );
  return state.aliases.map((payload) =>
    artifact(
      recordType,
      payload.aliasId,
      payload,
      payload.subject,
      null,
      null,
      null,
      payload.alias,
    ),
  );
}

function artifact(
  recordType: MergeRelayRecordType,
  recordId: string,
  payload: unknown,
  ownerSubject: string | null,
  challengeId: string | null,
  resultId: string | null,
  idempotencyKey: string | null,
  alias: string | null = null,
  targetSubject: string | null = null,
  lookupKey: string | null = null,
): MemoryArtifact {
  return {
    recordType,
    recordId,
    payload,
    ownerSubject,
    challengeId,
    resultId,
    idempotencyKey,
    alias,
    targetSubject,
    lookupKey,
  };
}

function collectionForType(state: MergeRelayState, recordType: MergeRelayRecordType): unknown[] {
  if (recordType === "challenge") return state.challenges;
  if (recordType === "attempt") return state.attempts;
  if (recordType === "result") return state.results;
  if (recordType === "save") return state.saves;
  if (recordType === "guest") return state.guests;
  if (recordType === "daily") return state.daily;
  if (recordType === "config") return state.configs;
  if (recordType === "event") return state.events;
  if (recordType === "social") return state.social;
  if (recordType === "reward") return state.rewards;
  if (recordType === "alias") return state.aliases;
  return [];
}

function recordIdFor(recordType: MergeRelayRecordType, value: unknown): string {
  if (recordType === "challenge") return (value as MergeChallenge).challengeId;
  if (recordType === "attempt") return (value as MergeAttempt).attemptId;
  if (recordType === "result") return (value as MergeResult).resultId;
  if (recordType === "save") {
    const save = value as MergeSave;
    return artifactRecordId(save.subject, save.saveId);
  }
  if (recordType === "guest") return (value as MergeGuest).guestId;
  if (recordType === "daily") return (value as MergeDailyChallenge).date;
  if (recordType === "config") return String((value as MergeConfigRevision).revision);
  if (recordType === "event") return (value as MergeEvent).eventId;
  if (recordType === "social") return (value as MergeSocialRecord).recordId;
  if (recordType === "reward") return (value as MergeReward).rewardId;
  if (recordType === "alias") return (value as MergeAlias).aliasId;
  return "";
}
