import { type RateLimitAction, resolveRateLimitRules } from "./rate-limit";
import type { MergeContext, MergeRelayRouteDependencies } from "./route-context";
import { fail } from "./route-context";

export function clientAddress(c: MergeContext): string {
  const forwarded = c.req.header("X-Forwarded-For")?.split(",")[0]?.trim();
  const candidate = forwarded || c.req.header("X-Real-IP")?.trim() || "";
  return /^[0-9a-fA-F:.]{2,64}$/.test(candidate) ? candidate : "unknown";
}

export async function rateLimited(
  c: MergeContext,
  dependencies: MergeRelayRouteDependencies,
  action: RateLimitAction,
  subject: string | null,
): Promise<Response | null> {
  const limiter = dependencies.rateLimiter;
  if (!limiter) return null;
  const rule = resolveRateLimitRules(dependencies.rateLimits)[action];
  const decision = await limiter.consume({
    environment: c.get("environment"),
    action,
    key: subject === null ? `ip:${clientAddress(c)}` : `subject:${subject}`,
    rule,
  });
  if (decision.allowed) return null;
  c.header("Retry-After", String(decision.retryAfterSeconds));
  return fail(c, 429, "rate_limited", "Too many requests, retry later");
}
