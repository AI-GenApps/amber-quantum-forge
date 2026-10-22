import { requireRole } from "./authorization";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import {
  type CategoryContext,
  pruneAdSsv,
  pruneConfigRevisions,
  pruneDeliveredOutbox,
  pruneEvents,
  pruneInactiveAttempts,
} from "./retention-categories";
import { resolveRetentionPolicy } from "./retention-config";
import type { RetentionCategoryReport } from "./retention-scan";

export const RETENTION_CATEGORIES = [
  "events",
  "attempts",
  "ad_ssv",
  "pgs_outbox",
  "configs",
] as const;

export type RetentionCategory = (typeof RETENTION_CATEGORIES)[number];

export interface RetentionRequest {
  dryRun: boolean;
  cursors: Partial<Record<RetentionCategory, string>>;
}

export interface RetentionReport {
  dryRun: boolean;
  categories: Record<RetentionCategory, RetentionCategoryReport>;
}

const runners: Record<
  RetentionCategory,
  (context: CategoryContext) => Promise<RetentionCategoryReport>
> = {
  events: pruneEvents,
  attempts: pruneInactiveAttempts,
  ad_ssv: pruneAdSsv,
  pgs_outbox: pruneDeliveredOutbox,
  configs: pruneConfigRevisions,
};

export async function pruneRetention(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  request: RetentionRequest,
): Promise<RetentionReport> {
  requireRole(session, "service");
  const policy = resolveRetentionPolicy(dependencies.retention);
  const now = dependencies.clock.now();
  const categories = {} as Record<RetentionCategory, RetentionCategoryReport>;
  for (const category of RETENTION_CATEGORIES) {
    categories[category] = await dependencies.store.transactArtifacts(environment, (transaction) =>
      runners[category]({
        transaction,
        policy,
        now,
        dryRun: request.dryRun,
        cursor: request.cursors[category],
      }),
    );
  }
  return { dryRun: request.dryRun, categories };
}
