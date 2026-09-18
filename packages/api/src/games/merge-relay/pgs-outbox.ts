import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeResult } from "./contracts";
import { requestFingerprint } from "./fingerprint";
import type { MergePgsCredential, MergePgsIdentity, MergePgsOutbox } from "./pgs-contracts";
import { MERGE_PGS_PROVIDER } from "./pgs-contracts";
import { parsePgsOutboxArtifact } from "./pgs-parsers";

export async function reactivatePgsOutbox(
  transaction: MergeRelayArtifactTransaction,
  subject: string,
  identity: MergePgsIdentity,
  credential: MergePgsCredential,
  now: string,
): Promise<void> {
  let afterRecordId: string | undefined;
  do {
    const page = await transaction.list(
      {
        recordType: "pgs_outbox",
        ownerSubject: subject,
        limit: 100,
        ...(afterRecordId === undefined ? {} : { afterRecordId }),
      },
      parsePgsOutboxArtifact,
    );
    for (const item of page.items) {
      if (item.status !== "disabled" && item.status !== "reauthorization_required") continue;
      if (!item.targetId || item.disabledReason === "target_unconfigured") continue;
      await transaction.put(
        "pgs_outbox",
        item.outboxId,
        {
          ...item,
          identityId: identity.identityId,
          identityUpdatedAt: identity.updatedAt,
          credentialId: credential.credentialId,
          playerId: identity.playerId,
          status: "pending",
          disabledReason: null,
          lastErrorCode: null,
          nextAttemptAt: now,
          updatedAt: now,
        },
        {
          ownerSubject: subject,
          resultId: item.resultId,
          idempotencyKey: item.idempotencyKey,
          parentRecordType: "result",
          parentRecordId: item.resultId,
        },
      );
    }
    afterRecordId = page.nextCursor ?? undefined;
  } while (afterRecordId !== undefined);
}

export async function putPgsOutbox(
  transaction: MergeRelayArtifactTransaction,
  result: MergeResult,
  input: {
    kind: "achievement" | "leaderboard";
    targetKey: string;
    targetId: string | null;
    cohortHash: string | null;
    scoreDelta: number | null;
    maxTile: number | null;
    providerScore: number | null;
    status: MergePgsOutbox["status"];
    disabledReason: MergePgsOutbox["disabledReason"];
    identity: MergePgsIdentity | null;
    credential: MergePgsCredential | null;
    now: string;
  },
): Promise<void> {
  const outboxId = outboxRecordId(result.resultId, input.kind, input.targetKey);
  if (
    await transaction.read({ recordType: "pgs_outbox", recordId: outboxId }, parsePgsOutboxArtifact)
  )
    return;
  const record: MergePgsOutbox = {
    outboxId,
    environment: result.environment,
    subject: result.recipientSubject,
    provider: MERGE_PGS_PROVIDER,
    kind: input.kind,
    resultId: result.resultId,
    identityId: input.identity?.identityId ?? null,
    identityUpdatedAt: input.identity?.updatedAt ?? null,
    credentialId: input.credential?.credentialId ?? null,
    playerId: input.identity?.playerId ?? null,
    targetKey: input.targetKey,
    targetId: input.targetId,
    cohortHash: input.cohortHash,
    scoreDelta: input.scoreDelta,
    maxTile: input.maxTile,
    providerScore: input.providerScore,
    idempotencyKey: requestFingerprint({
      resultId: result.resultId,
      kind: input.kind,
      targetKey: input.targetKey,
    }),
    status: input.status,
    disabledReason: input.disabledReason,
    attemptCount: 0,
    leaseId: null,
    leaseExpiresAt: null,
    nextAttemptAt: input.now,
    lastErrorCode: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
  await transaction.put("pgs_outbox", outboxId, record, {
    ownerSubject: record.subject,
    resultId: record.resultId,
    idempotencyKey: record.idempotencyKey,
    parentRecordType: "result",
    parentRecordId: record.resultId,
  });
}

function outboxRecordId(resultId: string, kind: string, targetKey: string): string {
  return `pgs_outbox_${requestFingerprint({ resultId, kind, targetKey })}`;
}
