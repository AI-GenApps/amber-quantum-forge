import type { CreateChallengeRequest, MergeCheckpoint, MergeConfigRevision } from "./contracts";
import { MergeRelayError } from "./errors";

export function requireActiveConfig(
  config: MergeConfigRevision | null,
  feature?: keyof MergeConfigRevision["features"],
): MergeConfigRevision {
  if (!config)
    throw new MergeRelayError(503, "config_unavailable", "Relay configuration is unavailable");
  if (!config.active)
    throw new MergeRelayError(503, "config_inactive", "Relay configuration is not active");
  if (feature && !config.features[feature])
    throw new MergeRelayError(503, "feature_disabled", `Relay feature ${feature} is disabled`);
  return config;
}

export function validateChallengeContent(
  input: CreateChallengeRequest,
  config: MergeConfigRevision,
): void {
  const checkpointVersion = input.checkpoint.contentVersion;
  const requestedVersion = input.contentVersion;
  if (checkpointVersion !== undefined && checkpointVersion !== config.contentRevision)
    throw new MergeRelayError(422, "content_version_mismatch", "Checkpoint content is not current");
  if (requestedVersion !== undefined && requestedVersion !== config.contentRevision)
    throw new MergeRelayError(422, "content_version_mismatch", "Requested content is not current");
  if (
    input.contentId !== undefined &&
    input.checkpoint.contentId !== undefined &&
    input.contentId !== input.checkpoint.contentId
  )
    throw new MergeRelayError(422, "content_id_mismatch", "Content identifiers do not match");
}

export function bindCheckpointContent(
  checkpoint: MergeCheckpoint,
  contentId: string | undefined,
  config: MergeConfigRevision,
): MergeCheckpoint {
  return {
    ...checkpoint,
    contentId: contentId ?? checkpoint.contentId,
    contentVersion: config.contentRevision,
    spawnTwoWeight: config.spawnTwoWeight,
    spawnFourWeight: config.spawnFourWeight,
  };
}
