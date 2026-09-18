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
}

export function configuredPgsRuntime(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): MergePgsRuntime | null {
  return dependencies.pgsRuntimeForEnvironment
    ? dependencies.pgsRuntimeForEnvironment(environment)
    : (dependencies.pgsRuntime ?? null);
}
