import { createHash } from "node:crypto";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import type { MergePgsIdentity } from "./pgs-contracts";
import { MERGE_PGS_PROVIDER } from "./pgs-contracts";
import { parsePgsIdentityArtifact } from "./pgs-parsers";

type IdentityStatusFilter = "active" | "any";

export function identityRecordId(subject: string): string {
  return `pgs_identity_${createHash("sha256")
    .update(JSON.stringify([subject, MERGE_PGS_PROVIDER]))
    .digest("hex")}`;
}

export async function readIdentityForSubject(
  source: MergeRelayServiceDependencies | MergeRelayArtifactTransaction,
  environment: MergeEnvironment,
  subject: string,
  statusFilter: IdentityStatusFilter = "active",
): Promise<MergePgsIdentity | null> {
  if ("store" in source) {
    return (
      (
        await source.store.readArtifacts(
          environment,
          { recordType: "pgs_identity", ownerSubject: subject, limit: 100 },
          parsePgsIdentityArtifact,
        )
      ).items.find((item) => statusFilter === "any" || item.status === "active") ?? null
    );
  }
  const preferred = await source.read(
    { recordType: "pgs_identity", recordId: identityRecordId(subject) },
    parsePgsIdentityArtifact,
  );
  if (preferred && (statusFilter === "any" || preferred.status === "active")) return preferred;
  return (
    (
      await source.list(
        { recordType: "pgs_identity", ownerSubject: subject, limit: 100 },
        parsePgsIdentityArtifact,
      )
    ).items.find((item) => statusFilter === "any" || item.status === "active") ?? null
  );
}
