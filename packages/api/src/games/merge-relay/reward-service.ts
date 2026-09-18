import { parseConfigArtifact, parseResultArtifact, parseRewardArtifact } from "./artifact-parsers";
import { requireRole } from "./authorization";
import type { MergeEnvironment, MergeReward, MergeSession, RewardGrantRequest } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { requestFingerprint } from "./fingerprint";

export async function grantReward(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: RewardGrantRequest,
): Promise<MergeReward> {
  requireRole(session, "service");
  const result = (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "result", recordId: input.resultId, limit: 1 },
      parseResultArtifact,
    )
  ).items[0];
  if (!result) throw new MergeRelayError(404, "result_not_found", "Result was not found");
  const existing = await dependencies.store.transactArtifacts(environment, async (transaction) => {
    const byProvider = (
      await transaction.list(
        {
          recordType: "reward",
          idempotencyKey: input.providerTransactionId,
          limit: 2,
        },
        parseRewardArtifact,
      )
    ).items[0];
    if (byProvider) {
      if (
        byProvider.resultId !== input.resultId ||
        byProvider.kind !== input.kind ||
        byProvider.productId !== input.productId
      )
        throw new MergeRelayError(
          409,
          "reward_idempotency_conflict",
          "The provider transaction is attached to another reward",
        );
      return byProvider;
    }
    const duplicate = (
      await transaction.list(
        { recordType: "reward", resultId: input.resultId, limit: 100 },
        parseRewardArtifact,
      )
    ).items.find((reward) => reward.kind === input.kind);
    return duplicate?.providerTransactionId === input.providerTransactionId ? duplicate : null;
  });
  if (existing) {
    if (
      existing.productId !== input.productId ||
      existing.providerTransactionId !== input.providerTransactionId
    )
      throw new MergeRelayError(409, "reward_idempotency_conflict", "Reward product conflicts");
    return existing;
  }
  const config = (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "config", direction: "desc", limit: 1 },
      parseConfigArtifact,
    )
  ).items[0];
  if (
    !config ||
    (input.kind === "cosmetic" && !config.features.cosmetics) ||
    (input.kind === "ad_reward" && !config.features.rewardedAds)
  )
    throw new MergeRelayError(503, "rewards_disabled", "This reward feature is disabled");
  if (!dependencies.rewardProvider)
    throw new MergeRelayError(
      503,
      "rewards_disabled",
      "Sandbox reward settlement is not configured",
    );
  const settlement = await dependencies.rewardProvider.verifySettlement(input, {
    environment,
    subject: result.recipientSubject,
    resultId: result.resultId,
    productId: input.productId,
    kind: input.kind,
  });
  if (
    !settlement.verified ||
    settlement.providerTransactionId !== input.providerTransactionId ||
    settlement.environment !== environment ||
    settlement.subject !== result.recipientSubject ||
    settlement.resultId !== result.resultId ||
    settlement.productId !== input.productId ||
    settlement.kind !== input.kind ||
    settlement.refunded ||
    settlement.cancelled
  )
    throw new MergeRelayError(
      422,
      "reward_not_verified",
      "The provider did not verify this reward",
    );
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const existing = (
      await transaction.list(
        {
          recordType: "reward",
          idempotencyKey: input.providerTransactionId,
          limit: 2,
        },
        parseRewardArtifact,
      )
    ).items[0];
    if (existing) {
      if (
        existing.resultId !== input.resultId ||
        existing.kind !== input.kind ||
        existing.productId !== input.productId
      )
        throw new MergeRelayError(
          409,
          "reward_idempotency_conflict",
          "The provider transaction is attached to another reward",
        );
      return existing;
    }
    const duplicate = (
      await transaction.list(
        { recordType: "reward", resultId: input.resultId, limit: 100 },
        parseRewardArtifact,
      )
    ).items.find((reward) => reward.kind === input.kind);
    if (duplicate) {
      if (
        duplicate.productId !== input.productId ||
        duplicate.providerTransactionId !== input.providerTransactionId
      )
        throw new MergeRelayError(409, "reward_idempotency_conflict", "Reward product conflicts");
      return duplicate;
    }
    const reward: MergeReward = {
      rewardId: `reward_${requestFingerprint({ environment, resultId: input.resultId, kind: input.kind, productId: input.productId })}`,
      resultId: input.resultId,
      subject: result.recipientSubject,
      kind: input.kind,
      productId: input.productId,
      providerTransactionId: input.providerTransactionId,
      status: "granted",
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("reward", reward.rewardId, reward, {
      ownerSubject: reward.subject,
      resultId: reward.resultId,
      idempotencyKey: reward.providerTransactionId,
      parentRecordType: "result",
      parentRecordId: reward.resultId,
    });
    return reward;
  });
}
