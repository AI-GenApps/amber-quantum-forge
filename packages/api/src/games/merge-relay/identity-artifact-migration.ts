import {
  parseAliasArtifact,
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseEventArtifact,
  parseResultArtifact,
  parseRewardArtifact,
  parseSaveArtifact,
  parseSocialArtifact,
} from "./artifact-parsers";
import {
  artifactRecordId,
  type MergeRelayArtifactFilter,
  type MergeRelayArtifactTransaction,
} from "./artifact-store";
import type { MergeChallenge, MergeSocialRecord } from "./contracts";
import { MergeRelayError } from "./errors";
import {
  parsePgsCredentialArtifact,
  parsePgsIdentityArtifact,
  parsePgsOutboxArtifact,
} from "./pgs-parsers";

export async function saveIdsForSubject(
  transaction: MergeRelayArtifactTransaction,
  subject: string,
): Promise<Set<string>> {
  const saves = await listAll(
    transaction,
    { recordType: "save", ownerSubject: subject },
    parseSaveArtifact,
  );
  return new Set(saves.map((save) => save.saveId));
}

export async function migrateGuestArtifacts(
  transaction: MergeRelayArtifactTransaction,
  guestSubject: string,
  accountSubject: string,
  updatedAt: string,
): Promise<void> {
  const challenges = await listAll(
    transaction,
    { recordType: "challenge", ownerSubject: guestSubject },
    parseChallengeArtifact,
  );
  for (const challenge of challenges)
    await putChallenge(transaction, { ...challenge, ownerSubject: accountSubject });

  const attempts = await listAll(
    transaction,
    { recordType: "attempt", ownerSubject: guestSubject },
    parseAttemptArtifact,
  );
  for (const attempt of attempts)
    await transaction.put(
      "attempt",
      attempt.attemptId,
      { ...attempt, recipientSubject: accountSubject },
      {
        ownerSubject: accountSubject,
        challengeId: attempt.challengeId,
        parentRecordType: "challenge",
        parentRecordId: attempt.challengeId,
      },
    );

  const results = await listAll(
    transaction,
    { recordType: "result", ownerSubject: guestSubject },
    parseResultArtifact,
  );
  for (const result of results)
    await transaction.put(
      "result",
      result.resultId,
      { ...result, recipientSubject: accountSubject },
      {
        ownerSubject: accountSubject,
        challengeId: result.challengeId,
        idempotencyKey: result.idempotencyKey,
        parentRecordType: "attempt",
        parentRecordId: result.attemptId,
      },
    );

  const saves = await listAll(
    transaction,
    { recordType: "save", ownerSubject: guestSubject },
    parseSaveArtifact,
  );
  for (const save of saves) {
    await transaction.remove("save", artifactRecordId(guestSubject, save.saveId));
    await transaction.put(
      "save",
      artifactRecordId(accountSubject, save.saveId),
      {
        ...save,
        subject: accountSubject,
      },
      { ownerSubject: accountSubject },
    );
  }

  const events = await listAll(
    transaction,
    { recordType: "event", ownerSubject: guestSubject },
    parseEventArtifact,
  );
  for (const event of events)
    await transaction.put(
      "event",
      event.eventId,
      { ...event, subject: accountSubject },
      {
        ownerSubject: accountSubject,
        idempotencyKey: event.idempotencyKey,
      },
    );

  const social = await listAll(
    transaction,
    { recordType: "social", ownerSubject: guestSubject },
    parseSocialArtifact,
  );
  for (const record of social) await putSocial(transaction, { ...record, subject: accountSubject });

  const incomingSocial = await listAll(
    transaction,
    { recordType: "social", targetSubject: guestSubject },
    parseSocialArtifact,
  );
  for (const record of incomingSocial)
    await putSocial(transaction, { ...record, targetSubject: accountSubject });

  const rewards = await listAll(
    transaction,
    { recordType: "reward", ownerSubject: guestSubject },
    parseRewardArtifact,
  );
  for (const reward of rewards)
    await transaction.put(
      "reward",
      reward.rewardId,
      { ...reward, subject: accountSubject },
      {
        ownerSubject: accountSubject,
        resultId: reward.resultId,
        idempotencyKey: reward.providerTransactionId,
        parentRecordType: "result",
        parentRecordId: reward.resultId,
      },
    );

  const aliases = await listAll(
    transaction,
    { recordType: "alias", ownerSubject: guestSubject },
    parseAliasArtifact,
  );
  for (const alias of aliases)
    await transaction.put(
      "alias",
      alias.aliasId,
      { ...alias, subject: accountSubject },
      {
        ownerSubject: accountSubject,
        alias: alias.alias,
      },
    );

  await migratePgsArtifacts(transaction, guestSubject, accountSubject, updatedAt);
}

async function migratePgsArtifacts(
  transaction: MergeRelayArtifactTransaction,
  guestSubject: string,
  accountSubject: string,
  updatedAt: string,
): Promise<void> {
  const identities = await listAll(
    transaction,
    { recordType: "pgs_identity", ownerSubject: guestSubject },
    parsePgsIdentityArtifact,
  );
  const accountIdentities = await listAll(
    transaction,
    { recordType: "pgs_identity", ownerSubject: accountSubject },
    parsePgsIdentityArtifact,
  );
  const outbox = await listAll(
    transaction,
    { recordType: "pgs_outbox", ownerSubject: guestSubject },
    parsePgsOutboxArtifact,
  );
  for (const identity of identities) {
    if (accountIdentities.some((item) => item.identityId !== identity.identityId))
      throw new MergeRelayError(
        409,
        "pgs_upgrade_conflict",
        "Account already owns a Google Play Games profile",
      );
    if (identity.subject !== guestSubject)
      throw new MergeRelayError(
        409,
        "pgs_upgrade_requires_reauthorization",
        "Reauthorize Google Play Games before upgrading this guest",
      );
    const credential = await transaction.read(
      { recordType: "pgs_credential", recordId: identity.credentialId },
      parsePgsCredentialArtifact,
    );
    if (
      !credential ||
      credential.subject !== guestSubject ||
      credential.principalSubject !== guestSubject
    )
      throw new MergeRelayError(
        409,
        "pgs_upgrade_requires_reauthorization",
        "Reauthorize Google Play Games before upgrading this guest",
      );
    await transaction.put(
      "pgs_credential",
      credential.credentialId,
      { ...credential, subject: accountSubject, updatedAt },
      { ownerSubject: accountSubject, lookupKey: credential.playerId },
    );
    await transaction.put(
      "pgs_identity",
      identity.identityId,
      { ...identity, subject: accountSubject, updatedAt },
      { ownerSubject: accountSubject, lookupKey: identity.playerId },
    );
    for (const item of outbox) {
      if (item.identityId !== identity.identityId) continue;
      await transaction.put(
        "pgs_outbox",
        item.outboxId,
        {
          ...item,
          subject: accountSubject,
          identityId: identity.identityId,
          credentialId: credential.credentialId,
        },
        {
          ownerSubject: accountSubject,
          resultId: item.resultId,
          idempotencyKey: item.idempotencyKey,
          parentRecordType: "result",
          parentRecordId: item.resultId,
        },
      );
    }
  }
}

async function putChallenge(
  transaction: MergeRelayArtifactTransaction,
  challenge: MergeChallenge,
): Promise<void> {
  await transaction.put("challenge", challenge.challengeId, challenge, {
    ownerSubject: challenge.ownerSubject,
    idempotencyKey: challenge.idempotencyKey,
    parentRecordType: challenge.parentChallengeId ? "challenge" : null,
    parentRecordId: challenge.parentChallengeId,
  });
}

async function putSocial(
  transaction: MergeRelayArtifactTransaction,
  record: MergeSocialRecord,
): Promise<void> {
  await transaction.put("social", record.recordId, record, {
    ownerSubject: record.subject,
    targetSubject: record.targetSubject,
  });
}

async function listAll<T>(
  transaction: MergeRelayArtifactTransaction,
  filter: Omit<MergeRelayArtifactFilter, "limit" | "afterRecordId">,
  parse: (payload: unknown) => T,
): Promise<T[]> {
  const items: T[] = [];
  let afterRecordId: string | undefined;
  do {
    const page = await transaction.list(
      { ...filter, limit: 100, ...(afterRecordId === undefined ? {} : { afterRecordId }) },
      parse,
    );
    items.push(...page.items);
    afterRecordId = page.nextCursor ?? undefined;
  } while (afterRecordId !== undefined);
  return items;
}
