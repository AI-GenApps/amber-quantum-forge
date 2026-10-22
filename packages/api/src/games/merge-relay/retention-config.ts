export interface MergeRetentionPolicy {
  eventDays: number;
  inactiveAttemptDays: number;
  adSsvDays: number;
  deliveredOutboxDays: number;
  configRevisionsKeep: number;
  batchLimit: number;
  scanLimit: number;
}

export const DEFAULT_MERGE_RETENTION_POLICY: MergeRetentionPolicy = {
  eventDays: 90,
  inactiveAttemptDays: 30,
  adSsvDays: 90,
  deliveredOutboxDays: 30,
  configRevisionsKeep: 50,
  batchLimit: 500,
  scanLimit: 5000,
};

const MAX_DAYS = 3650;
const MAX_BATCH = 5000;
const MAX_SCAN = 100000;

const environmentKeys: Record<keyof MergeRetentionPolicy, string> = {
  eventDays: "MERGE_RELAY_RETENTION_EVENT_DAYS",
  inactiveAttemptDays: "MERGE_RELAY_RETENTION_INACTIVE_ATTEMPT_DAYS",
  adSsvDays: "MERGE_RELAY_RETENTION_AD_SSV_DAYS",
  deliveredOutboxDays: "MERGE_RELAY_RETENTION_DELIVERED_OUTBOX_DAYS",
  configRevisionsKeep: "MERGE_RELAY_RETENTION_CONFIG_REVISIONS_KEEP",
  batchLimit: "MERGE_RELAY_RETENTION_BATCH_LIMIT",
  scanLimit: "MERGE_RELAY_RETENTION_SCAN_LIMIT",
};

const upperBounds: Record<keyof MergeRetentionPolicy, number> = {
  eventDays: MAX_DAYS,
  inactiveAttemptDays: MAX_DAYS,
  adSsvDays: MAX_DAYS,
  deliveredOutboxDays: MAX_DAYS,
  configRevisionsKeep: 100000,
  batchLimit: MAX_BATCH,
  scanLimit: MAX_SCAN,
};

export function resolveRetentionPolicy(
  overrides: Partial<MergeRetentionPolicy> | undefined,
): MergeRetentionPolicy {
  const policy = { ...DEFAULT_MERGE_RETENTION_POLICY, ...overrides };
  for (const key of Object.keys(policy) as Array<keyof MergeRetentionPolicy>) {
    const value = policy[key];
    if (!Number.isSafeInteger(value) || value < 1 || value > upperBounds[key])
      throw new Error(`Merge Relay retention setting ${key} is invalid`);
  }
  return policy;
}

export function retentionPolicyFromEnvironment(
  env: Record<string, string | undefined>,
): Partial<MergeRetentionPolicy> {
  const overrides: Partial<MergeRetentionPolicy> = {};
  for (const key of Object.keys(environmentKeys) as Array<keyof MergeRetentionPolicy>) {
    const raw = env[environmentKeys[key]];
    if (raw === undefined || raw === "") continue;
    overrides[key] = Number(raw);
  }
  return overrides;
}
