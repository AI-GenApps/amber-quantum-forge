import { parseAttemptArtifact } from "./artifact-parsers";
import { requirePlayer } from "./authorization";
import type { MergeAttempt, MergeEnvironment, MergeSession, SubmitMovesRequest } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { applyMove } from "./engine";
import { MergeRelayError } from "./errors";
import { clone, createId } from "./relay-utils";

export async function submitMoves(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  attemptId: string,
  input: SubmitMovesRequest,
): Promise<MergeAttempt> {
  requirePlayer(session);
  const now = dependencies.clock.now();
  let expired = false;
  const attempt = await dependencies.store.transactArtifacts(environment, async (transaction) => {
    const attempt = await transaction.read(
      { recordType: "attempt", recordId: attemptId },
      parseAttemptArtifact,
    );
    if (!attempt) throw new MergeRelayError(404, "attempt_not_found", "Attempt was not found");
    if (attempt.recipientSubject !== session.subject)
      throw new MergeRelayError(
        403,
        "attempt_owner_required",
        "Only the reserved player may submit moves",
      );
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
      const event = {
        eventId: createId(dependencies.idFactory, "evt"),
        idempotencyKey: `abandoned:${attempt.attemptId}`,
        subject: session.subject,
        type: "relay_attempt_abandoned",
        artifactId: attempt.attemptId,
        payload: {},
        createdAt: now.toISOString(),
      };
      await transaction.put("event", event.eventId, event, {
        ownerSubject: session.subject,
        idempotencyKey: event.idempotencyKey,
      });
      expired = true;
      return abandoned;
    }
    if (attempt.version !== input.expectedVersion)
      throw new MergeRelayError(
        409,
        "attempt_version_conflict",
        "Attempt changed on another device",
      );
    if (attempt.moves.length + input.moves.length > attempt.maxLegalMoves)
      throw new MergeRelayError(
        422,
        "move_budget_exceeded",
        "An attempt may contain at most three legal moves",
      );
    let checkpoint = clone(attempt.checkpoint);
    for (const move of input.moves) {
      const applied = applyMove(checkpoint, move);
      if (!applied.changed)
        throw new MergeRelayError(
          422,
          applied.reason === "terminal" ? "attempt_terminal" : "illegal_move",
          "Move is not legal for this checkpoint",
        );
      checkpoint = applied.checkpoint;
    }
    const updated = {
      ...attempt,
      checkpoint,
      moves: [...attempt.moves, ...input.moves],
      version: attempt.version + 1,
      updatedAt: now.toISOString(),
    };
    await transaction.put("attempt", attempt.attemptId, updated, {
      ownerSubject: attempt.recipientSubject,
      challengeId: attempt.challengeId,
      parentRecordType: "challenge",
      parentRecordId: attempt.challengeId,
    });
    return updated;
  });
  if (expired)
    throw new MergeRelayError(409, "reservation_expired", "Attempt reservation has expired");
  return attempt;
}
