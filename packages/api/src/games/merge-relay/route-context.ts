import type { Context, Hono } from "hono";
import type { JsonObject } from "../contracts";
import type { GameTokenVerifier } from "../tokens";
import type { MergeEnvironment, MergeSession } from "./contracts";
import { MERGE_RELAY_CONTRACT_VERSION } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";

interface MergeVariables {
  environment: MergeEnvironment;
  session: MergeSession;
}

export interface MergeRelayRouteDependencies extends MergeRelayServiceDependencies {
  tokenVerifier: GameTokenVerifier;
  issueGuestToken?: (environment: MergeEnvironment, subject: string) => Promise<string>;
}

export type MergeRoutes = Hono<{ Variables: MergeVariables }>;
export type MergeContext = Context<{ Variables: MergeVariables }>;

export function respond(c: MergeContext, data: unknown, status: 200 | 201 = 200) {
  return c.json({ contract_version: MERGE_RELAY_CONTRACT_VERSION, data }, status);
}

export function fail(
  c: MergeContext,
  status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 503,
  code: string,
  message: string,
): Response {
  return c.json(
    {
      contract_version: MERGE_RELAY_CONTRACT_VERSION,
      error: { code, message, diagnostic_id: "route" },
    },
    status,
  );
}

export async function readBody(c: MergeContext): Promise<JsonObject | null> {
  try {
    const value = await c.req.json<unknown>();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as JsonObject)
      : null;
  } catch {
    return null;
  }
}

export function isPublicPath(path: string, environment: string, method = "GET"): boolean {
  const suffix = path.split(`/${environment}/`)[1] ?? "";
  return (
    suffix === "guest" ||
    suffix === "guest/recover" ||
    (suffix === "config" && method === "GET") ||
    /^daily\/[^/]+$/.test(suffix) ||
    /^challenges\/[^/]+\/resolve$/.test(suffix)
  );
}
