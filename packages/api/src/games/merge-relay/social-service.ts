import { resolveAliasArtifact } from "./alias-artifact-service";
import { parseChallengeArtifact, parseSocialArtifact } from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import { requirePlayer } from "./authorization";
import type { MergeEnvironment, MergeSession, MergeSocialRecord, SocialRequest } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { createId } from "./relay-utils";

export async function recordSocial(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  action: "report" | "block",
  input: SocialRequest,
): Promise<MergeSocialRecord> {
  requirePlayer(session);
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const targetSubject = input.targetChallengeId
      ? await resolveChallengeCreator(transaction, input)
      : input.targetAlias
        ? await resolveAliasArtifact(transaction, input.targetAlias)
        : input.targetSubject;
    if (!targetSubject)
      throw new MergeRelayError(422, "target_required", "A target subject or alias is required");
    if (input.targetSubject && input.targetSubject !== targetSubject)
      throw new MergeRelayError(409, "target_identity_conflict", "Target identity does not match");
    const existing = (
      await transaction.list(
        {
          recordType: "social",
          ownerSubject: session.subject,
          targetSubject,
          limit: 100,
        },
        parseSocialArtifact,
      )
    ).items.find((candidate) => candidate.action === action && candidate.reason === input.reason);
    if (existing) return existing;
    const record: MergeSocialRecord = {
      recordId: createId(dependencies.idFactory, "social"),
      subject: session.subject,
      targetSubject,
      targetAlias: input.targetAlias ?? null,
      action,
      reason: input.reason,
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("social", record.recordId, record, {
      ownerSubject: record.subject,
      targetSubject: record.targetSubject,
    });
    return record;
  });
}

async function resolveChallengeCreator(
  transaction: MergeRelayArtifactTransaction,
  input: SocialRequest,
): Promise<string> {
  const challenge = await transaction.read(
    { recordType: "challenge", recordId: input.targetChallengeId ?? "" },
    parseChallengeArtifact,
  );
  if (!challenge)
    throw new MergeRelayError(404, "target_challenge_not_found", "Target challenge was not found");
  if (input.targetAlias && input.targetAlias !== challenge.creatorAlias)
    throw new MergeRelayError(409, "target_identity_conflict", "Target identity does not match");
  return challenge.ownerSubject;
}
