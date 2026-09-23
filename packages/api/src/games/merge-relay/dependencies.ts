import type { MergeCommerceRuntime } from "./commerce-contracts";
import type { MergeEnvironment } from "./contracts";
import type { MergePgsRuntime } from "./pgs-contracts";
import type { MergeRewardProvider } from "./provider";
import type { MergeRelayStore } from "./store";

export interface MergeRelayClock {
  now(): Date;
}

export const systemMergeRelayClock: MergeRelayClock = {
  now: () => new Date(),
};

export interface MergeRelayServiceDependencies {
  store: MergeRelayStore;
  clock: MergeRelayClock;
  rewardProvider: MergeRewardProvider | null;
  idFactory?: (prefix: string) => string;
  pgsRuntime?: MergePgsRuntime | null;
  pgsRuntimeForEnvironment?: (environment: MergeEnvironment) => MergePgsRuntime | null;
  commerceRuntimeForEnvironment?: (environment: MergeEnvironment) => MergeCommerceRuntime | null;
}

export function configuredPgsRuntime(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): MergePgsRuntime | null {
  return dependencies.pgsRuntimeForEnvironment
    ? dependencies.pgsRuntimeForEnvironment(environment)
    : (dependencies.pgsRuntime ?? null);
}

export function configuredCommerceRuntime(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): MergeCommerceRuntime | null {
  return dependencies.commerceRuntimeForEnvironment?.(environment) ?? null;
}
