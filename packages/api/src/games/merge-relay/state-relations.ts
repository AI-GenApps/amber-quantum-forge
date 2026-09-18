import type { MergeEnvironment, MergeRelayState } from "./contracts";

export function validateStateRelations(
  state: MergeRelayState,
  environment?: MergeEnvironment,
): void {
  const ids = [
    ["challenge", state.challenges.map((value) => value.challengeId)],
    ["attempt", state.attempts.map((value) => value.attemptId)],
    ["result", state.results.map((value) => value.resultId)],
    ["guest", state.guests.map((value) => value.guestId)],
    ["event", state.events.map((value) => value.eventId)],
    ["social", state.social.map((value) => value.recordId)],
    ["reward", state.rewards.map((value) => value.rewardId)],
    ["alias", state.aliases.map((value) => value.aliasId)],
  ] as const;
  for (const [kind, values] of ids) {
    if (new Set(values).size !== values.length) throw new Error(`Duplicate Merge Relay ${kind} ID`);
  }
  if (state.configs.filter((config) => config.active).length !== 1)
    throw new Error("Merge Relay must have exactly one active config");
  const challenges = new Map(state.challenges.map((value) => [value.challengeId, value]));
  const attempts = new Map(state.attempts.map((value) => [value.attemptId, value]));
  const results = new Map(state.results.map((value) => [value.resultId, value]));
  for (const challenge of state.challenges) {
    if (challenge.mode !== "rescue") throw new Error("Challenge mode is invalid");
    if (environment && challenge.environment !== environment)
      throw new Error("Challenge scope mismatch");
    if (challenge.parentChallengeId) {
      if (challenge.parentChallengeId === challenge.challengeId)
        throw new Error("Challenge cannot parent itself");
      const parent = challenges.get(challenge.parentChallengeId);
      if (!parent || parent.environment !== challenge.environment)
        throw new Error("Challenge parent relation is invalid");
    }
    if (state.configs.every((config) => config.revision !== challenge.configRevision))
      throw new Error("Challenge config relation is invalid");
  }
  for (const attempt of state.attempts) {
    const challenge = challenges.get(attempt.challengeId);
    if (!challenge || challenge.environment !== attempt.environment)
      throw new Error("Attempt challenge relation is invalid");
    if (attempt.resultId) {
      const result = results.get(attempt.resultId);
      if (
        !result ||
        result.attemptId !== attempt.attemptId ||
        result.challengeId !== attempt.challengeId
      )
        throw new Error("Attempt result relation is invalid");
    }
    if (attempt.status !== "completed" && attempt.resultId)
      throw new Error("Non-completed attempt has a result");
    if (attempt.status === "completed" && !attempt.resultId)
      throw new Error("Completed attempt lacks result");
  }
  for (const result of state.results) {
    const attempt = attempts.get(result.attemptId);
    const challenge = challenges.get(result.challengeId);
    if (
      !attempt ||
      !challenge ||
      attempt.status !== "completed" ||
      attempt.challengeId !== result.challengeId ||
      result.environment !== attempt.environment ||
      result.environment !== challenge.environment ||
      result.recipientSubject !== attempt.recipientSubject ||
      result.mode !== challenge.mode ||
      result.originMode !== challenge.originMode ||
      result.configRevision !== challenge.configRevision ||
      (result.challengePayloadHash !== undefined &&
        result.challengePayloadHash !== challenge.payloadHash) ||
      result.movesUsed > attempt.maxLegalMoves
    )
      throw new Error("Result relation is invalid");
    if (result.returnChallengeId) {
      const returned = challenges.get(result.returnChallengeId);
      if (!returned || returned.parentChallengeId !== result.challengeId)
        throw new Error("Return challenge relation is invalid");
    }
  }
  for (const reward of state.rewards) {
    const result = results.get(reward.resultId);
    if (!result || result.recipientSubject !== reward.subject)
      throw new Error("Reward relation is invalid");
  }
  for (const record of state.social) {
    if (!record.targetSubject) throw new Error("Social target must be resolved");
  }
  const saveKeys = state.saves.map((save) => JSON.stringify([save.subject, save.saveId]));
  if (new Set(saveKeys).size !== saveKeys.length) throw new Error("Duplicate Merge Relay save");
  const dailyDates = state.daily.map((daily) => daily.date);
  if (new Set(dailyDates).size !== dailyDates.length)
    throw new Error("Duplicate Merge Relay daily");
  const configRevisions = state.configs.map((config) => config.revision);
  if (new Set(configRevisions).size !== configRevisions.length)
    throw new Error("Duplicate Merge Relay config revision");
}
