import { digest } from "./commerce-service-helpers";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayClock } from "./dependencies";
import type { MergeRelayStore } from "./store";

export const RATE_LIMIT_ACTIONS = [
  "guest_create",
  "guest_recover",
  "challenge_create",
  "event_post",
  "social_post",
  "attempt_reserve",
] as const;

export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[number];

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export type RateLimitRules = Record<RateLimitAction, RateLimitRule>;

export const DEFAULT_RATE_LIMIT_RULES: RateLimitRules = {
  guest_create: { limit: 20, windowSeconds: 3600 },
  guest_recover: { limit: 30, windowSeconds: 3600 },
  challenge_create: { limit: 30, windowSeconds: 3600 },
  event_post: { limit: 120, windowSeconds: 60 },
  social_post: { limit: 20, windowSeconds: 3600 },
  attempt_reserve: { limit: 60, windowSeconds: 3600 },
};

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitRequest {
  environment: MergeEnvironment;
  action: RateLimitAction;
  key: string;
  rule: RateLimitRule;
}

export interface MergeRateLimiter {
  consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}

export interface RateLimitRecord {
  recordId: string;
  action: RateLimitAction;
  keyDigest: string;
  windowStartMs: number;
  windowEndMs: number;
  count: number;
}

export function resolveRateLimitRules(overrides?: Partial<RateLimitRules>): RateLimitRules {
  const rules = { ...DEFAULT_RATE_LIMIT_RULES, ...overrides };
  for (const action of RATE_LIMIT_ACTIONS) {
    const { limit, windowSeconds } = rules[action];
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 1_000_000 ||
      !Number.isSafeInteger(windowSeconds) ||
      windowSeconds < 1 ||
      windowSeconds > 86_400
    )
      throw new Error(`Merge Relay rate limit for ${action} is invalid`);
  }
  return rules;
}

export function rateLimitRulesFromEnvironment(
  env: Record<string, string | undefined>,
): Partial<RateLimitRules> {
  const overrides: Partial<RateLimitRules> = {};
  for (const action of RATE_LIMIT_ACTIONS) {
    const raw = env[`MERGE_RELAY_RATE_LIMIT_${action.toUpperCase()}`];
    if (raw === undefined || raw === "") continue;
    const match = /^(\d+):(\d+)$/.exec(raw);
    if (!match) throw new Error(`Merge Relay rate limit for ${action} is invalid`);
    overrides[action] = { limit: Number(match[1]), windowSeconds: Number(match[2]) };
  }
  return overrides;
}

export function windowFor(nowMs: number, rule: RateLimitRule): { startMs: number; endMs: number } {
  const windowMs = rule.windowSeconds * 1000;
  const startMs = Math.floor(nowMs / windowMs) * windowMs;
  return { startMs, endMs: startMs + windowMs };
}

export function decide(count: number, rule: RateLimitRule, endMs: number, nowMs: number) {
  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((endMs - nowMs) / 1000)),
  };
}

export function rateLimitRecordId(action: RateLimitAction, key: string, startMs: number): string {
  return `rl_${digest(`${action}\u0000${key}`)}_${startMs}`;
}

export function parseRateLimitRecord(value: unknown): RateLimitRecord {
  if (typeof value !== "object" || value === null)
    throw new Error("Merge Relay rate limit artifact is invalid");
  const record = value as RateLimitRecord;
  if (
    typeof record.recordId !== "string" ||
    typeof record.keyDigest !== "string" ||
    !Number.isSafeInteger(record.count) ||
    !Number.isSafeInteger(record.windowEndMs)
  )
    throw new Error("Merge Relay rate limit artifact is invalid");
  return record;
}

export function createStoreRateLimiter(
  store: MergeRelayStore,
  clock: MergeRelayClock,
): MergeRateLimiter {
  return {
    async consume(request) {
      const nowMs = clock.now().getTime();
      const { startMs, endMs } = windowFor(nowMs, request.rule);
      const recordId = rateLimitRecordId(request.action, request.key, startMs);
      return store.transactArtifacts(request.environment, async (transaction) => {
        const current = await transaction.read(
          { recordType: "rate_limit", recordId },
          parseRateLimitRecord,
        );
        const count = (current?.count ?? 0) + 1;
        if (count > request.rule.limit) return decide(count, request.rule, endMs, nowMs);
        const record: RateLimitRecord = {
          recordId,
          action: request.action,
          keyDigest: digest(request.key),
          windowStartMs: startMs,
          windowEndMs: endMs,
          count,
        };
        await transaction.put("rate_limit", recordId, record);
        return decide(count, request.rule, endMs, nowMs);
      });
    },
  };
}

export class InMemoryRateLimiter implements MergeRateLimiter {
  private readonly counts = new Map<string, number>();

  constructor(private readonly clock: MergeRelayClock) {}

  async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
    const nowMs = this.clock.now().getTime();
    const { startMs, endMs } = windowFor(nowMs, request.rule);
    const id = `${request.environment}\u0000${rateLimitRecordId(request.action, request.key, startMs)}`;
    const count = (this.counts.get(id) ?? 0) + 1;
    if (count <= request.rule.limit) this.counts.set(id, count);
    return decide(count, request.rule, endMs, nowMs);
  }
}
