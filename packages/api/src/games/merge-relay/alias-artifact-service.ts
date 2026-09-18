import { parseAliasArtifact } from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeAlias } from "./contracts";
import { MergeRelayError } from "./errors";
import { createId } from "./relay-utils";

export async function registerAliasArtifact(
  transaction: MergeRelayArtifactTransaction,
  alias: string,
  subject: string,
  now: string,
  idFactory?: (prefix: string) => string,
): Promise<MergeAlias> {
  const existing = (
    await transaction.list(
      { recordType: "alias", ownerSubject: subject, limit: 2 },
      parseAliasArtifact,
    )
  ).items[0];
  const record: MergeAlias = existing
    ? { ...existing, alias, updatedAt: now }
    : {
        aliasId: createId(idFactory, "alias"),
        alias,
        subject,
        createdAt: now,
        updatedAt: now,
      };
  await transaction.put("alias", record.aliasId, record, {
    ownerSubject: subject,
    alias,
  });
  return record;
}

export async function resolveAliasArtifact(
  transaction: MergeRelayArtifactTransaction,
  alias: string,
): Promise<string> {
  const matches = (
    await transaction.list({ recordType: "alias", alias, limit: 2 }, parseAliasArtifact)
  ).items;
  if (matches.length === 0)
    throw new MergeRelayError(404, "target_alias_not_found", "Target alias was not found");
  if (matches.length > 1)
    throw new MergeRelayError(409, "ambiguous_target_alias", "Target alias is ambiguous");
  return matches[0].subject;
}
