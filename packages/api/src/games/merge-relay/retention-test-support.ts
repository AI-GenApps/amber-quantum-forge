import type { AdSsvRecord } from "./ad-ssv-contracts";
import { adSsvRecordId } from "./ad-ssv-service";
import type { MergeEnvironment, MergeEvent, MergeResult } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import type { MergePgsOutbox } from "./pgs-contracts";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import { testCheckpoint, testSession } from "./relay-test-support";

export const ANCIENT = "2001-01-01T00:00:00.000Z";

export function withClock(
  dependencies: MergeRelayServiceDependencies,
  iso: string,
): MergeRelayServiceDependencies {
  return { ...dependencies, clock: { now: () => new Date(iso) } };
}

export async function seedEvent(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  eventId: string,
  createdAt: string,
): Promise<void> {
  const event: MergeEvent = {
    eventId,
    idempotencyKey: `idem_${eventId}`,
    subject: "retention_subject",
    type: "challenge_opened",
    artifactId: null,
    payload: {},
    createdAt,
  };
  await dependencies.store.transactArtifacts(environment, (transaction) =>
    transaction.put("event", eventId, event, {
      ownerSubject: event.subject,
      idempotencyKey: event.idempotencyKey,
    }),
  );
}

export async function seedAdSsv(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  transactionId: string,
  receivedAt: string,
): Promise<string> {
  const record: AdSsvRecord = {
    transactionId,
    subject: "retention_subject",
    resultId: "res_retention",
    adUnit: "unit",
    rewardAmount: 1,
    rewardItem: "coin",
    timestampMs: 1,
    environment,
    receivedAt,
  };
  const recordId = adSsvRecordId(transactionId);
  await dependencies.store.transactArtifacts(environment, (transaction) =>
    transaction.put("ad_ssv", recordId, record, {
      ownerSubject: record.subject,
      resultId: record.resultId,
      idempotencyKey: transactionId,
    }),
  );
  return recordId;
}

export async function seedOutbox(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  result: MergeResult,
  name: string,
  status: MergePgsOutbox["status"],
  updatedAt: string,
): Promise<string> {
  const outboxId = `pgs_outbox_${name}`;
  const record: MergePgsOutbox = {
    outboxId,
    environment,
    subject: result.recipientSubject,
    provider: "google_play_games",
    kind: "achievement",
    resultId: result.resultId,
    identityId: null,
    credentialId: null,
    playerId: null,
    targetKey: name,
    targetId: null,
    cohortHash: null,
    scoreDelta: null,
    maxTile: null,
    providerScore: null,
    idempotencyKey: `idem_${name}`,
    status,
    disabledReason: null,
    attemptCount: 0,
    leaseId: null,
    leaseExpiresAt: null,
    nextAttemptAt: updatedAt,
    lastErrorCode: null,
    createdAt: updatedAt,
    updatedAt,
  };
  await dependencies.store.transactArtifacts(environment, (transaction) =>
    transaction.put("pgs_outbox", outboxId, record, {
      ownerSubject: record.subject,
      resultId: record.resultId,
      idempotencyKey: record.idempotencyKey,
      parentRecordType: "result",
      parentRecordId: record.resultId,
    }),
  );
  return outboxId;
}

export async function playToResult(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  suffix: string,
): Promise<{ challengeId: string; attemptId: string; result: MergeResult }> {
  const creator = testSession(`creator_${suffix}`, environment);
  const player = testSession(`player_${suffix}`, environment);
  const created = await createChallenge(dependencies, environment, creator, {
    idempotencyKey: `ret-create-${suffix}`,
    creatorAlias: "Retention",
    checkpoint: testCheckpoint,
  });
  const challengeId = created.challenge.challengeId;
  const reserved = await reserveAttempt(dependencies, environment, player, challengeId, {
    reservationKey: `ret-reserve-${suffix}`,
  });
  const attemptId = reserved.attempt.attemptId;
  await submitMoves(dependencies, environment, player, attemptId, {
    expectedVersion: 0,
    moves: ["left"],
  });
  const finalized = await finalizeAttempt(dependencies, environment, player, attemptId, {
    idempotencyKey: `ret-final-${suffix}`,
    finishEarly: true,
  });
  return { challengeId, attemptId, result: finalized.result };
}
