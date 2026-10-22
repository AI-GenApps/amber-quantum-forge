import type {
  DailyClaim,
  DailyClaimFailure,
  MissionDef,
  MissionPayoutInfo,
  MissionResult,
  Stars,
} from "@city-drive/core";
import type { Profile } from "../save";

/** The daily run in progress: which UTC date it pays for and the mission it is played on. */
export interface DailyRun {
  date: string;
  missionId: string;
}

/** What the last finished daily run paid, for the results screen. */
export interface DailyPayout {
  date: string;
  missionId: string;
  stars: Stars;
  coins: number;
  base: number;
  bonus: number;
  streak: number;
  /** A reward was paid. False for a failed run (retry today) or a date that cannot pay. */
  claimed: boolean;
  /** Why nothing was paid, when `claimed` is false. */
  reason?: DailyClaimFailure;
}

function payoutOf(run: DailyRun, stars: Stars, claim: DailyClaim): DailyPayout {
  if (!claim.ok) {
    return {
      ...run,
      stars,
      coins: 0,
      base: 0,
      bonus: 0,
      streak: 0,
      claimed: false,
      reason: claim.reason,
    };
  }
  const { coins, base, bonus, streak } = claim;
  return { ...run, stars, coins, base, bonus, streak, claimed: true };
}

/**
 * Pays each finished mission exactly once, the moment its result exists, so quitting the page on
 * the results screen never loses the coins. A daily run pays the daily reward instead of the
 * mission's own reward and leaves the mission's records alone.
 */
export class MissionCredit {
  private credited: MissionResult | undefined;
  private last: MissionPayoutInfo | undefined;
  private lastDailyPayout: DailyPayout | undefined;
  private run: DailyRun | undefined;

  constructor(
    private readonly profile: Profile,
    private readonly catalog: readonly MissionDef[],
  ) {}

  /** What the most recent mission paid, for the results screen. */
  get lastPayout(): MissionPayoutInfo | undefined {
    return this.last;
  }

  get dailyRun(): DailyRun | undefined {
    return this.run;
  }

  /** What the most recent daily run paid. Cleared when another run starts. */
  get lastDaily(): DailyPayout | undefined {
    return this.lastDailyPayout;
  }

  beginDaily(run: DailyRun): void {
    this.run = run;
    this.lastDailyPayout = undefined;
  }

  endDaily(): void {
    this.run = undefined;
    this.lastDailyPayout = undefined;
  }

  /** Call every step with the current mission result (undefined when none). */
  check(result: MissionResult | undefined): void {
    if (!result || result === this.credited) return;
    this.credited = result;
    const run = this.run;
    if (run && run.missionId === result.id) {
      const stars: Stars = result.success ? result.stars : 0;
      this.lastDailyPayout = payoutOf(run, stars, this.profile.claimDaily(run.date, stars));
      return;
    }
    const mission = this.catalog.find((m) => m.id === result.id);
    if (!mission) throw new Error(`economy: finished mission "${result.id}" is not in the catalog`);
    this.last = this.profile.recordResult(result, mission);
  }
}
