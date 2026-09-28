/**
 * Ludo Vortex economy config — server-authoritative, versioned.
 *
 * Every number in `docs-internal/gaming/ludo-economy.md` lives here, in one
 * place, so later 26x tasks read a config version instead of hardcoding a
 * number independently. A match/session pins the config `version` it
 * started under (see `packages/db/src/schema.ts`'s `ludoMatches.economyConfigVersion`
 * and `ludoCoinTableEscrow`), so this module must be able to return a
 * specific historical version, not just "the latest".
 *
 * Approved 2026-09-25. See `.agents/games/ludo-vortex/economy.md` and
 * `.agents/resources/2026-09-25/ludo-vortex-economy/research.md` section 6
 * for provenance; `docs-internal/gaming/ludo-economy.md` documents every
 * correction made vs. that research pass.
 */

export type LudoCurrency = "coins" | "diamonds";

export type LudoThemeCategory = "dice" | "token" | "board";

export type LudoCoinTableTier = "low" | "mid" | "high";

/** Every reason a `ludo_wallet_transactions` row can be written for. Keep in
 * sync with the `check` constraint on that column in `packages/db/src/schema.ts`. */
export type LudoWalletReason =
  | "starter_grant"
  | "daily_login"
  | "rewarded_ad"
  | "level_up"
  | "online_match_win"
  | "coin_table_entry"
  | "coin_table_payout"
  | "coin_table_refund"
  | "iap_purchase"
  | "vortex_pass_perk"
  | "store_purchase"
  | "admin_adjustment"
  | "refund";

export interface LudoStartingBalance {
  coins: number;
  diamonds: number;
}

/** `xp_required(level) = 100 * level^1.6`, rounded to the nearest 10. A
 * function, not a lookup table, so it can be verified directly against the
 * formula in a test and evaluated for any level. */
export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`xpRequiredForLevel: level must be a positive integer, got ${level}`);
  }
  const raw = 100 * level ** 1.6;
  return Math.round(raw / 10) * 10;
}

/** Total cumulative XP required to reach `level` from level 1 (sum of the
 * per-level requirements below it). Level 1 requires 0 cumulative XP. */
export function cumulativeXpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`cumulativeXpForLevel: level must be a positive integer, got ${level}`);
  }
  let total = 0;
  for (let stepLevel = 1; stepLevel < level; stepLevel += 1) {
    total += xpRequiredForLevel(stepLevel);
  }
  return total;
}

export interface LudoXpConfig {
  /** vs-computer win/loss, pass-and-play win/loss, online win/loss — XP is
   * earned in every mode. */
  matchWinXp: number;
  matchLossXp: number;
  /** Daily cap on XP claimed from offline (vs-computer, pass-and-play)
   * play, applied server-side by the claim endpoint (task 26b) together
   * with a replay-sanity check. Online XP is not capped by this figure
   * (it is bounded by actually-completed online matches). */
  offlineDailyXpCap: number;
  /** Coins granted on level-up: `levelUpCoinsPerLevel * newLevel`. */
  levelUpCoinsPerLevel: number;
  /** Diamonds granted when `newLevel % levelUpDiamondEveryNLevels === 0`. */
  levelUpDiamonds: number;
  levelUpDiamondEveryNLevels: number;
  /** A free theme item is granted from a rotating pool when
   * `newLevel % levelUpFreeThemeEveryNLevels === 0`. */
  levelUpFreeThemeEveryNLevels: number;
}

export interface LudoDailyRewardDay {
  day: number;
  coins: number;
  diamonds: number;
}

export interface LudoRewardedAdConfig {
  coinsPerAd: number;
  coinAdDailyCap: number;
  diamondsPerAd: number;
  diamondAdDailyCap: number;
}

/**
 * Coin-stake table for one tier. Percentages apply to the **gross pot**
 * (entry fee * player count), with the rake netted out separately — not to
 * the post-rake pot. For every tier and player count:
 * `rakePercentOfGrossPot + firstPlacePercentOfGrossPot + secondPlacePercentOfGrossPot`
 * (where `secondPlacePercentOfGrossPot` is 0 for 2-player matches) sums to
 * exactly 100.
 */
export interface LudoCoinTableTierConfig {
  tier: LudoCoinTableTier;
  entryFee: number;
  rakePercentOfGrossPot: number;
  /** 2-player: winner takes the whole non-rake share. */
  twoPlayerWinnerPercentOfGrossPot: number;
  /** 4-player: 1st/2nd place splits. */
  fourPlayerFirstPlacePercentOfGrossPot: number;
  fourPlayerSecondPlacePercentOfGrossPot: number;
}

export interface LudoThemeItem {
  itemId: string;
  displayName: string;
  category: LudoThemeCategory;
  /** `null` for the free default item in each category, and for
   * board themes (diamond-only, no coin price). */
  priceCoins: number | null;
  /** `null` only for the free default item in each category. */
  priceDiamonds: number | null;
}

export interface LudoIapProduct {
  productId: string;
  displayName: string;
  kind: "consumable" | "non_consumable" | "subscription";
  grantsCoins: number | null;
  grantsDiamonds: number | null;
  priceInrMinor: number;
  priceUsdMinor: number;
}

export interface LudoVortexPassConfig {
  productId: string;
  dailyRewardBonusPercent: number;
  freeThemesPerMonth: number;
  exclusiveDiceThemeItemId: string;
  priceInrMinor: number;
  priceUsdMinor: number;
}

export interface LudoEconomyConfig {
  version: number;
  startingBalance: LudoStartingBalance;
  xp: LudoXpConfig;
  dailyRewards: LudoDailyRewardDay[];
  rewardedAds: LudoRewardedAdConfig;
  coinTables: Record<LudoCoinTableTier, LudoCoinTableTierConfig>;
  themes: LudoThemeItem[];
  iapProducts: LudoIapProduct[];
  vortexPass: LudoVortexPassConfig;
  /** Online free-play (no coin stake) match win reward, capped per day as
   * an anti-farm measure. */
  onlineFreePlayWinCoins: number;
  onlineFreePlayWinDailyCap: number;
}

export const LUDO_ECONOMY_CONFIG_V1: LudoEconomyConfig = {
  version: 1,
  startingBalance: { coins: 5000, diamonds: 20 },
  xp: {
    matchWinXp: 100,
    matchLossXp: 40,
    offlineDailyXpCap: 2000,
    levelUpCoinsPerLevel: 100,
    levelUpDiamonds: 10,
    levelUpDiamondEveryNLevels: 5,
    levelUpFreeThemeEveryNLevels: 10,
  },
  dailyRewards: [
    { day: 1, coins: 200, diamonds: 0 },
    { day: 2, coins: 250, diamonds: 0 },
    { day: 3, coins: 300, diamonds: 0 },
    { day: 4, coins: 350, diamonds: 0 },
    { day: 5, coins: 400, diamonds: 0 },
    { day: 6, coins: 500, diamonds: 0 },
    { day: 7, coins: 750, diamonds: 5 },
  ],
  rewardedAds: {
    coinsPerAd: 100,
    coinAdDailyCap: 5,
    diamondsPerAd: 5,
    diamondAdDailyCap: 2,
  },
  coinTables: {
    low: {
      tier: "low",
      entryFee: 500,
      rakePercentOfGrossPot: 5,
      twoPlayerWinnerPercentOfGrossPot: 95,
      fourPlayerFirstPlacePercentOfGrossPot: 70,
      fourPlayerSecondPlacePercentOfGrossPot: 25,
    },
    mid: {
      tier: "mid",
      entryFee: 2000,
      rakePercentOfGrossPot: 5,
      twoPlayerWinnerPercentOfGrossPot: 95,
      fourPlayerFirstPlacePercentOfGrossPot: 70,
      fourPlayerSecondPlacePercentOfGrossPot: 25,
    },
    high: {
      tier: "high",
      entryFee: 10000,
      rakePercentOfGrossPot: 5,
      twoPlayerWinnerPercentOfGrossPot: 95,
      fourPlayerFirstPlacePercentOfGrossPot: 70,
      fourPlayerSecondPlacePercentOfGrossPot: 25,
    },
  },
  themes: [
    {
      itemId: "dice_default",
      displayName: "Default",
      category: "dice",
      priceCoins: null,
      priceDiamonds: null,
    },
    {
      itemId: "dice_classic_wood",
      displayName: "Classic Wood",
      category: "dice",
      priceCoins: 1500,
      priceDiamonds: 30,
    },
    {
      itemId: "dice_neon_vortex",
      displayName: "Neon Vortex",
      category: "dice",
      priceCoins: 1500,
      priceDiamonds: 30,
    },
    {
      itemId: "dice_marble",
      displayName: "Marble",
      category: "dice",
      priceCoins: 1500,
      priceDiamonds: 30,
    },
    {
      itemId: "dice_galaxy",
      displayName: "Galaxy",
      category: "dice",
      priceCoins: 1500,
      priceDiamonds: 30,
    },
    {
      itemId: "dice_gold",
      displayName: "Gold",
      category: "dice",
      priceCoins: 1500,
      priceDiamonds: 30,
    },
    {
      itemId: "token_default",
      displayName: "Default",
      category: "token",
      priceCoins: null,
      priceDiamonds: null,
    },
    {
      itemId: "token_gem",
      displayName: "Gem Tokens",
      category: "token",
      priceCoins: 2500,
      priceDiamonds: 50,
    },
    {
      itemId: "token_robot",
      displayName: "Robot Tokens",
      category: "token",
      priceCoins: 2500,
      priceDiamonds: 50,
    },
    {
      itemId: "token_animal",
      displayName: "Animal Tokens",
      category: "token",
      priceCoins: 2500,
      priceDiamonds: 50,
    },
    {
      itemId: "board_default",
      displayName: "Default",
      category: "board",
      priceCoins: null,
      priceDiamonds: null,
    },
    {
      itemId: "board_cosmic",
      displayName: "Cosmic Board",
      category: "board",
      priceCoins: null,
      priceDiamonds: 80,
    },
    {
      itemId: "board_royal",
      displayName: "Royal Board",
      category: "board",
      priceCoins: null,
      priceDiamonds: 80,
    },
  ],
  iapProducts: [
    {
      productId: "ludo_starter_pack",
      displayName: "Starter Pack",
      kind: "consumable",
      grantsCoins: 3000,
      grantsDiamonds: 30,
      priceInrMinor: 4900,
      priceUsdMinor: 99,
    },
    {
      productId: "ludo_coins_small",
      displayName: "Coins — Small",
      kind: "consumable",
      grantsCoins: 5500,
      grantsDiamonds: null,
      priceInrMinor: 9900,
      priceUsdMinor: 199,
    },
    {
      productId: "ludo_coins_medium",
      displayName: "Coins — Medium",
      kind: "consumable",
      grantsCoins: 30000,
      grantsDiamonds: null,
      priceInrMinor: 39900,
      priceUsdMinor: 499,
    },
    {
      productId: "ludo_coins_large",
      displayName: "Coins — Large",
      kind: "consumable",
      grantsCoins: 110000,
      grantsDiamonds: null,
      priceInrMinor: 149900,
      priceUsdMinor: 1799,
    },
    {
      productId: "ludo_diamonds_small",
      displayName: "Diamonds — Small",
      kind: "consumable",
      grantsCoins: null,
      grantsDiamonds: 100,
      priceInrMinor: 14900,
      priceUsdMinor: 299,
    },
    {
      productId: "ludo_diamonds_medium",
      displayName: "Diamonds — Medium",
      kind: "consumable",
      grantsCoins: null,
      grantsDiamonds: 600,
      priceInrMinor: 69900,
      priceUsdMinor: 899,
    },
    {
      productId: "ludo_diamonds_large",
      displayName: "Diamonds — Large",
      kind: "consumable",
      grantsCoins: null,
      grantsDiamonds: 1600,
      priceInrMinor: 169900,
      priceUsdMinor: 1999,
    },
    {
      productId: "ludo_vortex_pass_monthly",
      displayName: "Vortex Pass (monthly)",
      kind: "subscription",
      grantsCoins: null,
      grantsDiamonds: null,
      priceInrMinor: 19900,
      priceUsdMinor: 399,
    },
  ],
  vortexPass: {
    productId: "ludo_vortex_pass_monthly",
    dailyRewardBonusPercent: 50,
    freeThemesPerMonth: 1,
    exclusiveDiceThemeItemId: "dice_vortex_pass_exclusive",
    priceInrMinor: 19900,
    priceUsdMinor: 399,
  },
  onlineFreePlayWinCoins: 50,
  onlineFreePlayWinDailyCap: 10,
};

const LUDO_ECONOMY_CONFIG_VERSIONS: readonly LudoEconomyConfig[] = [LUDO_ECONOMY_CONFIG_V1];

/** Returns the requested historical config version, or the latest when
 * `version` is omitted. Throws for an unknown version rather than silently
 * falling back, so a match pinned to a stale/typo'd version fails loudly. */
export function getEconomyConfig(version?: number): LudoEconomyConfig {
  if (version === undefined) {
    return LUDO_ECONOMY_CONFIG_VERSIONS[LUDO_ECONOMY_CONFIG_VERSIONS.length - 1];
  }
  const found = LUDO_ECONOMY_CONFIG_VERSIONS.find((config) => config.version === version);
  if (!found) {
    throw new RangeError(`getEconomyConfig: unknown economy config version ${version}`);
  }
  return found;
}

export function latestEconomyConfigVersion(): number {
  return LUDO_ECONOMY_CONFIG_V1.version;
}
