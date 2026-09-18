import { upgradeGuest } from "./identity-service";
import { getAttempt, getChallengeForSubject, getResult, retireChallenge } from "./relay-queries";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";
import {
  isSafeId,
  parseCreateChallenge,
  parseFinalize,
  parseGuestRecovery,
  parseReserveAttempt,
  parseSubmitMoves,
} from "./validation";
import { attemptToWire, publicChallengeToWire, resultToWire } from "./wire";

export function registerRelayRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.post("/:environment/guest/upgrade", async (c) => {
    const input = parseGuestRecovery(await readBody(c));
    if (!input) return fail(c, 422, "invalid_guest_upgrade", "Guest upgrade payload is invalid");
    const upgraded = await upgradeGuest(
      dependencies,
      c.get("environment"),
      c.get("session"),
      input,
    );
    return respond(c, {
      guest_id: upgraded.guestId,
      subject: upgraded.subject,
      upgraded_subject: upgraded.upgradedSubject,
    });
  });

  routes.post("/:environment/challenges", async (c) => {
    const input = parseCreateChallenge(await readBody(c));
    if (!input) return fail(c, 422, "invalid_challenge_payload", "Challenge payload is invalid");
    const created = await createChallenge(
      dependencies,
      c.get("environment"),
      c.get("session"),
      input,
    );
    return respond(
      c,
      { challenge: publicChallengeToWire(created.challenge), idempotent: created.idempotent },
      201,
    );
  });

  routes.get("/:environment/challenges/:challengeId", async (c) => {
    const challengeId = c.req.param("challengeId");
    if (!isSafeId(challengeId))
      return fail(c, 400, "invalid_challenge_id", "Challenge ID is invalid");
    return respond(c, {
      challenge: publicChallengeToWire(
        await getChallengeForSubject(
          dependencies,
          c.get("environment"),
          c.get("session"),
          challengeId,
        ),
      ),
    });
  });

  routes.post("/:environment/challenges/:challengeId/retire", async (c) => {
    const challengeId = c.req.param("challengeId");
    if (!isSafeId(challengeId))
      return fail(c, 400, "invalid_challenge_id", "Challenge ID is invalid");
    return respond(c, {
      challenge: publicChallengeToWire(
        await retireChallenge(dependencies, c.get("environment"), c.get("session"), challengeId),
      ),
    });
  });

  routes.post("/:environment/challenges/:challengeId/attempts", async (c) => {
    const challengeId = c.req.param("challengeId");
    const input = parseReserveAttempt(await readBody(c));
    if (!isSafeId(challengeId) || !input)
      return fail(c, 422, "invalid_reservation", "Reservation payload is invalid");
    const reserved = await reserveAttempt(
      dependencies,
      c.get("environment"),
      c.get("session"),
      challengeId,
      input,
    );
    return respond(
      c,
      { attempt: attemptToWire(reserved.attempt), idempotent: reserved.idempotent },
      201,
    );
  });

  routes.post("/:environment/attempts/:attemptId/moves", async (c) => {
    const attemptId = c.req.param("attemptId");
    const input = parseSubmitMoves(await readBody(c));
    if (!isSafeId(attemptId) || !input)
      return fail(c, 422, "invalid_moves", "Move payload is invalid");
    return respond(c, {
      attempt: attemptToWire(
        await submitMoves(dependencies, c.get("environment"), c.get("session"), attemptId, input),
      ),
    });
  });

  routes.get("/:environment/attempts/:attemptId", async (c) => {
    const attemptId = c.req.param("attemptId");
    if (!isSafeId(attemptId)) return fail(c, 400, "invalid_attempt_id", "Attempt ID is invalid");
    return respond(c, {
      attempt: attemptToWire(
        await getAttempt(dependencies, c.get("environment"), c.get("session"), attemptId),
      ),
    });
  });

  routes.post("/:environment/attempts/:attemptId/finalize", async (c) => {
    const attemptId = c.req.param("attemptId");
    const input = parseFinalize(await readBody(c));
    if (!isSafeId(attemptId) || !input)
      return fail(c, 422, "invalid_finalize", "Finalize payload is invalid");
    const finalized = await finalizeAttempt(
      dependencies,
      c.get("environment"),
      c.get("session"),
      attemptId,
      input,
    );
    return respond(c, {
      result: resultToWire(finalized.result),
      return_challenge: finalized.returnChallenge
        ? publicChallengeToWire(finalized.returnChallenge)
        : null,
      idempotent: finalized.idempotent,
    });
  });

  routes.get("/:environment/results/:resultId", async (c) => {
    const resultId = c.req.param("resultId");
    if (!isSafeId(resultId)) return fail(c, 400, "invalid_result_id", "Result ID is invalid");
    return respond(c, {
      result: resultToWire(
        await getResult(dependencies, c.get("environment"), c.get("session"), resultId),
      ),
    });
  });
}
