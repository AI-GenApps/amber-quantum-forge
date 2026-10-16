import type { MissionDef, MissionPayoutInfo, MissionResult } from "@city-drive/core";
import type { Profile } from "../save";

/**
 * Pays each finished mission exactly once, the moment its result exists, so quitting the page on
 * the results screen never loses the coins.
 */
export class MissionCredit {
  private credited: MissionResult | undefined;
  private last: MissionPayoutInfo | undefined;

  constructor(
    private readonly profile: Profile,
    private readonly catalog: readonly MissionDef[],
  ) {}

  /** What the most recent mission paid, for the results screen. */
  get lastPayout(): MissionPayoutInfo | undefined {
    return this.last;
  }

  /** Call every step with the current mission result (undefined when none). */
  check(result: MissionResult | undefined): void {
    if (!result || result === this.credited) return;
    this.credited = result;
    const mission = this.catalog.find((m) => m.id === result.id);
    if (!mission) throw new Error(`economy: finished mission "${result.id}" is not in the catalog`);
    this.last = this.profile.recordResult(result, mission);
  }
}
