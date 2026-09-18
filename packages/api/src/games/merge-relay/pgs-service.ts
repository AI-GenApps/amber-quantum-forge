import type { MergeRelayArtifactTransaction } from "./artifact-store";
import { requirePlayer } from "./authorization";
import type { MergeEnvironment, MergeResult, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredPgsRuntime } from "./dependencies";
import { MergeRelayError } from "./errors";
import type {
  MergePgsCredential,
  MergePgsIdentity,
  MergePgsOAuthCredential,
  MergePgsRuntime,
} from "./pgs-contracts";
import {
  MERGE_PGS_MAX_PROVIDER_SCORE,
  MERGE_PGS_PROVIDER,
  type MergePgsIdentityStatus,
} from "./pgs-contracts";
import { identityRecordId, readIdentityForSubject } from "./pgs-identity";
import { putPgsOutbox, reactivatePgsOutbox } from "./pgs-outbox";
import { parsePgsCredentialArtifact, parsePgsIdentityArtifact } from "./pgs-parsers";
import { clone, createId } from "./relay-utils";

export async function linkPgsIdentity(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  serverAuthCode: string,
): Promise<MergePgsIdentity> {
  requirePlayer(session);
  const runtime = requirePgsRuntime(dependencies, environment);
  if (!/^[A-Za-z0-9._~+/=-]{1,4096}$/.test(serverAuthCode))
    throw new MergeRelayError(422, "invalid_pgs_auth_code", "The provider auth code is invalid");
  let oauth: MergePgsOAuthCredential;
  let playerId: string;
  try {
    oauth = await runtime.provider.exchangeServerAuthCode({
      environment,
      applicationId: runtime.config.applicationId,
      serverAuthCode,
    });
    ({ playerId } = await runtime.provider.verifyPlayer({
      accessToken: oauth.accessToken,
      applicationId: runtime.config.applicationId,
    }));
  } catch {
    throw new MergeRelayError(
      503,
      "pgs_identity_unavailable",
      "Google Play Games identity is unavailable",
    );
  }
  if (!/^[A-Za-z0-9._:-]{1,256}$/.test(playerId))
    throw new MergeRelayError(503, "pgs_identity_invalid", "Google Play Games identity is invalid");
  const now = dependencies.clock.now().toISOString();
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const preferredIdentityId = identityRecordId(session.subject);
    const preferred = await transaction.read(
      { recordType: "pgs_identity", recordId: preferredIdentityId },
      parsePgsIdentityArtifact,
    );
    const ownedIdentities = await transaction.list(
      { recordType: "pgs_identity", ownerSubject: session.subject, limit: 100 },
      parsePgsIdentityArtifact,
    );
    const existing = preferred ?? ownedIdentities.items.find((item) => item.playerId === playerId);
    if (!existing && ownedIdentities.items.length > 0)
      throw new MergeRelayError(
        409,
        "pgs_identity_conflict",
        "A different Google Play Games profile is already linked",
      );
    const identityId = existing?.identityId ?? preferredIdentityId;
    const existingCredential = existing
      ? await transaction.read(
          { recordType: "pgs_credential", recordId: existing.credentialId },
          parsePgsCredentialArtifact,
        )
      : null;
    if (existing && existing.playerId !== playerId)
      throw new MergeRelayError(
        409,
        "pgs_identity_conflict",
        "A different Google Play Games profile is already linked",
      );
    const linked = await transaction.list(
      { recordType: "pgs_identity", lookupKey: playerId, limit: 2 },
      parsePgsIdentityArtifact,
    );
    if (linked.items.some((item) => item.subject !== session.subject))
      throw new MergeRelayError(
        409,
        "pgs_identity_already_linked",
        "The Google Play Games profile is already linked",
      );
    const refreshToken = oauth.refreshToken ?? preservedRefreshToken(runtime, existingCredential);
    const credentialId = existing?.credentialId ?? createId(dependencies.idFactory, "pgs_cred");
    const principalSubject = existingCredential?.principalSubject ?? session.subject;
    const sealed = runtime.vault.seal({
      environment,
      principalSubject,
      playerId,
      credential: { ...oauth, refreshToken },
    });
    const credential: MergePgsCredential = {
      credentialId,
      environment,
      subject: session.subject,
      principalSubject,
      provider: MERGE_PGS_PROVIDER,
      playerId,
      version: 1,
      ...sealed,
      accessTokenExpiresAt: oauth.accessTokenExpiresAt,
      scopes: clone(oauth.scopes),
      hasRefreshToken: refreshToken !== null,
      createdAt: existingCredential?.createdAt ?? now,
      updatedAt: now,
    };
    const identity: MergePgsIdentity = {
      identityId,
      environment,
      subject: session.subject,
      provider: MERGE_PGS_PROVIDER,
      playerId,
      credentialId,
      status: "active",
      verifiedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await transaction.put("pgs_credential", credentialId, credential, {
      ownerSubject: session.subject,
      lookupKey: playerId,
    });
    await transaction.put("pgs_identity", identityId, identity, {
      ownerSubject: session.subject,
      lookupKey: playerId,
    });
    await reactivatePgsOutbox(transaction, session.subject, identity, credential, now);
    return identity;
  });
}

export async function getPgsIdentityStatus(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
): Promise<MergePgsIdentityStatus> {
  requirePlayer(session);
  const identity = await readIdentityForSubject(dependencies, environment, session.subject, "any");
  return {
    provider: MERGE_PGS_PROVIDER,
    configured: configuredPgsRuntime(dependencies, environment) !== null,
    status: identity?.status ?? "unlinked",
  };
}

export async function enqueuePgsResult(
  transaction: MergeRelayArtifactTransaction,
  dependencies: MergeRelayServiceDependencies,
  result: MergeResult,
): Promise<void> {
  const runtime = configuredPgsRuntime(dependencies, result.environment);
  if (!runtime) return;
  const identity = await readIdentityForSubject(
    transaction,
    result.environment,
    result.recipientSubject,
  );
  const credential = identity
    ? await transaction.read(
        { recordType: "pgs_credential", recordId: identity.credentialId },
        parsePgsCredentialArtifact,
      )
    : null;
  const linked =
    identity &&
    credential &&
    identity.environment === result.environment &&
    identity.subject === result.recipientSubject &&
    credential.environment === result.environment &&
    credential.subject === result.recipientSubject &&
    credential.playerId === identity.playerId &&
    credential.credentialId === identity.credentialId
      ? { identity, credential }
      : null;
  const status = linked?.identity.status === "active" ? "pending" : "disabled";
  const disabledReason = linked
    ? linked.identity.status === "active"
      ? null
      : "identity_unlinked"
    : "identity_unlinked";
  const now = dependencies.clock.now().toISOString();
  for (const targetKey of achievementKeys(result))
    await putPgsOutbox(transaction, result, {
      kind: "achievement",
      targetKey,
      targetId: runtime.config.achievementTargets[targetKey] ?? null,
      cohortHash: null,
      scoreDelta: null,
      maxTile: null,
      providerScore: null,
      status: runtime.config.achievementTargets[targetKey] ? status : "disabled",
      disabledReason: runtime.config.achievementTargets[targetKey]
        ? disabledReason
        : "target_unconfigured",
      identity: linked?.identity ?? null,
      credential: linked?.credential ?? null,
      now,
    });
  const target = runtime.config.leaderboardTarget;
  const comparableScore =
    target && target.cohortHash === result.challengePayloadHash
      ? providerScore(result, target.maxTileBound)
      : null;
  if (result.originMode === "daily")
    await putPgsOutbox(transaction, result, {
      kind: "leaderboard",
      targetKey: "daily_score_delta_tile",
      targetId: target?.leaderboardId ?? null,
      cohortHash: target?.cohortHash ?? null,
      scoreDelta: result.scoreDelta,
      maxTile: result.maxTile,
      providerScore: comparableScore,
      status: comparableScore === null ? "disabled" : status,
      disabledReason:
        comparableScore === null
          ? target
            ? "not_comparable"
            : "target_unconfigured"
          : disabledReason,
      identity: linked?.identity ?? null,
      credential: linked?.credential ?? null,
      now,
    });
}

function requirePgsRuntime(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): MergePgsRuntime {
  const runtime = configuredPgsRuntime(dependencies, environment);
  if (!runtime)
    throw new MergeRelayError(503, "pgs_unconfigured", "Google Play Games is not configured");
  return runtime;
}

function achievementKeys(result: MergeResult): string[] {
  const keys = ["relay_result"];
  if (result.outcome === "terminal") keys.push("relay_terminal");
  if (result.originMode === "daily") keys.push("relay_daily");
  if (result.maxTile >= 128) keys.push("relay_tile_128");
  return keys;
}

function providerScore(result: MergeResult, maxTileBound: number): number | null {
  if (
    !Number.isSafeInteger(maxTileBound) ||
    maxTileBound < 1 ||
    maxTileBound > 1_000_000 ||
    result.maxTile < 0 ||
    result.maxTile > maxTileBound
  )
    return null;
  const score = result.scoreDelta * (maxTileBound + 1) + result.maxTile;
  return Number.isSafeInteger(score) && score <= MERGE_PGS_MAX_PROVIDER_SCORE ? score : null;
}

function preservedRefreshToken(
  runtime: MergePgsRuntime,
  credential: MergePgsCredential | null,
): string | null {
  if (!credential?.hasRefreshToken) return null;
  try {
    return runtime.vault.open({ record: credential }).refreshToken;
  } catch {
    return null;
  }
}
