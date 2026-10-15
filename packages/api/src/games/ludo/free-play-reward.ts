import type { LudoEnvironment, LudoMatchView } from "./contracts";
import type { LudoEconomyConfig } from "./economy-config";
import type { LudoEconomyStore } from "./economy-store";

/**
 * Task 26h: pays the human winner of a finished free-play (no coin stake)
 * online match `onlineFreePlayWinCoins`, capped at `onlineFreePlayWinDailyCap`
 * wins per UTC day. The cap check and the credit are one atomic store step
 * (`claimFreePlayWinWithCap`), and the claim is keyed by (subject, match), so
 * the repeated calls `settleCoinStakeMatch` makes for a finished match (each
 * lazy state read, the sweeper) credit it at most once and never past the cap.
 * Bots never earn the reward. Returns the store outcome, or `null` when
 * nothing was attempted (no winner, or the winner is a bot).
 */
export async function grantFreePlayWinReward(
  economyStore: LudoEconomyStore,
  environment: LudoEnvironment,
  matchState: LudoMatchView["matchState"],
  botSubjects: ReadonlySet<string>,
  economyConfig: LudoEconomyConfig,
): Promise<"credited" | "duplicate" | "cap_exceeded" | null> {
  const winnerSeat = matchState.winnerOrder[0];
  if (winnerSeat === undefined) return null;
  const winner = matchState.players.find((player) => player.seat === winnerSeat)?.subject;
  if (!winner || botSubjects.has(winner)) return null;
  const nowIso = new Date().toISOString();
  const result = await economyStore.claimFreePlayWinWithCap(environment, {
    subject: winner,
    matchId: matchState.matchId,
    claimDate: nowIso.slice(0, 10),
    dailyCap: economyConfig.onlineFreePlayWinDailyCap,
    amount: economyConfig.onlineFreePlayWinCoins,
    now: nowIso,
  });
  return result.outcome;
}
