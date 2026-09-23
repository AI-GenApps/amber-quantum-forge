import { createHash } from "node:crypto";
import { parseConfigArtifact, parseEventArtifact } from "./artifact-parsers";
import { requirePlayer, requireRole } from "./authorization";
import type {
  ConfigRollbackRequest,
  ConfigUpdateRequest,
  EventRequest,
  MergeConfigRevision,
  MergeEnvironment,
  MergeSession,
} from "./contracts";
import { MERGE_RELAY_CONTENT_VERSION, MERGE_RELAY_RULE_VERSION } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { requestFingerprint } from "./fingerprint";

export { getDaily, provisionDaily } from "./daily-service";
export { grantReward } from "./reward-service";
export { getSave, putSave, putSaveWithReceipt } from "./save-service";
export { recordSocial } from "./social-service";

export async function getConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): Promise<MergeConfigRevision> {
  const configs = await dependencies.store.readArtifacts(
    environment,
    { recordType: "config", direction: "desc", limit: 1 },
    parseConfigArtifact,
  );
  const config = configs.items[0];
  if (!config)
    throw new MergeRelayError(503, "config_unavailable", "Relay configuration is unavailable");
  return config;
}

export async function provisionInitialConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
): Promise<MergeConfigRevision> {
  if (session.role !== "game_admin" && session.role !== "service")
    throw new MergeRelayError(
      403,
      "config_bootstrap_role_required",
      "A game administrator or service role is required",
    );
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const existing = await transaction.read(
      { recordType: "config", direction: "desc" },
      parseConfigArtifact,
    );
    if (existing) return existing;
    const initial: MergeConfigRevision = {
      revision: 1,
      rulesVersion: MERGE_RELAY_RULE_VERSION,
      contentRevision: MERGE_RELAY_CONTENT_VERSION,
      spawnTwoWeight: 90,
      spawnFourWeight: 10,
      features: {
        daily: true,
        endless: true,
        rankedRelay: false,
        rewardedAds: false,
        cosmetics: false,
      },
      active: true,
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("config", String(initial.revision), initial);
    return initial;
  });
}

export async function updateConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: ConfigUpdateRequest,
): Promise<MergeConfigRevision> {
  requireRole(session, "game_admin");
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read(
      { recordType: "config", direction: "desc" },
      parseConfigArtifact,
    );
    if (!current)
      throw new MergeRelayError(503, "config_unavailable", "Relay configuration is unavailable");
    if (current.revision !== input.expectedRevision)
      throw new MergeRelayError(
        409,
        "config_revision_conflict",
        "Configuration changed on another administrator",
      );
    await transaction.put("config", String(current.revision), { ...current, active: false });
    const next: MergeConfigRevision = {
      revision: current.revision + 1,
      rulesVersion: MERGE_RELAY_RULE_VERSION,
      contentRevision: input.contentRevision ?? MERGE_RELAY_CONTENT_VERSION,
      spawnTwoWeight: input.spawnTwoWeight,
      spawnFourWeight: input.spawnFourWeight,
      features: clone(input.features),
      active: true,
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("config", String(next.revision), next);
    return next;
  });
}

export async function rollbackConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: ConfigRollbackRequest,
): Promise<MergeConfigRevision> {
  requireRole(session, "game_admin");
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read(
      { recordType: "config", direction: "desc" },
      parseConfigArtifact,
    );
    const target = await transaction.read(
      { recordType: "config", recordId: String(input.targetRevision) },
      parseConfigArtifact,
    );
    if (!current)
      throw new MergeRelayError(503, "config_unavailable", "Relay configuration is unavailable");
    if (current.revision !== input.expectedRevision)
      throw new MergeRelayError(
        409,
        "config_revision_conflict",
        "Configuration changed on another administrator",
      );
    if (!target)
      throw new MergeRelayError(
        404,
        "config_revision_not_found",
        "Configuration revision was not found",
      );
    await transaction.put("config", String(current.revision), { ...current, active: false });
    const next: MergeConfigRevision = {
      ...clone(target),
      revision: current.revision + 1,
      active: true,
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("config", String(next.revision), next);
    return next;
  });
}

export async function recordEvent(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: EventRequest,
): Promise<MergeEventRecord> {
  requirePlayer(session);
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const existing = (
      await transaction.list(
        {
          recordType: "event",
          ownerSubject: session.subject,
          idempotencyKey: input.idempotencyKey,
          limit: 2,
        },
        parseEventArtifact,
      )
    ).items[0];
    if (existing) {
      const fingerprint = requestFingerprint(input);
      if (existing.requestFingerprint !== fingerprint)
        throw new MergeRelayError(
          409,
          "event_idempotency_conflict",
          "The idempotency key is attached to another event",
        );
      return existing;
    }
    const event: MergeEventRecord = {
      eventId: eventIdFor(environment, session.subject, input.idempotencyKey),
      idempotencyKey: input.idempotencyKey,
      subject: session.subject,
      type: input.type,
      artifactId: input.artifactId ?? null,
      payload: clone(input.payload),
      requestFingerprint: requestFingerprint(input),
      createdAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("event", event.eventId, event, {
      ownerSubject: session.subject,
      idempotencyKey: event.idempotencyKey,
    });
    return event;
  });
}

type MergeEventRecord = import("./contracts").MergeEvent;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function eventIdFor(
  environment: MergeEnvironment,
  subject: string,
  idempotencyKey: string,
): string {
  return `evt_${createHash("sha256").update(`${environment}\u0000${subject}\u0000${idempotencyKey}`).digest("hex")}`;
}
