import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredPgsRuntime } from "./dependencies";
import {
  MERGE_PGS_LEASE_SECONDS,
  MERGE_PGS_MAX_ATTEMPTS,
  type MergePgsCredential,
  type MergePgsIdentity,
  type MergePgsOutbox,
} from "./pgs-contracts";
import { metadata } from "./pgs-dispatch-helpers";
import {
  parsePgsCredentialArtifact,
  parsePgsIdentityArtifact,
  parsePgsOutboxArtifact,
} from "./pgs-parsers";
import { GooglePlayGamesProviderError } from "./pgs-provider";
import { createId } from "./relay-utils";

export async function leaseOutbox(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  limit: number,
): Promise<MergePgsOutbox[]> {
  const now = dependencies.clock.now();
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const leases: MergePgsOutbox[] = [];
    let afterRecordId: string | undefined;
    do {
      const page = await transaction.list(
        {
          recordType: "pgs_outbox",
          limit: 100,
          ...(afterRecordId === undefined ? {} : { afterRecordId }),
        },
        parsePgsOutboxArtifact,
      );
      for (const item of page.items) {
        if (leases.length >= limit) break;
        const expiredLease =
          item.status === "leased" &&
          item.leaseExpiresAt !== null &&
          new Date(item.leaseExpiresAt).getTime() <= now.getTime();
        if (item.status !== "pending" && item.status !== "retryable" && !expiredLease) continue;
        if (new Date(item.nextAttemptAt).getTime() > now.getTime()) continue;
        const lease: MergePgsOutbox = {
          ...item,
          status: "leased",
          leaseId: createId(dependencies.idFactory, "pgs_lease"),
          leaseExpiresAt: new Date(now.getTime() + MERGE_PGS_LEASE_SECONDS * 1000).toISOString(),
          attemptCount: item.attemptCount + 1,
          updatedAt: now.toISOString(),
        };
        await transaction.put("pgs_outbox", lease.outboxId, lease, metadata(lease));
        leases.push(lease);
      }
      if (leases.length >= limit) break;
      afterRecordId = page.nextCursor ?? undefined;
    } while (afterRecordId !== undefined);
    return leases;
  });
}

export async function accessTokenFor(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  identity: MergePgsIdentity,
  credential: MergePgsCredential,
): Promise<string> {
  const runtime = configuredPgsRuntime(dependencies, environment);
  if (!runtime) throw new GooglePlayGamesProviderError("pgs_unconfigured", false);
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  if (expiresAt > dependencies.clock.now().getTime() + 30_000)
    return runtime.vault.open({ record: credential }).accessToken;
  const stored = runtime.vault.open({ record: credential });
  if (!stored.refreshToken)
    throw new GooglePlayGamesProviderError("reauthorization_required", false);
  const refreshed = await runtime.provider.refreshAccessToken({
    refreshToken: stored.refreshToken,
    applicationId: runtime.config.applicationId,
  });
  const sealed = runtime.vault.seal({
    environment,
    principalSubject: credential.principalSubject,
    playerId: identity.playerId,
    credential: { ...stored, ...refreshed, refreshToken: stored.refreshToken },
  });
  const updated: MergePgsCredential = {
    ...credential,
    ...sealed,
    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
    scopes: [...refreshed.scopes],
    hasRefreshToken: true,
    updatedAt: dependencies.clock.now().toISOString(),
  };
  await dependencies.store.transactArtifacts(environment, async (transaction) => {
    await transaction.put("pgs_credential", credential.credentialId, updated, {
      ownerSubject: credential.subject,
      lookupKey: credential.playerId,
    });
  });
  return refreshed.accessToken;
}

export async function readIdentity(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  identityId: string,
): Promise<MergePgsIdentity | null> {
  return (
    (
      await dependencies.store.readArtifacts(
        environment,
        { recordType: "pgs_identity", recordId: identityId, limit: 1 },
        parsePgsIdentityArtifact,
      )
    ).items[0] ?? null
  );
}

export async function readCredential(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  credentialId: string,
): Promise<MergePgsCredential | null> {
  return (
    (
      await dependencies.store.readArtifacts(
        environment,
        { recordType: "pgs_credential", recordId: credentialId, limit: 1 },
        parsePgsCredentialArtifact,
      )
    ).items[0] ?? null
  );
}

export async function finishLease(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  lease: MergePgsOutbox,
  status: MergePgsOutbox["status"],
  errorCode: string | null,
): Promise<void> {
  await dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read(
      { recordType: "pgs_outbox", recordId: lease.outboxId },
      parsePgsOutboxArtifact,
    );
    if (!current || current.leaseId !== lease.leaseId) return;
    const retry = status === "retryable" && lease.attemptCount < MERGE_PGS_MAX_ATTEMPTS;
    const finalStatus = retry ? status : status === "retryable" ? "permanent_failure" : status;
    const now = dependencies.clock.now();
    const nextAttemptAt = retry
      ? new Date(
          now.getTime() + Math.min(3_600_000, 30_000 * 2 ** Math.min(6, lease.attemptCount)),
        ).toISOString()
      : current.nextAttemptAt;
    await transaction.put(
      "pgs_outbox",
      current.outboxId,
      {
        ...current,
        status: finalStatus,
        leaseId: null,
        leaseExpiresAt: null,
        disabledReason:
          status === "disabled" ? (errorCode as MergePgsOutbox["disabledReason"]) : null,
        lastErrorCode: retry ? errorCode : finalStatus === "permanent_failure" ? errorCode : null,
        nextAttemptAt,
        updatedAt: now.toISOString(),
      },
      metadata(current),
    );
  });
}

export async function markReauthorization(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  lease: MergePgsOutbox,
  identity: MergePgsIdentity,
): Promise<void> {
  await dependencies.store.transactArtifacts(environment, async (transaction) => {
    const now = dependencies.clock.now().toISOString();
    const current = await transaction.read(
      { recordType: "pgs_outbox", recordId: lease.outboxId },
      parsePgsOutboxArtifact,
    );
    if (
      !current ||
      current.leaseId !== lease.leaseId ||
      current.identityId !== lease.identityId ||
      current.credentialId !== lease.credentialId
    )
      return;
    const currentIdentity = await transaction.read(
      { recordType: "pgs_identity", recordId: identity.identityId },
      parsePgsIdentityArtifact,
    );
    const identityChanged =
      !currentIdentity ||
      (lease.identityUpdatedAt !== undefined &&
        lease.identityUpdatedAt !== null &&
        currentIdentity.updatedAt !== lease.identityUpdatedAt);
    if (identityChanged || currentIdentity === null || currentIdentity.status !== "active") {
      const nextStatus = currentIdentity?.status === "active" ? "pending" : "disabled";
      await transaction.put(
        "pgs_outbox",
        current.outboxId,
        {
          ...current,
          status: nextStatus,
          identityId: currentIdentity?.identityId ?? current.identityId,
          identityUpdatedAt: currentIdentity?.updatedAt ?? current.identityUpdatedAt,
          credentialId: currentIdentity?.credentialId ?? current.credentialId,
          playerId: currentIdentity?.playerId ?? current.playerId,
          leaseId: null,
          leaseExpiresAt: null,
          disabledReason: nextStatus === "disabled" ? "identity_unlinked" : null,
          lastErrorCode: identityChanged ? "identity_changed" : "identity_unlinked",
          nextAttemptAt: now,
          updatedAt: now,
        },
        metadata(current),
      );
      return;
    }
    await transaction.put(
      "pgs_identity",
      identity.identityId,
      { ...currentIdentity, status: "reauthorization_required", updatedAt: now },
      { ownerSubject: identity.subject, lookupKey: identity.playerId },
    );
    await transaction.put(
      "pgs_outbox",
      current.outboxId,
      {
        ...current,
        status: "reauthorization_required",
        leaseId: null,
        leaseExpiresAt: null,
        disabledReason: "identity_unlinked",
        lastErrorCode: "reauthorization_required",
        updatedAt: now,
      },
      metadata(current),
    );
  });
}
