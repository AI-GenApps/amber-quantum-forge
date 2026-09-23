import { createHash, randomBytes, randomUUID } from "node:crypto";
import { parseGuestArtifact } from "./artifact-parsers";
import { requirePlayer } from "./authorization";
import type {
  GuestRecoveryRequest,
  GuestUpgradeRequest,
  MergeEnvironment,
  MergeGuest,
  MergeSession,
} from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { migrateGuestArtifacts, saveIdsForSubject } from "./identity-artifact-migration";

export interface GuestCreation {
  guestId: string;
  subject: string;
  recoveryToken: string;
}

export interface GuestRecovery {
  guestId: string;
  subject: string;
  upgradedSubject: string | null;
}

export async function effectiveSubject(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  subject: string,
): Promise<string> {
  if (!subject.startsWith("guest_")) return subject;
  const guest = (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "guest", recordId: subject, limit: 1 },
      parseGuestArtifact,
    )
  ).items[0];
  return guest?.upgradedSubject ?? subject;
}

export async function createGuest(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): Promise<GuestCreation> {
  const recoveryToken = randomBytes(32).toString("base64url");
  const guestId = `guest_${randomUUID().replaceAll("-", "")}`;
  const guest: MergeGuest = {
    guestId,
    subject: guestId,
    recoveryTokenHash: hashRecoveryToken(recoveryToken),
    upgradedSubject: null,
    createdAt: dependencies.clock.now().toISOString(),
    upgradedAt: null,
  };
  await dependencies.store.transactArtifacts(environment, async (transaction) => {
    await transaction.put("guest", guest.guestId, guest, {
      ownerSubject: guest.subject,
      lookupKey: guest.recoveryTokenHash,
    });
  });
  return { guestId, subject: guest.subject, recoveryToken };
}

export async function recoverGuest(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  input: GuestRecoveryRequest,
): Promise<GuestRecovery> {
  const matches = await dependencies.store.readArtifacts(
    environment,
    { recordType: "guest", lookupKey: hashRecoveryToken(input.recoveryToken), limit: 2 },
    parseGuestArtifact,
  );
  const guest = matches.items[0];
  if (!guest)
    throw new MergeRelayError(
      404,
      "guest_recovery_not_found",
      "Guest recovery token was not found",
    );
  if (matches.items.length > 1)
    throw new MergeRelayError(503, "guest_recovery_ambiguous", "Guest recovery is ambiguous");
  return {
    guestId: guest.guestId,
    subject: guest.upgradedSubject ?? guest.subject,
    upgradedSubject: guest.upgradedSubject,
  };
}

export async function upgradeGuest(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: GuestUpgradeRequest,
): Promise<GuestRecovery> {
  requirePlayer(session);
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const matches = (
      await transaction.list(
        { recordType: "guest", lookupKey: hashRecoveryToken(input.recoveryToken), limit: 2 },
        parseGuestArtifact,
      )
    ).items;
    const guest = matches[0];
    if (!guest)
      throw new MergeRelayError(
        404,
        "guest_recovery_not_found",
        "Guest recovery token was not found",
      );
    if (matches.length > 1)
      throw new MergeRelayError(503, "guest_recovery_ambiguous", "Guest recovery is ambiguous");
    if (!guest.upgradedSubject && guest.subject === session.subject)
      throw new MergeRelayError(
        409,
        "guest_self_upgrade",
        "A guest identity cannot be upgraded to itself",
      );
    if (guest.upgradedSubject && guest.upgradedSubject !== session.subject)
      throw new MergeRelayError(
        409,
        "guest_already_upgraded",
        "Guest identity is already attached to another account",
      );
    if (guest.upgradedSubject === session.subject)
      return {
        guestId: guest.guestId,
        subject: session.subject,
        upgradedSubject: guest.upgradedSubject,
      };
    const guestSaves = await saveIdsForSubject(transaction, guest.subject);
    const accountSaves = await saveIdsForSubject(transaction, session.subject);
    if (Array.from(guestSaves).some((saveId) => accountSaves.has(saveId)))
      throw new MergeRelayError(
        409,
        "guest_upgrade_conflict",
        "Account already owns a save with the same ID",
      );
    const upgradedAt = dependencies.clock.now().toISOString();
    await migrateGuestArtifacts(transaction, guest.subject, session.subject, upgradedAt);
    const upgraded = {
      ...guest,
      upgradedSubject: session.subject,
      upgradedAt,
    };
    await transaction.put("guest", upgraded.guestId, upgraded, {
      ownerSubject: upgraded.subject,
      lookupKey: upgraded.recoveryTokenHash,
    });
    return {
      guestId: upgraded.guestId,
      subject: session.subject,
      upgradedSubject: upgraded.upgradedSubject,
    };
  });
}

function hashRecoveryToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
