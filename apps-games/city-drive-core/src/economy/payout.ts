import type { Stars, Tiers } from "../missions/types";

/** Share of the 1-star reward paid for every successful replay. */
export const REPLAY_BONUS_FRACTION = 0.1;

function rewardFor(rewards: Tiers<number>, stars: Stars): number {
  return stars === 0 ? 0 : rewards[String(stars) as "1" | "2" | "3"];
}

export function replayBonus(rewards: Tiers<number>): number {
  return Math.round(rewards["1"] * REPLAY_BONUS_FRACTION);
}

export interface Payout {
  coins: number;
  /** First time this mission was completed at all. */
  firstClear: boolean;
  /** The run beat the best stars so far. */
  improved: boolean;
}

/**
 * Coins for one finished mission. A first clear pays the reward for the stars earned. A replay
 * pays only the gap up to the best stars ever earned (nothing when no better) plus the replay
 * bonus. A failed run (0 stars) pays nothing.
 */
export function missionPayout(rewards: Tiers<number>, bestStars: Stars, stars: Stars): Payout {
  if (stars === 0) return { coins: 0, firstClear: false, improved: false };
  if (bestStars === 0) {
    return { coins: rewardFor(rewards, stars), firstClear: true, improved: true };
  }
  const gap = Math.max(0, rewardFor(rewards, stars) - rewardFor(rewards, bestStars));
  return { coins: gap + replayBonus(rewards), firstClear: false, improved: stars > bestStars };
}
