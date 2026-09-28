/// Vercel Cron sweeper routes (task 19): `GET/POST
/// /games/ludo/cron/sweep-timeouts`, mounted the same way the rest of
/// `packages/api` reaches `apps/web/app/api/[...route]/route.ts` (see
/// `packages/api/src/index.ts`). Backstop only — the lazy per-request check
/// in `service.ts` is the primary enforcement mechanism, since Vercel Cron's
/// tightest schedule (`* * * * *`, every minute — see `apps/web/vercel.json`)
/// means a match nobody is polling can sit past its deadline for up to ~60s
/// before this sweeper catches it.
///
/// Auth: Vercel Cron invocations carry `Authorization: Bearer
/// <CRON_SECRET>` (the documented mechanism as of this writing — see
/// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
/// The route fails closed (401) whenever `CRON_SECRET` is unset or the
/// header does not match it, so a misconfigured deployment can never be
/// swept by an unauthenticated caller.
import type { Context } from "hono";
import { Hono } from "hono";
import { GAME_ENVIRONMENTS } from "../contracts";
import { resolveMatchViewPublisher } from "./dependencies";
import type { LudoEconomyStore } from "./economy-store";
import { InMemoryLudoEconomyStore } from "./economy-store";
import type { MatchViewPublisher } from "./match-view-publisher";
import { NullMatchViewPublisher } from "./match-view-publisher";
import { sweepMatchmaking } from "./matchmaking-service";
import { sweepExpiredRooms } from "./room-service";
import { configuredLudoEconomyStore, configuredLudoStore } from "./routes";
import { sweepTimeouts } from "./service";
import type { LudoStore } from "./store";

export interface LudoCronRouteDependencies {
  store: LudoStore;
  /** `process.env.CRON_SECRET`; a missing value fails every request closed. */
  cronSecret: string | undefined;
  /** Task 22's realtime fanout; falls back to a no-op publisher when omitted. */
  matchViewPublisher?: MatchViewPublisher;
  /** Task 26c: required so a swept-timeout coin-stake match's escrow gets
   * refunded instead of left `held` forever. Falls back to a fresh
   * in-memory store (matching every other Ludo route dependency default)
   * when omitted. */
  economyStore?: LudoEconomyStore;
}

function isAuthorized(c: Context, cronSecret: string | undefined): boolean {
  if (!cronSecret) return false;
  const header = c.req.header("Authorization");
  return header === `Bearer ${cronSecret}`;
}

export function createLudoCronRoutes(dependencies: LudoCronRouteDependencies): Hono {
  const routes = new Hono();
  const matchViewPublisher = dependencies.matchViewPublisher ?? new NullMatchViewPublisher();
  const economyStore = dependencies.economyStore ?? new InMemoryLudoEconomyStore();

  const sweep = async (c: Context) => {
    if (!isAuthorized(c, dependencies.cronSecret)) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const swept: Record<string, number> = {};
    const matchmaking: Record<string, { matched: number; botFilled: number }> = {};
    const rooms: Record<string, { expired: number }> = {};
    for (const environment of GAME_ENVIRONMENTS) {
      swept[environment] = await sweepTimeouts(dependencies.store, environment, undefined, {
        matchViewPublisher,
        economyStore,
      });
      // Task 20: the same Cron cadence also scans matchmaking tickets,
      // bounded the same way as the timeout sweep above.
      matchmaking[environment] = await sweepMatchmaking(
        dependencies.store,
        environment,
        undefined,
        {
          matchViewPublisher,
        },
      );
      // Task 21: and expired, never-filled private rooms, also bounded per
      // invocation the same way (no fanout: a swept room's underlying match,
      // if any, is untouched — only never-filled rooms are removed).
      rooms[environment] = await sweepExpiredRooms(dependencies.store, environment);
    }
    return c.json({ swept, matchmaking, rooms }, 200);
  };

  routes.get("/sweep-timeouts", sweep);
  routes.post("/sweep-timeouts", sweep);

  return routes;
}

export function createConfiguredLudoCronRoutes(): Hono {
  return createLudoCronRoutes({
    store: configuredLudoStore(),
    cronSecret: process.env.CRON_SECRET,
    matchViewPublisher: resolveMatchViewPublisher(),
    economyStore: configuredLudoEconomyStore(),
  });
}
