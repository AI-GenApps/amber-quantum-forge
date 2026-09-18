import type { MergeRelayArtifactMetadata } from "./artifact-store";
import type {
  MergePgsIdentity,
  MergePgsOutbox,
  MergePgsProviderDelivery,
  MergePgsRuntime,
} from "./pgs-contracts";
import { GooglePlayGamesProviderError } from "./pgs-provider";

export function metadata(item: MergePgsOutbox): MergeRelayArtifactMetadata {
  return {
    ownerSubject: item.subject,
    resultId: item.resultId,
    idempotencyKey: item.idempotencyKey,
    parentRecordType: "result",
    parentRecordId: item.resultId,
  };
}

export function isReauthorization(error: unknown): boolean {
  return error instanceof GooglePlayGamesProviderError && error.code === "reauthorization_required";
}

export function providerCode(error: unknown): string {
  return error instanceof GooglePlayGamesProviderError ? error.code : "provider_unavailable";
}

export async function deliverPgsOutbox(
  runtime: MergePgsRuntime,
  lease: MergePgsOutbox,
  accessToken: string,
  identity: MergePgsIdentity,
): Promise<MergePgsProviderDelivery> {
  if (!lease.targetId) throw new GooglePlayGamesProviderError("target_unconfigured", false);
  if (lease.kind === "achievement")
    return runtime.provider.unlockAchievement({
      accessToken,
      playerId: identity.playerId,
      achievementId: lease.targetId,
      resultId: lease.resultId,
      idempotencyKey: lease.idempotencyKey,
    });
  return runtime.provider.submitLeaderboard({
    accessToken,
    playerId: identity.playerId,
    leaderboardId: lease.targetId,
    score: lease.providerScore ?? 0,
    scoreTag: lease.resultId,
    resultId: lease.resultId,
    idempotencyKey: lease.idempotencyKey,
  });
}
