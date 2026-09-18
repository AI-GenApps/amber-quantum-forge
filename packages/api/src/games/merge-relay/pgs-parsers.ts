import type { MergePgsCredential, MergePgsIdentity, MergePgsOutbox } from "./pgs-contracts";
import { MERGE_PGS_CREDENTIAL_VERSION, MERGE_PGS_PROVIDER } from "./pgs-contracts";
import { asRecord, isEnvironment, isTimestamp } from "./state-validation-helpers";

export const parsePgsIdentityArtifact = (value: unknown): MergePgsIdentity =>
  parse(value, validateIdentity, "identity");
export const parsePgsCredentialArtifact = (value: unknown): MergePgsCredential =>
  parse(value, validateCredential, "credential");
export const parsePgsOutboxArtifact = (value: unknown): MergePgsOutbox =>
  parse(value, validateOutbox, "outbox");

function parse<T>(value: unknown, validate: (value: T) => void, kind: string): T {
  if (!asRecord(value)) throw new Error(`Merge Relay PGS ${kind} artifact is invalid`);
  const copy = JSON.parse(JSON.stringify(value)) as T;
  validate(copy);
  return copy;
}

function validateIdentity(value: MergePgsIdentity): void {
  if (
    !isPgsId(value.identityId) ||
    !isEnvironment(value.environment) ||
    !isPgsId(value.subject) ||
    value.provider !== MERGE_PGS_PROVIDER ||
    !isPgsId(value.playerId) ||
    !isPgsId(value.credentialId) ||
    !["active", "reauthorization_required", "revoked"].includes(value.status) ||
    !isTimestamp(value.verifiedAt) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay PGS identity is invalid");
}

function validateCredential(value: MergePgsCredential): void {
  if (
    !isPgsId(value.credentialId) ||
    !isEnvironment(value.environment) ||
    !isPgsId(value.subject) ||
    !isPgsId(value.principalSubject) ||
    value.provider !== MERGE_PGS_PROVIDER ||
    !isPgsId(value.playerId) ||
    value.version !== MERGE_PGS_CREDENTIAL_VERSION ||
    !isEncoded(value.ciphertext) ||
    !isEncoded(value.iv) ||
    !isEncoded(value.authTag) ||
    !isTimestamp(value.accessTokenExpiresAt) ||
    !Array.isArray(value.scopes) ||
    !value.scopes.every((scope) => typeof scope === "string" && scope.length <= 256) ||
    typeof value.hasRefreshToken !== "boolean" ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay PGS credential is invalid");
}

function validateOutbox(value: MergePgsOutbox): void {
  if (
    !isPgsId(value.outboxId) ||
    !isEnvironment(value.environment) ||
    !isPgsId(value.subject) ||
    value.provider !== MERGE_PGS_PROVIDER ||
    !["achievement", "leaderboard"].includes(value.kind) ||
    !isPgsId(value.resultId) ||
    (value.identityId !== null && !isPgsId(value.identityId)) ||
    (value.identityUpdatedAt !== undefined &&
      value.identityUpdatedAt !== null &&
      !isTimestamp(value.identityUpdatedAt)) ||
    (value.credentialId !== null && !isPgsId(value.credentialId)) ||
    (value.playerId !== null && !isPgsId(value.playerId)) ||
    !isPgsId(value.targetKey) ||
    (value.targetId !== null && !isPgsId(value.targetId)) ||
    (value.cohortHash !== null && !isPgsId(value.cohortHash)) ||
    !isSafeNumber(value.scoreDelta) ||
    !isSafeNumber(value.maxTile) ||
    !isSafeNumber(value.providerScore) ||
    !isPgsId(value.idempotencyKey) ||
    ![
      "pending",
      "leased",
      "retryable",
      "succeeded",
      "permanent_failure",
      "disabled",
      "reauthorization_required",
    ].includes(value.status) ||
    (value.disabledReason !== null &&
      !["pgs_unconfigured", "identity_unlinked", "target_unconfigured", "not_comparable"].includes(
        value.disabledReason,
      )) ||
    !Number.isSafeInteger(value.attemptCount) ||
    value.attemptCount < 0 ||
    (value.leaseId !== null && !isPgsId(value.leaseId)) ||
    (value.leaseExpiresAt !== null && !isTimestamp(value.leaseExpiresAt)) ||
    !isTimestamp(value.nextAttemptAt) ||
    (value.lastErrorCode !== null && !isPgsId(value.lastErrorCode)) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay PGS outbox is invalid");
}

function isPgsId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,256}$/.test(value);
}

function isEncoded(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9+/=_-]{1,4096}$/.test(value);
}

function isSafeNumber(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 0);
}
