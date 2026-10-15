import type { Context, Hono } from "hono";
import { isGameEnvironment } from "../validation";
import { HttpAdMobVerifierKeyProvider, verifyAdMobSsvCallback } from "./admob-ssv";
import type { LudoEnvironment, LudoSession } from "./contracts";
import { getEconomyConfig } from "./economy-config";
import type { LudoAdRewardType, LudoEconomyStore } from "./economy-store";
import {
  asLudoError,
  LudoAdCallbackInvalidError,
  LudoAdDailyCapReachedError,
  LudoAdNotConfiguredError,
  LudoAdSignatureInvalidError,
  LudoError,
} from "./errors";
import type { LudoRouteDependencies } from "./routes-types";

type AuthResult = { ok: true; session: LudoSession } | { ok: false; response: Response };

type AuthenticateGameToken = (
  c: Context,
  dependencies: LudoRouteDependencies,
  environment: LudoEnvironment,
) => Promise<AuthResult>;

const REWARD_TYPES: readonly LudoAdRewardType[] = ["coins", "diamonds"];

function isRewardType(value: string | null): value is LudoAdRewardType {
  return value !== null && (REWARD_TYPES as readonly string[]).includes(value);
}

/** AdMob's `ad_unit` callback parameter is the numeric ad unit id, the part
 * of `ca-app-pub-<publisher>/<unit>` after the slash. Accept either form in
 * configuration. */
function normalizeAdUnitId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.includes("/") ? trimmed.slice(trimmed.lastIndexOf("/") + 1) : trimmed;
}

/**
 * Derives the reward type of a verified callback. With ad units configured
 * (production), the signed `ad_unit` is the only trusted source and the
 * client-chosen `custom_data` must agree with it. Without them (debug,
 * staging, tests) `custom_data` selects the type; production without
 * configured units refuses to grant anything.
 */
function resolveRewardType(
  environment: LudoEnvironment,
  adUnit: string | null,
  customData: string | null,
  adUnitIds: LudoRouteDependencies["admobAdUnitIds"],
): LudoAdRewardType {
  const coinUnit = normalizeAdUnitId(adUnitIds?.coins);
  const diamondUnit = normalizeAdUnitId(adUnitIds?.diamonds);
  if (coinUnit || diamondUnit) {
    const fromUnit: LudoAdRewardType | null =
      adUnit && adUnit === coinUnit
        ? "coins"
        : adUnit && adUnit === diamondUnit
          ? "diamonds"
          : null;
    if (!fromUnit) throw new LudoAdCallbackInvalidError("The callback names an unknown ad unit");
    if (customData !== null && customData !== fromUnit) {
      throw new LudoAdCallbackInvalidError("The callback custom_data does not match its ad unit");
    }
    return fromUnit;
  }
  if (environment === "production") throw new LudoAdNotConfiguredError();
  if (!isRewardType(customData)) {
    throw new LudoAdCallbackInvalidError("The callback custom_data must be coins or diamonds");
  }
  return customData;
}

function dailyCapFor(rewardType: LudoAdRewardType): { cap: number; amount: number } {
  const ads = getEconomyConfig().rewardedAds;
  return rewardType === "coins"
    ? { cap: ads.coinAdDailyCap, amount: ads.coinsPerAd }
    : { cap: ads.diamondAdDailyCap, amount: ads.diamondsPerAd };
}

/**
 * Task 26h: rewarded-ad routes. `.../ads/rewarded/callback` is AdMob's
 * server-side-verification callback (Google calls it with GET; POST is also
 * accepted): it is authenticated only by AdMob's ECDSA signature over the
 * query string, never by a game token, and credits through the store's
 * atomic `claimAdRewardWithCap` (duplicate `transaction_id` is a no-op, the
 * per-type daily cap is enforced inside the same locked step).
 * `.../ads/rewarded/status` is the client's read model (remaining ads today
 * and the user id to put in the SSV options).
 */
export function registerLudoRewardedAdsRoutes(
  routes: Hono,
  dependencies: LudoRouteDependencies,
  economyStore: LudoEconomyStore,
  authenticateGameToken: AuthenticateGameToken,
): void {
  const keyProvider = dependencies.admobKeyProvider ?? new HttpAdMobVerifierKeyProvider();

  routes.on(["GET", "POST"], "/:environment/ads/rewarded/callback", async (c) => {
    const environment = c.req.param("environment");
    if (!isGameEnvironment(environment)) {
      const error = new LudoError(
        400,
        "ludo_invalid_environment",
        "Environment must be debug, staging or production",
      );
      return c.json(error.response(), error.status);
    }
    try {
      const rawQuery = new URL(c.req.url).search.replace(/^\?/, "");
      const verification = await verifyAdMobSsvCallback(rawQuery, keyProvider);
      if (!verification.ok) throw new LudoAdSignatureInvalidError();

      const { params } = verification;
      const transactionId = params.get("transaction_id");
      const subject = params.get("user_id");
      if (!transactionId || !subject) throw new LudoAdCallbackInvalidError();
      const rewardType = resolveRewardType(
        environment,
        params.get("ad_unit"),
        params.get("custom_data"),
        dependencies.admobAdUnitIds,
      );
      const { cap, amount } = dailyCapFor(rewardType);
      const nowIso = new Date().toISOString();
      const result = await economyStore.claimAdRewardWithCap(environment, {
        subject,
        adTransactionId: transactionId,
        rewardType,
        claimDate: nowIso.slice(0, 10),
        dailyCap: cap,
        amount,
        now: nowIso,
      });
      if (result.outcome === "cap_exceeded") throw new LudoAdDailyCapReachedError();
      return c.json(
        result.outcome === "credited"
          ? { credited: true, rewardType, amount }
          : { credited: false, duplicate: true, rewardType },
        200,
      );
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });

  routes.get("/:environment/ads/rewarded/status", async (c) => {
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
      const claimDate = new Date().toISOString().slice(0, 10);
      const subject = auth.session.subject;
      const unit = async (rewardType: LudoAdRewardType) => {
        const { cap, amount } = dailyCapFor(rewardType);
        const claimedToday = await economyStore.countAdClaims(
          environment,
          subject,
          rewardType,
          claimDate,
        );
        return {
          rewardAmount: amount,
          dailyCap: cap,
          claimedToday,
          remaining: Math.max(0, cap - claimedToday),
        };
      };
      const [coins, diamonds] = await Promise.all([unit("coins"), unit("diamonds")]);
      return c.json({ ssvUserId: subject, coins, diamonds }, 200);
    } catch (cause) {
      const error = asLudoError(cause);
      return c.json(error.response(), error.status);
    }
  });
}
