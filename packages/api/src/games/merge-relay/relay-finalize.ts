import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseResultArtifact,
} from "./artifact-parsers";
import { requirePlayer } from "./authorization";
import type {
  FinalizeAttemptRequest,
  MergeChallenge,
  MergeEnvironment,
  MergeResult,
  MergeSession,
} from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { challengePayloadHash, checkpointHash, hasLegalMove, isTerminal } from "./engine";
import { MergeRelayError } from "./errors";
import { requestFingerprint } from "./fingerprint";
import { enqueuePgsResult } from "./pgs-service";
import { clone, createId } from "./relay-utils";

export async function finalizeAttempt(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  attemptId: string,
  input: FinalizeAttemptRequest,
): Promise<{ result: MergeResult; returnChallenge: MergeChallenge | null; idempotent: boolean }> {
  requirePlayer(session);
  const now = dependencies.clock.now();
  let expired = false;
  const finalized = await dependencies.store.transactArtifacts(environment, async (transaction) => {
    const attempt = await transaction.read(
      { recordType: "attempt", recordId: attemptId },
      parseAttemptArtifact,
    );
    if (!attempt) throw new MergeRelayError(404, "attempt_not_found", "Attempt was not found");
    if (attempt.recipientSubject !== session.subject)
      throw new MergeRelayError(
        403,
        "attempt_owner_required",
        "Only the reserved player may finalize moves",
      );
    if (attempt.resultId) {
      const existing = await transaction.read(
        { recordType: "result", recordId: attempt.resultId },
        parseResultArtifact,
      );
      if (!existing)
        throw new MergeRelayError(503, "result_missing", "Attempt result is unavailable");
      if (
        existing.idempotencyKey !== input.idempotencyKey ||
        existing.requestFingerprint !== finalizeFingerprint(input)
      )
        throw new MergeRelayError(
          409,
          "idempotency_conflict",
          "The attempt was finalized with another request",
        );
      const child = existing.returnChallengeId
        ? await transaction.read(
            { recordType: "challenge", recordId: existing.returnChallengeId },
            parseChallengeArtifact,
          )
        : null;
      return { result: existing, returnChallenge: child, idempotent: true };
    }
    if (attempt.status !== "reserved")
      throw new MergeRelayError(409, "attempt_not_playable", "Attempt is no longer playable");
    if (new Date(attempt.expiresAt).getTime() <= now.getTime()) {
      const abandoned = { ...attempt, status: "abandoned" as const, updatedAt: now.toISOString() };
      await transaction.put("attempt", attempt.attemptId, abandoned, {
        ownerSubject: attempt.recipientSubject,
        challengeId: attempt.challengeId,
        parentRecordType: "challenge",
        parentRecordId: attempt.challengeId,
      });
      await putEvent(transaction, session.subject, {
        eventId: createId(dependencies.idFactory, "evt"),
        idempotencyKey: `abandoned:${attempt.attemptId}`,
        type: "relay_attempt_abandoned",
        artifactId: attempt.attemptId,
        payload: {},
        createdAt: now.toISOString(),
      });
      expired = true;
      return null;
    }
    if (
      !input.finishEarly &&
      attempt.moves.length < attempt.maxLegalMoves &&
      !isTerminal(attempt.checkpoint)
    )
      throw new MergeRelayError(
        409,
        "attempt_incomplete",
        "Use all legal moves or explicitly finish early",
      );
    const challenge = await transaction.read(
      { recordType: "challenge", recordId: attempt.challengeId },
      parseChallengeArtifact,
    );
    if (!challenge)
      throw new MergeRelayError(404, "challenge_not_found", "Challenge was not found");
    let returnChallenge: MergeChallenge | null = null;
    if (input.returnAlias && hasLegalMove(attempt.checkpoint.board)) {
      returnChallenge = {
        challengeId: createId(dependencies.idFactory, "ch"),
        environment,
        ownerSubject: session.subject,
        creatorAlias: input.returnAlias,
        mode: challenge.mode,
        originMode: challenge.originMode,
        configRevision: challenge.configRevision,
        checkpoint: clone(attempt.checkpoint),
        checkpointHash: checkpointHash(attempt.checkpoint),
        payloadHash: challengePayloadHash({
          checkpoint: attempt.checkpoint,
          configRevision: challenge.configRevision,
          mode: challenge.mode,
          originMode: challenge.originMode,
          parentChallengeId: challenge.challengeId,
        }),
        parentChallengeId: challenge.challengeId,
        idempotencyKey: `return:${attempt.attemptId}`,
        requestFingerprint: requestFingerprint({
          parentChallengeId: challenge.challengeId,
          attemptId: attempt.attemptId,
          returnAlias: input.returnAlias,
        }),
        status: "open",
        createdAt: now.toISOString(),
      };
      await transaction.put("challenge", returnChallenge.challengeId, returnChallenge, {
        ownerSubject: returnChallenge.ownerSubject,
        idempotencyKey: returnChallenge.idempotencyKey,
        parentRecordType: "challenge",
        parentRecordId: returnChallenge.parentChallengeId,
      });
    }
    const result: MergeResult = {
      resultId: createId(dependencies.idFactory, "res"),
      attemptId,
      challengeId: challenge.challengeId,
      environment,
      recipientSubject: session.subject,
      scoreDelta: attempt.checkpoint.score - challenge.checkpoint.score,
      finalScore: attempt.checkpoint.score,
      maxTile: Math.max(...attempt.checkpoint.board),
      movesUsed: attempt.moves.length,
      outcome: isTerminal(attempt.checkpoint)
        ? "terminal"
        : attempt.moves.length >= attempt.maxLegalMoves
          ? "complete"
          : "early_finish",
      mode: challenge.mode,
      originMode: challenge.originMode,
      configRevision: challenge.configRevision,
      challengePayloadHash: challenge.payloadHash,
      returnChallengeId: returnChallenge?.challengeId ?? null,
      idempotencyKey: input.idempotencyKey,
      requestFingerprint: finalizeFingerprint(input),
      createdAt: now.toISOString(),
    };
    await transaction.put("result", result.resultId, result, {
      ownerSubject: result.recipientSubject,
      challengeId: result.challengeId,
      idempotencyKey: result.idempotencyKey,
      parentRecordType: "attempt",
      parentRecordId: result.attemptId,
    });
    await enqueuePgsResult(transaction, dependencies, result);
    await transaction.put(
      "attempt",
      attempt.attemptId,
      { ...attempt, resultId: result.resultId, status: "completed", updatedAt: now.toISOString() },
      {
        ownerSubject: attempt.recipientSubject,
        challengeId: attempt.challengeId,
        parentRecordType: "challenge",
        parentRecordId: attempt.challengeId,
      },
    );
    await putEvent(transaction, session.subject, {
      eventId: createId(dependencies.idFactory, "evt"),
      idempotencyKey: `result:${result.resultId}`,
      type: "attempt_completed",
      artifactId: result.resultId,
      payload: {
        challenge_id: challenge.challengeId,
        return_challenge_id: result.returnChallengeId,
      },
      createdAt: now.toISOString(),
    });
    if (returnChallenge)
      await putEvent(transaction, session.subject, {
        eventId: createId(dependencies.idFactory, "evt"),
        idempotencyKey: `return:${returnChallenge.challengeId}`,
        type: "relay_return_created",
        artifactId: returnChallenge.challengeId,
        payload: { parent_challenge_id: challenge.challengeId },
        createdAt: now.toISOString(),
      });
    return { result, returnChallenge, idempotent: false };
  });
  if (expired)
    throw new MergeRelayError(409, "reservation_expired", "Attempt reservation has expired");
  return finalized as {
    result: MergeResult;
    returnChallenge: MergeChallenge | null;
    idempotent: boolean;
  };
}

async function putEvent(
  transaction: import("./artifact-store").MergeRelayArtifactTransaction,
  subject: string,
  event: {
    eventId: string;
    idempotencyKey: string;
    type: "relay_attempt_abandoned" | "attempt_completed" | "relay_return_created";
    artifactId: string;
    payload: Record<string, unknown>;
    createdAt: string;
  },
): Promise<void> {
  await transaction.put(
    "event",
    event.eventId,
    {
      ...event,
      subject,
      requestFingerprint: requestFingerprint(event),
    },
    { ownerSubject: subject, idempotencyKey: event.idempotencyKey },
  );
}

function finalizeFingerprint(input: FinalizeAttemptRequest): string {
  return requestFingerprint({
    finishEarly: input.finishEarly ?? false,
    returnAlias: input.returnAlias ?? null,
  });
}
