/// Shared level/XP progression math and reward-crediting for Ludo (task
/// 26b). `applyXpAndLevelRewards` is the one place that turns an XP delta
/// into a new `ludo_progression` row plus whatever level-up coin/diamond/
/// theme bonuses it earns, so the XP-claim route below and task 26c's
/// match-resolution path never duplicate this logic.
import type { LudoEnvironment } from "./contracts";
import type { LudoEconomyConfig, LudoThemeItem } from "./economy-config";
import { cumulativeXpForLevel, getEconomyConfig } from "./economy-config";
import type {
  LudoEconomyStore,
  LudoInventoryRow,
  LudoLedgerAppendResult,
  LudoProgressionRow,
} from "./economy-store";

/** The level reached by `xp` total (cumulative, since level 1): the
 * largest `level` for which `cumulativeXpForLevel(level) <= xp`. A plain
 * loop rather than a closed form, mirroring `cumulativeXpForLevel`'s own
 * style — `xpRequiredForLevel` is not algebraically invertible because of
 * the round-to-nearest-10 step. */
export function levelForXp(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new RangeError(`levelForXp: xp must be a non-negative finite number, got ${xp}`);
  }
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= xp) level += 1;
  return level;
}

/**
 * Deterministically picks the free theme item granted for reaching `level`
 * (every `levelUpFreeThemeEveryNLevels`th level). Cycles through every
 * non-default, non-free theme in `config.themes` in declaration order, so
 * levels far beyond the pool's length repeat earlier items — a repeat
 * grant is a no-op via `LudoEconomyStore.grantInventoryItem`'s
 * idempotency, not a bug, and is an accepted limitation of a small theme
 * catalog rather than new client-visible behavior worth tracking here.
 */
export function pickLevelUpTheme(config: LudoEconomyConfig, level: number): LudoThemeItem {
  const pool = config.themes.filter(
    (item) => item.priceCoins !== null || item.priceDiamonds !== null,
  );
  if (pool.length === 0) {
    throw new Error("progression-service: economy config has no theme pool for level-up grants");
  }
  const index = Math.floor(level / config.xp.levelUpFreeThemeEveryNLevels) - 1;
  return pool[((index % pool.length) + pool.length) % pool.length];
}

export interface ApplyXpAndLevelRewardsInput {
  subject: string;
  /** Positive XP to add. The caller (the XP-claim route, or a future
   * match-reward credit path) is responsible for daily-cap/sanity checks
   * before calling this — this function unconditionally applies `xpDelta`. */
  xpDelta: number;
  now: string;
  /** Must be unique per originating request (e.g. the XP claim's
   * `claim_id`, or a match id for a future match-reward credit) so every
   * level-up reward ledger entry it derives gets its own idempotency key. */
  idempotencyKeyBase: string;
  economyConfig?: LudoEconomyConfig;
}

export interface ApplyXpAndLevelRewardsResult {
  progression: LudoProgressionRow;
  previousLevel: number;
  levelsGained: number;
  /** Ledger entries credited for every level gained (coin bonus per level,
   * plus a diamond bonus on `levelUpDiamondEveryNLevels` boundaries),
   * written in the same transaction as the progression update. */
  ledgerResults: LudoLedgerAppendResult[];
  /** Theme items granted on `levelUpFreeThemeEveryNLevels` boundaries. */
  itemsGranted: LudoInventoryRow[];
}

export async function applyXpAndLevelRewards(
  store: LudoEconomyStore,
  environment: LudoEnvironment,
  input: ApplyXpAndLevelRewardsInput,
): Promise<ApplyXpAndLevelRewardsResult> {
  if (!Number.isFinite(input.xpDelta) || input.xpDelta <= 0) {
    throw new RangeError(
      `applyXpAndLevelRewards: xpDelta must be a positive number, got ${input.xpDelta}`,
    );
  }
  const config = input.economyConfig ?? getEconomyConfig();
  const current = await store.getProgression(environment, input.subject);
  const previousXp = current?.xp ?? 0;
  const previousLevel = current?.level ?? 1;
  const newXp = previousXp + input.xpDelta;
  const newLevel = levelForXp(newXp);

  const ledgerEntries: Parameters<
    LudoEconomyStore["applyProgressionAndLedger"]
  >[1]["ledgerEntries"] = [];
  const themeGrants: LudoThemeItem[] = [];
  for (let level = previousLevel + 1; level <= newLevel; level += 1) {
    ledgerEntries.push({
      currency: "coins",
      delta: config.xp.levelUpCoinsPerLevel * level,
      reason: "level_up",
      sourceRef: `level_${level}`,
      idempotencyKey: `${input.idempotencyKeyBase}:level_up:${level}:coins`,
    });
    if (level % config.xp.levelUpDiamondEveryNLevels === 0) {
      ledgerEntries.push({
        currency: "diamonds",
        delta: config.xp.levelUpDiamonds,
        reason: "level_up",
        sourceRef: `level_${level}`,
        idempotencyKey: `${input.idempotencyKeyBase}:level_up:${level}:diamonds`,
      });
    }
    if (level % config.xp.levelUpFreeThemeEveryNLevels === 0) {
      themeGrants.push(pickLevelUpTheme(config, level));
    }
  }

  const { progression, ledgerResults } = await store.applyProgressionAndLedger(environment, {
    subject: input.subject,
    xp: newXp,
    level: newLevel,
    now: input.now,
    ledgerEntries,
  });

  const itemsGranted: LudoInventoryRow[] = [];
  for (const theme of themeGrants) {
    itemsGranted.push(
      await store.grantInventoryItem(environment, {
        subject: input.subject,
        itemId: theme.itemId,
        itemType: theme.category,
        acquiredVia: "level_up",
        acquiredAt: input.now,
      }),
    );
  }

  return {
    progression,
    previousLevel,
    levelsGained: newLevel - previousLevel,
    ledgerResults,
    itemsGranted,
  };
}
