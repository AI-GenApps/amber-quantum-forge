import {
  type CarEntry,
  type CarRoster,
  type CarSpec,
  carSpecOf,
  findCar,
  type MissionPayoutInfo,
  type MissionResult,
  type PurchaseResult,
  purchaseCar,
  reconcileWithRoster,
  recordMission,
  type SaveData,
  type SaveManager,
  type SelectResult,
  selectCar,
  type Tiers,
  totalStars,
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

  /** The physics spec of the selected car, used when the car spawns. */
  selectedSpec(): CarSpec {
    return carSpecOf(this.selectedEntry());
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
}
