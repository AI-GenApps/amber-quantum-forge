import { parseGuestArtifact } from "./artifact-parsers";
import type { MergePlayPurchaseAttestation } from "./commerce-contracts";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";

export async function assertAttestationAllowed(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  subject: string,
  attestation: MergePlayPurchaseAttestation,
): Promise<void> {
  if (environment === "production" && attestation.testPurchase === true)
    throw new MergeRelayError(
      422,
      "purchase_test_rejected",
      "Test purchases are not accepted in production",
    );
  const account = attestation.obfuscatedExternalAccountId;
  if (account === null || account === subject) return;
  if (account.startsWith("guest_")) {
    const guest = (
      await dependencies.store.readArtifacts(
        environment,
        { recordType: "guest", recordId: account, limit: 1 },
        parseGuestArtifact,
      )
    ).items[0];
    if (guest?.upgradedSubject === subject) return;
  }
  throw new MergeRelayError(
    403,
    "purchase_account_mismatch",
    "The purchase belongs to another account",
  );
}
