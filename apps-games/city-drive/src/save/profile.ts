import {
  type CarEntry,
  type CarRoster,
  type CarSpec,
  claimDaily,
  type DailyClaim,
  defaultSave,
  findCar,
  levelsOf,
  type MissionPayoutInfo,
  type MissionResult,
  type PurchaseResult,
  purchaseCar,
  purchaseUpgrade,
  reconcileWithRoster,
  recordMission,
  type SaveData,
  type SaveManager,
  type SaveSettings,
  type SelectResult,
  type Stars,
  selectCar,
  type Tiers,
  totalStars,
  type UpgradeLevels,
  type UpgradeResult,
  type UpgradeTrack,
  upgradedSpec,
} from "@city-drive/core";

/** What the profile needs to know about a mission to pay for it. */
interface PayableMission {
  id: string;
  reward_coins: Tiers<number>;
}

/**
 * The player's progress as the game uses it: coins, cars and mission records on top of a
 * SaveManager. Every change is committed to the manager, which saves it in the background.
 */
export class Profile {
  constructor(
    readonly manager: SaveManager,
    readonly roster: CarRoster,
  ) {}

  /** Load the save and bring it in line with the roster (unknown cars are dropped). */
  static async load(manager: SaveManager, roster: CarRoster): Promise<Profile> {
    await manager.load();
    const profile = new Profile(manager, roster);
    const fixed = reconcileWithRoster(manager.data, roster);
    if (fixed !== manager.data) manager.commit(fixed);
    return profile;
  }

  get save(): SaveData {
    return this.manager.data;
  }

  get coins(): number {
    return this.save.coins;
  }

  get stars(): number {
    return totalStars(this.save);
  }

  selectedEntry(): CarEntry {
    return findCar(this.roster, this.save.selected_car);
  }

  /** The physics spec of the selected car with its upgrades applied, used when the car spawns. */
  selectedSpec(): CarSpec {
    const entry = this.selectedEntry();
    return upgradedSpec(entry, levelsOf(this.save, entry.id));
  }

  upgradeLevels(carId: string): UpgradeLevels {
    return levelsOf(this.save, carId);
  }

  purchaseUpgrade(carId: string, track: UpgradeTrack): UpgradeResult {
    const result = purchaseUpgrade(this.save, this.roster, carId, track);
    if (result.ok) this.manager.commit(result.save);
    return result;
  }

  /** Pay the daily for a UTC date. A run with no stars, or a date already claimed, changes nothing. */
  claimDaily(date: string, stars: Stars): DailyClaim {
    const claim = claimDaily(this.save, date, stars);
    if (claim.ok) this.manager.commit(claim.save);
    return claim;
  }

  owns(carId: string): boolean {
    return this.save.owned_cars.includes(carId);
  }

  /** Pay a finished mission and remember the best result. A failed run changes nothing. */
  recordResult(result: MissionResult, mission: PayableMission): MissionPayoutInfo {
    const recorded = recordMission(this.save, mission, result);
    if (recorded.save !== this.save) this.manager.commit(recorded.save);
    return recorded.payout;
  }

  purchase(carId: string): PurchaseResult {
    const result = purchaseCar(this.save, this.roster, carId);
    if (result.ok) this.manager.commit(result.save);
    return result;
  }

  select(carId: string): SelectResult {
    const result = selectCar(this.save, carId);
    if (result.ok) this.manager.commit(result.save);
    return result;
  }

  /** Change some settings (audio, haptics, controls, graphics) and save. */
  updateSettings(change: Partial<SaveSettings>): void {
    this.manager.commit({ ...this.save, settings: { ...this.save.settings, ...change } });
  }

  /** Whether a named one-time hint or tutorial step has been seen. */
  flag(name: string): boolean {
    return this.save.onboarding[name] === true;
  }

  /** Remember (or forget) a one-time hint. Saves only when the value changes. */
  setFlag(name: string, value: boolean): void {
    if (this.flag(name) === value) return;
    this.manager.commit({ ...this.save, onboarding: { ...this.save.onboarding, [name]: value } });
  }

  /** True once any mission has been played, so a returning player skips the tutorial. */
  hasMissionRecords(): boolean {
    return Object.keys(this.save.missions).length > 0;
  }

  /** Erase all progress: coins, cars, mission records and settings go back to a new player's. */
  reset(): void {
    this.manager.commit(defaultSave(this.roster.starter));
  }
}
