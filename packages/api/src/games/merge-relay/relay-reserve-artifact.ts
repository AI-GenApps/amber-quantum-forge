import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseConfigArtifact,
  parseSocialArtifact,
} from "./artifact-parsers";
import { requirePlayer } from "./authorization";
import { requireActiveConfig } from "./config-policy";
import type {
  MergeAttempt,
  MergeEnvironment,
  MergeSession,
  ReserveAttemptRequest,
} from "./contracts";
import { MERGE_RELAY_MAX_MOVES, MERGE_RELAY_RESERVATION_HOURS } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { requestFingerprint } from "./fingerprint";
import { clone, createId } from "./relay-utils";

export async function reserveAttempt(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  challengeId: string,
  input: ReserveAttemptRequest,
): Promise<{ attempt: MergeAttempt; idempotent: boolean }> {
  requirePlayer(session);
  const now = dependencies.clock.now();
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const challenge = await transaction.read(
      { recordType: "challenge", recordId: challengeId },
      parseChallengeArtifact,
    );
    if (!challenge)
      throw new MergeRelayError(404, "challenge_not_found", "Challenge was not found");
    if (challenge.status !== "open")
      throw new MergeRelayError(409, "challenge_retired", "Challenge is no longer playable");
    const config = await transaction.read(
      { recordType: "config", direction: "desc" },
      parseConfigArtifact,
    );
    requireActiveConfig(config, "rankedRelay");
    const [outgoingBlocks, incomingBlocks] = await Promise.all([
      transaction.list(
        {
          recordType: "social",
          ownerSubject: session.subject,
          targetSubject: challenge.ownerSubject,
          limit: 100,
        },
        parseSocialArtifact,
      ),
      transaction.list(
        {
          recordType: "social",
          ownerSubject: challenge.ownerSubject,
          targetSubject: session.subject,
          limit: 100,
        },
        parseSocialArtifact,
      ),
    ]);
    if (
      [...outgoingBlocks.items, ...incomingBlocks.items].some((record) => record.action === "block")
    )
      throw new MergeRelayError(403, "player_blocked", "This challenge is unavailable");
    const existing = (
      await transaction.list(
        {
          recordType: "attempt",
          challengeId,
          ownerSubject: session.subject,
          limit: 2,
        },
        parseAttemptArtifact,
      )
    ).items[0];
    if (existing) {
      if (existing.status === "abandoned" || existing.status === "cancelled")
        throw new MergeRelayError(
          409,
          "reservation_expired",
          "This challenge reservation has expired",
        );
      if (existing.reservationKey === input.reservationKey)
        return { attempt: existing, idempotent: true };
      throw new MergeRelayError(
        409,
        "reservation_exists",
        "This challenge already has a reservation",
      );
    }
    const attempt: MergeAttempt = {
      attemptId: createId(dependencies.idFactory, "att"),
      challengeId,
      environment,
      recipientSubject: session.subject,
      checkpoint: clone(challenge.checkpoint),
      maxLegalMoves: challenge.checkpoint.maxLegalMoves ?? MERGE_RELAY_MAX_MOVES,
      moves: [],
      status: "reserved",
      reservationKey: input.reservationKey,
      reservedAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + MERGE_RELAY_RESERVATION_HOURS * 60 * 60 * 1000,
      ).toISOString(),
      version: 0,
      resultId: null,
      updatedAt: now.toISOString(),
    };
    await transaction.put("attempt", attempt.attemptId, attempt, {
      ownerSubject: attempt.recipientSubject,
      challengeId: attempt.challengeId,
      parentRecordType: "challenge",
      parentRecordId: attempt.challengeId,
    });
    const event = {
      eventId: createId(dependencies.idFactory, "evt"),
      idempotencyKey: `attempt:${attempt.attemptId}`,
      subject: session.subject,
      type: "relay_attempt_reserved",
      artifactId: attempt.attemptId,
      payload: { challenge_id: challengeId },
      requestFingerprint: requestFingerprint({
        type: "relay_attempt_reserved",
        attemptId: attempt.attemptId,
      }),
      createdAt: now.toISOString(),
    };
    await transaction.put("event", event.eventId, event, {
      ownerSubject: session.subject,
      idempotencyKey: event.idempotencyKey,
    });
    return { attempt, idempotent: false };
  });
}
