import { requireRole } from "./authorization";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredPgsRuntime } from "./dependencies";
import { MergeRelayError } from "./errors";
import {
  MERGE_PGS_MAX_ATTEMPTS,
  MERGE_PGS_MAX_BATCH,
  type MergePgsOutbox,
  type MergePgsProviderDelivery,
} from "./pgs-contracts";
import { deliverPgsOutbox, isReauthorization, providerCode } from "./pgs-dispatch-helpers";
import {
  accessTokenFor,
  finishLease,
  leaseOutbox,
  markReauthorization,
  readCredential,
  readIdentity,
} from "./pgs-dispatch-storage";
export interface MergePgsDispatchSummary {
  leased: number;
  succeeded: number;
  retryable: number;
  failed: number;
  disabled: number;
}

export async function dispatchPgsOutbox(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  requestedLimit: number,
): Promise<MergePgsDispatchSummary> {
  requireRole(session, "service");
  if (!configuredPgsRuntime(dependencies, environment))
    throw new MergeRelayError(503, "pgs_unconfigured", "Google Play Games is not configured");
  const limit = Math.min(Math.max(requestedLimit, 1), MERGE_PGS_MAX_BATCH);
  const leases = await leaseOutbox(dependencies, environment, limit);
  const summary: MergePgsDispatchSummary = {
    leased: leases.length,
    succeeded: 0,
    retryable: 0,
    failed: 0,
    disabled: 0,
  };
  const outcomes = await Promise.all(
    leases.map((lease) => dispatchLease(dependencies, environment, lease)),
  );
  for (const outcome of outcomes) {
    summary[outcome] += 1;
  }
  return summary;
}

async function dispatchLease(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  lease: MergePgsOutbox,
): Promise<"succeeded" | "retryable" | "failed" | "disabled"> {
  const runtime = configuredPgsRuntime(dependencies, environment);
  if (!runtime || !lease.targetId) {
    await finishLease(dependencies, environment, lease, "disabled", "target_unconfigured");
    return "disabled";
  }
  const identity = lease.identityId
    ? await readIdentity(dependencies, environment, lease.identityId)
    : null;
  const credential = lease.credentialId
    ? await readCredential(dependencies, environment, lease.credentialId)
    : null;
  if (
    !identity ||
    !credential ||
    identity.status !== "active" ||
    identity.environment !== environment ||
    identity.subject !== lease.subject ||
    credential.environment !== environment ||
    credential.subject !== lease.subject ||
    credential.playerId !== identity.playerId ||
    credential.credentialId !== identity.credentialId
  ) {
    await finishLease(dependencies, environment, lease, "disabled", "identity_unlinked");
    return "disabled";
  }
  let accessToken: string;
  try {
    accessToken = await accessTokenFor(dependencies, environment, identity, credential);
  } catch (error) {
    if (isReauthorization(error)) {
      await markReauthorization(dependencies, environment, lease, identity);
      return "failed";
    }
    const exhausted = lease.attemptCount >= MERGE_PGS_MAX_ATTEMPTS;
    await finishLease(
      dependencies,
      environment,
      lease,
      exhausted ? "permanent_failure" : "retryable",
      exhausted ? "retry_exhausted" : providerCode(error),
    );
    return exhausted ? "failed" : "retryable";
  }
  let delivery: MergePgsProviderDelivery;
  try {
    delivery = await deliverPgsOutbox(runtime, lease, accessToken, identity);
  } catch (error) {
    if (isReauthorization(error)) {
      await markReauthorization(dependencies, environment, lease, identity);
      return "failed";
    }
    await finishLease(dependencies, environment, lease, "retryable", providerCode(error));
    return "retryable";
  }
  if (delivery.status === "succeeded") {
    await finishLease(dependencies, environment, lease, "succeeded", null);
    return "succeeded";
  }
  if (delivery.errorCode === "reauthorization_required") {
    await markReauthorization(dependencies, environment, lease, identity);
    return "failed";
  }
  if (delivery.status === "retryable") {
    const exhausted = lease.attemptCount >= MERGE_PGS_MAX_ATTEMPTS;
    await finishLease(
      dependencies,
      environment,
      lease,
      exhausted ? "permanent_failure" : "retryable",
      exhausted ? "retry_exhausted" : delivery.errorCode,
    );
    return exhausted ? "failed" : "retryable";
  }
  await finishLease(dependencies, environment, lease, "permanent_failure", delivery.errorCode);
  return "failed";
}
