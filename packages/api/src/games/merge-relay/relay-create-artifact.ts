import { registerAliasArtifact } from "./alias-artifact-service";
import {
  parseChallengeArtifact,
  parseConfigArtifact,
  parseDailyArtifact,
} from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import { requirePlayer } from "./authorization";
import {
  bindCheckpointContent,
  requireActiveConfig,
  validateChallengeContent,
} from "./config-policy";
import type {
  CreateChallengeRequest,
  MergeChallenge,
  MergeDailyChallenge,
  MergeEnvironment,
  MergeSession,
} from "./contracts";
import { MERGE_RELAY_MAX_MOVES } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { challengePayloadHash, checkpointHash, hasLegalMove, validateCheckpoint } from "./engine";
import { MergeRelayError } from "./errors";
import { challengeFingerprint, requestFingerprint } from "./fingerprint";
import { clone, createId } from "./relay-utils";

export function createChallenge(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: CreateChallengeRequest,
): Promise<{ challenge: MergeChallenge; idempotent: boolean }> {
  requirePlayer(session);
  const originMode = input.originMode ?? input.mode ?? "rescue";
  validateCheckpoint(input.checkpoint);
  if (!hasLegalMove(input.checkpoint.board))
    throw new MergeRelayError(
      422,
      "checkpoint_terminal",
      "A terminal board cannot become a challenge",
    );
  const now = dependencies.clock.now().toISOString();
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const existing = (
      await transaction.list(
        {
          recordType: "challenge",
          ownerSubject: session.subject,
          idempotencyKey: input.idempotencyKey,
          limit: 2,
        },
        parseChallengeArtifact,
      )
    ).items[0];
    if (existing) {
      const fingerprint = challengeFingerprint(input, originMode);
      if (existing.requestFingerprint !== fingerprint)
        throw new MergeRelayError(
          409,
          "idempotency_conflict",
          "The idempotency key is already attached to another challenge",
        );
      return { challenge: existing, idempotent: true };
    }
    if (input.parentChallengeId) {
      const parent = await transaction.read(
        { recordType: "challenge", recordId: input.parentChallengeId },
        parseChallengeArtifact,
      );
      if (!parent || parent.environment !== environment)
        throw new MergeRelayError(
          404,
          "parent_challenge_not_found",
          "Parent challenge was not found",
        );
    }
    const config = await transaction.read(
      { recordType: "config", direction: "desc" },
      parseConfigArtifact,
    );
    const activeConfig = requireActiveConfig(config, "rankedRelay");
    if (originMode === "daily") requireActiveConfig(activeConfig, "daily");
    if (originMode === "endless") requireActiveConfig(activeConfig, "endless");
    const daily = originMode === "daily" ? await readDailyReference(transaction, input) : null;
    if (!daily) validateChallengeContent(input, activeConfig);
    const configRevision = daily?.configRevision ?? activeConfig.revision;
    const checkpoint = daily
      ? bindDailyCheckpoint(input, daily)
      : bindCheckpointContent(
          {
            ...clone(input.checkpoint),
            maxLegalMoves: input.maxLegalMoves ?? MERGE_RELAY_MAX_MOVES,
          },
          input.contentId ?? input.checkpoint.contentId,
          activeConfig,
        );
    await registerAliasArtifact(
      transaction,
      input.creatorAlias,
      session.subject,
      now,
      dependencies.idFactory,
    );
    const challenge: MergeChallenge = {
      challengeId: createId(dependencies.idFactory, "ch"),
      environment,
      ownerSubject: session.subject,
      creatorAlias: input.creatorAlias,
      mode: "rescue",
      originMode,
      configRevision,
      checkpoint,
      checkpointHash: checkpointHash(checkpoint),
      payloadHash: challengePayloadHash({
        checkpoint,
        configRevision,
        mode: "rescue",
        originMode,
        parentChallengeId: input.parentChallengeId ?? null,
      }),
      parentChallengeId: input.parentChallengeId ?? null,
      idempotencyKey: input.idempotencyKey,
      requestFingerprint: challengeFingerprint(input, originMode),
      status: "open",
      createdAt: now,
    };
    await transaction.put("challenge", challenge.challengeId, challenge, {
      ownerSubject: challenge.ownerSubject,
      idempotencyKey: challenge.idempotencyKey,
      parentRecordType: input.parentChallengeId ? "challenge" : null,
      parentRecordId: input.parentChallengeId ?? null,
    });
    const event = {
      eventId: createId(dependencies.idFactory, "evt"),
      idempotencyKey: `challenge:${challenge.challengeId}`,
      subject: session.subject,
      type: "challenge_created",
      artifactId: challenge.challengeId,
      payload: {},
      requestFingerprint: requestFingerprint({
        type: "challenge_created",
        challengeId: challenge.challengeId,
      }),
      createdAt: now,
    };
    await transaction.put("event", event.eventId, event, {
      ownerSubject: session.subject,
      idempotencyKey: event.idempotencyKey,
    });
    return { challenge, idempotent: false };
  });
}

async function readDailyReference(
  transaction: MergeRelayArtifactTransaction,
  input: CreateChallengeRequest,
): Promise<MergeDailyChallenge> {
  const contentId = input.contentId ?? input.checkpoint.contentId;
  const match = typeof contentId === "string" ? /^daily_(\d{8})$/.exec(contentId) : null;
  if (!match)
    throw new MergeRelayError(
      422,
      "daily_reference_required",
      "Daily challenges must reference a provisioned daily record",
    );
  const digits = match[1];
  const date = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  const daily = await transaction.read({ recordType: "daily", recordId: date }, parseDailyArtifact);
  if (!daily)
    throw new MergeRelayError(404, "daily_unavailable", "The daily challenge is not provisioned");
  if (
    (input.contentId !== undefined && input.contentId !== daily.checkpoint.contentId) ||
    (input.checkpoint.contentId !== undefined &&
      input.checkpoint.contentId !== daily.checkpoint.contentId)
  )
    throw new MergeRelayError(422, "daily_config_mismatch", "Daily content is not frozen");
  if (
    input.checkpoint.contentVersion !== undefined &&
    input.checkpoint.contentVersion !== daily.contentRevision
  )
    throw new MergeRelayError(422, "content_version_mismatch", "Daily content is not current");
  if (
    input.checkpoint.spawnTwoWeight !== undefined &&
    input.checkpoint.spawnTwoWeight !== daily.checkpoint.spawnTwoWeight
  )
    throw new MergeRelayError(422, "daily_config_mismatch", "Daily spawn rules are not frozen");
  if (
    input.checkpoint.spawnFourWeight !== undefined &&
    input.checkpoint.spawnFourWeight !== daily.checkpoint.spawnFourWeight
  )
    throw new MergeRelayError(422, "daily_config_mismatch", "Daily spawn rules are not frozen");
  return daily;
}

function bindDailyCheckpoint(input: CreateChallengeRequest, daily: MergeDailyChallenge) {
  return {
    ...clone(input.checkpoint),
    maxLegalMoves: input.maxLegalMoves ?? daily.maxLegalMoves,
    contentId: daily.checkpoint.contentId,
    contentVersion: daily.contentRevision,
    spawnTwoWeight: daily.checkpoint.spawnTwoWeight,
    spawnFourWeight: daily.checkpoint.spawnFourWeight,
  };
}
