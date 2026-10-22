import type { JsonObject } from "../contracts";
import { pruneRetention, RETENTION_CATEGORIES, type RetentionRequest } from "./retention-service";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";

export function registerMaintenanceRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.post("/:environment/maintenance/prune", async (c) => {
    if (c.get("session").role !== "service")
      return fail(c, 403, "service_role_required", "A service role is required");
    const request = parseRetentionRequest(await readBody(c));
    if (!request) return fail(c, 422, "invalid_retention", "Retention payload is invalid");
    const report = await pruneRetention(
      dependencies,
      c.get("environment"),
      c.get("session"),
      request,
    );
    const categories: JsonObject = {};
    for (const category of RETENTION_CATEGORIES) {
      const value = report.categories[category];
      categories[category] = {
        scanned: value.scanned,
        deleted: value.deleted,
        next_cursor: value.nextCursor,
        skipped_reason: value.skippedReason,
      };
    }
    return respond(c, { prune: { dry_run: report.dryRun, categories } });
  });
}

function parseRetentionRequest(body: JsonObject | null): RetentionRequest | null {
  if (body === null) return null;
  const allowed = new Set(["dry_run", "cursors"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return null;
  const dryRun = body.dry_run ?? false;
  if (typeof dryRun !== "boolean") return null;
  const cursors: RetentionRequest["cursors"] = {};
  const raw = body.cursors ?? {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  for (const [key, value] of Object.entries(raw)) {
    const category = RETENTION_CATEGORIES.find((candidate) => candidate === key);
    if (!category || typeof value !== "string" || value.length < 1 || value.length > 512)
      return null;
    cursors[category] = value;
  }
  return { dryRun, cursors };
}
