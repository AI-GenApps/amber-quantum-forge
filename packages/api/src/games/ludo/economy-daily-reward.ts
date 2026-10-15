import type {
  LudoClaimDailyRewardInput,
  LudoDailyRewardStateRow,
  LudoLedgerAppendInput,
} from "./economy-store-types";

/** The computed effect of one daily-calendar claim, shared by the in-memory
 * and Drizzle stores so both apply identical streak and bonus rules. */
export interface LudoDailyRewardClaimPlan {
  streakDay: number;
  coins: number;
  diamonds: number;
  bonusCoins: number;
  bonusDiamonds: number;
}

/** Streak rule: a claim made the day after the last claim continues the
 * streak (day 7 wraps to day 1); any other gap, or no state, restarts at day
 * 1. The Vortex Pass bonus is a percentage of each currency's calendar
 * amount, rounded down. Throws if the calendar lacks the computed day. */
export function planDailyRewardClaim(
  state: Pick<LudoDailyRewardStateRow, "lastClaimDate" | "streakDay"> | null,
  input: Pick<LudoClaimDailyRewardInput, "yesterday" | "calendar" | "passBonusPercent">,
): LudoDailyRewardClaimPlan {
  const streakDay =
    state?.lastClaimDate === input.yesterday ? (state.streakDay >= 7 ? 1 : state.streakDay + 1) : 1;
  const reward = input.calendar.find((day) => day.day === streakDay);
  if (!reward) {
    throw new Error(`ludo daily reward: no calendar entry for streak day ${streakDay}`);
  }
  const bonus = (amount: number) => Math.floor((amount * input.passBonusPercent) / 100);
  return {
    streakDay,
    coins: reward.coins,
    diamonds: reward.diamonds,
    bonusCoins: bonus(reward.coins),
    bonusDiamonds: bonus(reward.diamonds),
  };
}

/** Ledger entries for one claim: the calendar amounts as `daily_login` and
 * any pass bonus as `vortex_pass_perk`. Keys are unique per UTC day, so a
 * replayed claim can never double-credit even outside the atomic store step. */
export function dailyRewardLedgerEntries(
  today: string,
  plan: LudoDailyRewardClaimPlan,
): Omit<LudoLedgerAppendInput, "subject" | "now">[] {
  const entries: Omit<LudoLedgerAppendInput, "subject" | "now">[] = [
    {
      currency: "coins",
      delta: plan.coins,
      reason: "daily_login",
      idempotencyKey: `daily_reward:${today}`,
    },
  ];
  if (plan.diamonds > 0) {
    entries.push({
      currency: "diamonds",
      delta: plan.diamonds,
      reason: "daily_login",
      idempotencyKey: `daily_reward:${today}:diamonds`,
    });
  }
  if (plan.bonusCoins > 0) {
    entries.push({
      currency: "coins",
      delta: plan.bonusCoins,
      reason: "vortex_pass_perk",
      idempotencyKey: `daily_reward:${today}:pass_bonus:coins`,
    });
  }
  if (plan.bonusDiamonds > 0) {
    entries.push({
      currency: "diamonds",
      delta: plan.bonusDiamonds,
      reason: "vortex_pass_perk",
      idempotencyKey: `daily_reward:${today}:pass_bonus:diamonds`,
    });
  }
  return entries;
}
