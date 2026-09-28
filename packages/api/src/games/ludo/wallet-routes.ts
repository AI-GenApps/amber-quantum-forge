import type { Context, Hono } from "hono";
import { isGameEnvironment } from "../validation";
import type { LudoEnvironment, LudoSession } from "./contracts";
import { getEconomyConfig, xpRequiredForLevel } from "./economy-config";
import type { LudoEconomyStore } from "./economy-store";
import {
  asLudoError,
  LudoDailyRewardAlreadyClaimedError,
  LudoError,
  LudoXpClaimImplausibleError,
  LudoXpClaimInvalidError,
  LudoXpDailyCapExceededError,
} from "./errors";
import { applyXpAndLevelRewards } from "./progression-service";
import type { LudoRouteDependencies } from "./routes-types";
import { parseXpClaimRequest } from "./validation";

/** A Ludo match can't plausibly finish faster than this — a generous floor
 * used only to reject implausible `xp/claim` payloads (task 26b's
 * replay-sanity check), not a real minimum-match-duration rule enforced
 * anywhere else. */
const MIN_PLAUSIBLE_MATCH_DURATION_MS = 20_000;

type AuthResult = { ok: true; session: LudoSession } | { ok: false; response: Response };

type AuthenticateGameToken = (
  c: Context,
  dependencies: LudoRouteDependencies,
  environment: LudoEnvironment,
) => Promise<AuthResult>;

async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

/**
 * Task 26b: wallet/profile/inventory/progression routes. All behind the
 * same game token as the match routes (`authenticateGameToken`), subject
 * taken from the token exactly like `processCommand`'s caller. Split out of
 * `routes.ts` to keep that file under the repo's max-lines limit.
 */
export function registerLudoWalletRoutes(
  routes: Hono,
  dependencies: LudoRouteDependencies,
  economyStore: LudoEconomyStore,
  authenticateGameToken: AuthenticateGameToken,
): void {
  routes.get("/:environment/wallet", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;
    const [coins, diamonds] = await Promise.all([
      economyStore.getBalance(environment, auth.session.subject, "coins"),
      economyStore.getBalance(environment, auth.session.subject, "diamonds"),
    ]);
    return c.json({ coins, diamonds }, 200);
  });

  routes.get("/:environment/profile", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;
    const progression = await economyStore.getProgression(environment, auth.session.subject);
    const level = progression?.level ?? 1;
    const xp = progression?.xp ?? 0;
    return c.json({ level, xp, xpRequiredForNextLevel: xpRequiredForLevel(level) }, 200);
  });

  // No `ludo_catalog` DB row is ever written by this epic yet (no seed/grant
  // path exists for it), so the catalog half of this response is served
  // directly from the versioned economy config's `themes` list — the same
  // source `applyXpAndLevelRewards`/starter-grant read from — rather than a
  // store query against an unpopulated table.
  routes.get("/:environment/inventory", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;
    const inventory = await economyStore.listInventory(environment, auth.session.subject);
    const catalog = getEconomyConfig().themes;
    return c.json(
      {
        inventory: inventory.map((row) => ({
          item_id: row.itemId,
          item_type: row.itemType,
          acquired_via: row.acquiredVia,
          acquired_at: row.acquiredAt,
        })),
        catalog: catalog.map((item) => ({
          item_id: item.itemId,
          display_name: item.displayName,
          item_type: item.category,
          price_coins: item.priceCoins,
          price_diamonds: item.priceDiamonds,
        })),
      },
      200,
    );
  });

  routes.post("/:environment/xp/claim", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    const parsed = parseXpClaimRequest(await readJsonBody(c));
    if (!parsed.ok) {
      const error = new LudoXpClaimInvalidError();
      return c.json(error.response(), error.status);
    }
    const { xpDelta, claimId, elapsedMs, matchesCompleted } = parsed.value;

    // Replay-sanity check (task 26b Context, item b): reject a claim whose
    // elapsed-time/match-count/xp combination could not plausibly have come
    // from real play, at generous ceilings, rather than silently clamping.
    const maxPlausibleMatches = Math.floor(elapsedMs / MIN_PLAUSIBLE_MATCH_DURATION_MS) + 1;
    if (matchesCompleted > maxPlausibleMatches) {
      const error = new LudoXpClaimImplausibleError(
        `matches_completed (${matchesCompleted}) exceeds what elapsed_ms (${elapsedMs}) could plausibly fit`,
      );
      return c.json(error.response(), error.status);
    }
    const config = getEconomyConfig();
    const maxPlausibleXp = matchesCompleted * config.xp.matchWinXp;
    if (xpDelta > maxPlausibleXp) {
      const error = new LudoXpClaimImplausibleError(
        `xp_delta (${xpDelta}) exceeds what matches_completed (${matchesCompleted}) could plausibly earn`,
      );
      return c.json(error.response(), error.status);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const claimDate = nowIso.slice(0, 10);

    try {
      // Daily cap (task 26b Context, item a). Applied against
      // `offlineDailyXpCap` — the only per-subject daily XP cap task 26a's
      // config defines — even though this route accepts XP from any mode,
      // per Context's decision that XP is earned everywhere; a future
      // online-specific cap, if introduced, would live alongside this check.
      //
      // The check-then-write here goes through a single atomic store call
      // (`recordXpClaimWithCap`) rather than a separate `sumXpClaimed` read
      // followed by `recordXpClaim`: two concurrent claims for the same
      // subject/day could otherwise both read the same pre-claim sum, both
      // pass the cap check, and both record, exceeding the cap.
      const recorded = await economyStore.recordXpClaimWithCap(
        environment,
        {
          subject: auth.session.subject,
          claimId,
          xpDelta,
          claimDate,
          dailyCap: config.xp.offlineDailyXpCap,
        },
        nowIso,
      );
      if (recorded.outcome === "cap_exceeded") {
        const error = new LudoXpDailyCapExceededError();
        return c.json(error.response(), error.status);
      }
      if (recorded.outcome === "duplicate") {
        // Idempotent replay of an already-applied claim id: report the
        // current progression without crediting xpDelta a second time.
        const progression = await economyStore.getProgression(environment, auth.session.subject);
        const level = progression?.level ?? 1;
        return c.json(
          {
            idempotent: true,
            xp: progression?.xp ?? 0,
            level,
            xpRequiredForNextLevel: xpRequiredForLevel(level),
            levelsGained: 0,
          },
          200,
        );
      }

      const result = await applyXpAndLevelRewards(economyStore, environment, {
        subject: auth.session.subject,
        xpDelta,
        now: nowIso,
        idempotencyKeyBase: `xp_claim:${claimId}`,
        economyConfig: config,
      });
      return c.json(
        {
          idempotent: false,
          xp: result.progression.xp,
          level: result.progression.level,
          xpRequiredForNextLevel: xpRequiredForLevel(result.progression.level),
          levelsGained: result.levelsGained,
        },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/starter-grant", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    try {
      const config = getEconomyConfig();
      const now = new Date().toISOString();
      const coins = await economyStore.appendLedgerEntry(environment, {
        subject: auth.session.subject,
        currency: "coins",
        delta: config.startingBalance.coins,
        reason: "starter_grant",
        idempotencyKey: "starter_grant:coins",
        now,
      });
      const diamonds = await economyStore.appendLedgerEntry(environment, {
        subject: auth.session.subject,
        currency: "diamonds",
        delta: config.startingBalance.diamonds,
        reason: "starter_grant",
        idempotencyKey: "starter_grant:diamonds",
        now,
      });
      // The free default item in each theme category (dice/token/board) —
      // "the starting ... theme" per Context — granted the same way a
      // level-up theme unlock is: an idempotent inventory grant.
      const defaultThemes = config.themes.filter(
        (item) => item.priceCoins === null && item.priceDiamonds === null,
      );
      for (const theme of defaultThemes) {
        await economyStore.grantInventoryItem(environment, {
          subject: auth.session.subject,
          itemId: theme.itemId,
          itemType: theme.category,
          acquiredVia: "starter_grant",
          acquiredAt: now,
        });
      }
      return c.json(
        {
          granted: coins.applied || diamonds.applied,
          coins: coins.balance.balance,
          diamonds: diamonds.balance.balance,
        },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.post("/:environment/daily-reward/claim", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    const auth = await authenticateGameToken(c, dependencies, environment);
    if (!auth.ok) return auth.response;

    try {
      const config = getEconomyConfig();
      const now = new Date();
      const nowIso = now.toISOString();
      const today = nowIso.slice(0, 10);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const state = await economyStore.getDailyRewardState(environment, auth.session.subject);
      if (state?.lastClaimDate === today) {
        const error = new LudoDailyRewardAlreadyClaimedError();
        return c.json(error.response(), error.status);
      }
      const nextStreakDay =
        state?.lastClaimDate === yesterday ? (state.streakDay >= 7 ? 1 : state.streakDay + 1) : 1;
      const reward = config.dailyRewards.find((day) => day.day === nextStreakDay);
      if (!reward) {
        throw new Error(`ludo daily reward: no calendar entry for streak day ${nextStreakDay}`);
      }

      const coins = await economyStore.appendLedgerEntry(environment, {
        subject: auth.session.subject,
        currency: "coins",
        delta: reward.coins,
        reason: "daily_login",
        idempotencyKey: `daily_reward:${today}`,
        now: nowIso,
      });
      if (reward.diamonds > 0) {
        await economyStore.appendLedgerEntry(environment, {
          subject: auth.session.subject,
          currency: "diamonds",
          delta: reward.diamonds,
          reason: "daily_login",
          idempotencyKey: `daily_reward:${today}:diamonds`,
          now: nowIso,
        });
      }
      const diamonds = await economyStore.getBalance(environment, auth.session.subject, "diamonds");
      await economyStore.setDailyRewardState(environment, {
        subject: auth.session.subject,
        lastClaimDate: today,
        streakDay: nextStreakDay,
        updatedAt: nowIso,
      });
      return c.json(
        {
          streakDay: nextStreakDay,
          coinsGranted: reward.coins,
          diamondsGranted: reward.diamonds,
          coins: coins.balance.balance,
          diamonds,
        },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });
}
