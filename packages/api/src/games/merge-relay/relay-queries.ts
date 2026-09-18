import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseResultArtifact,
} from "./artifact-parsers";
import { requireRole } from "./authorization";
import type {
  MergeAttempt,
  MergeEnvironment,
  MergeResult,
  MergeSession,
  PublicChallenge,
} from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { requestFingerprint } from "./fingerprint";
import { clone, toPublicChallenge } from "./relay-utils";

export async function resolveChallenge(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  challengeId: string,
): Promise<PublicChallenge> {
  const page = await dependencies.store.readArtifacts(
    environment,
    { recordType: "challenge", recordId: challengeId, limit: 1 },
    parseChallengeArtifact,
  );
  const challenge = page.items[0];
  if (!challenge) throw new MergeRelayError(404, "challenge_not_found", "Challenge was not found");
  return toPublicChallenge(challenge);
}

export async function getChallengeForSubject(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  challengeId: string,
): Promise<PublicChallenge> {
  const challengePage = await dependencies.store.readArtifacts(
    environment,
    { recordType: "challenge", recordId: challengeId, limit: 1 },
    parseChallengeArtifact,
  );
  const challenge = challengePage.items[0];
  if (!challenge) throw new MergeRelayError(404, "challenge_not_found", "Challenge was not found");
  const attempts = await dependencies.store.readArtifacts(
    environment,
    { recordType: "attempt", challengeId, ownerSubject: session.subject, limit: 1 },
    parseAttemptArtifact,
  );
  const member = challenge.ownerSubject === session.subject || attempts.items.length > 0;
  if (!member && session.role !== "game_admin")
    throw new MergeRelayError(
      403,
      "challenge_membership_required",
      "Challenge membership is required",
    );
  return toPublicChallenge(challenge);
}

export async function getAttempt(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  attemptId: string,
): Promise<MergeAttempt> {
  const page = await dependencies.store.readArtifacts(
    environment,
    { recordType: "attempt", recordId: attemptId, limit: 1 },
    parseAttemptArtifact,
  );
  const attempt = page.items[0];
  if (!attempt) throw new MergeRelayError(404, "attempt_not_found", "Attempt was not found");
  if (attempt.recipientSubject !== session.subject && session.role !== "game_admin")
    throw new MergeRelayError(403, "attempt_owner_required", "Attempt ownership is required");
  return clone(attempt);
}

export async function getResult(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  resultId: string,
): Promise<MergeResult> {
  const resultPage = await dependencies.store.readArtifacts(
    environment,
    { recordType: "result", recordId: resultId, limit: 1 },
    parseResultArtifact,
  );
  const result = resultPage.items[0];
  if (!result) throw new MergeRelayError(404, "result_not_found", "Result was not found");
  const challengePage = await dependencies.store.readArtifacts(
    environment,
    { recordType: "challenge", recordId: result.challengeId, limit: 1 },
    parseChallengeArtifact,
  );
  const challenge = challengePage.items[0];
  if (
    result.recipientSubject !== session.subject &&
    challenge?.ownerSubject !== session.subject &&
    session.role !== "game_admin"
  )
    throw new MergeRelayError(403, "result_access_denied", "Result access is denied");
  return clone(result);
}

export async function retireChallenge(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  challengeId: string,
): Promise<PublicChallenge> {
  requireRole(session, "game_admin");
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const challenge = await transaction.read(
      { recordType: "challenge", recordId: challengeId },
      parseChallengeArtifact,
    );
    if (!challenge)
      throw new MergeRelayError(404, "challenge_not_found", "Challenge was not found");
    if (challenge.status === "retired") return toPublicChallenge(challenge);
    challenge.status = "retired";
    const retiredAt = dependencies.clock.now().toISOString();
    await transaction.put("challenge", challenge.challengeId, challenge, {
      ownerSubject: challenge.ownerSubject,
      idempotencyKey: challenge.idempotencyKey,
      parentRecordType: challenge.parentChallengeId ? "challenge" : null,
      parentRecordId: challenge.parentChallengeId,
    });
    let afterRecordId: string | undefined;
    do {
      const page = await transaction.list(
        {
          recordType: "attempt",
          challengeId,
          limit: 100,
          ...(afterRecordId === undefined ? {} : { afterRecordId }),
        },
        parseAttemptArtifact,
      );
      for (const attempt of page.items) {
        if (attempt.status !== "reserved") continue;
        const updatedAt = dependencies.clock.now().toISOString();
        await transaction.put(
          "attempt",
          attempt.attemptId,
          { ...attempt, status: "cancelled", updatedAt },
          {
            ownerSubject: attempt.recipientSubject,
            challengeId,
            parentRecordType: "challenge",
            parentRecordId: challengeId,
          },
        );
        const event = {
          eventId: `evt_cancel_${attempt.attemptId}`,
          idempotencyKey: `cancel:${attempt.attemptId}`,
          subject: session.subject,
          type: "relay_attempt_cancelled" as const,
          artifactId: attempt.attemptId,
          payload: { challenge_id: challengeId },
          requestFingerprint: requestFingerprint({
            type: "relay_attempt_cancelled",
            attemptId: attempt.attemptId,
          }),
          createdAt: updatedAt,
        };
        await transaction.put("event", event.eventId, event, {
          ownerSubject: session.subject,
          idempotencyKey: event.idempotencyKey,
        });
      }
      afterRecordId = page.nextCursor ?? undefined;
    } while (afterRecordId !== undefined);
    const event = {
      eventId: `evt_retire_${challenge.challengeId}`,
      idempotencyKey: `retire:${challenge.challengeId}`,
      subject: session.subject,
      type: "challenge_retired",
      artifactId: challenge.challengeId,
      payload: {},
      requestFingerprint: requestFingerprint({ type: "challenge_retired", challengeId }),
      createdAt: retiredAt,
    };
    await transaction.put("event", event.eventId, event, {
      ownerSubject: session.subject,
      idempotencyKey: event.idempotencyKey,
    });
    return toPublicChallenge(challenge);
  });
}
