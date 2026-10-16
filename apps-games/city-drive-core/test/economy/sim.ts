import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type CarRoster,
  defaultSave,
  type MissionDef,
  type Progression,
  parseMission,
  parseProgression,
  purchaseCar,
  recordMission,
  type SaveData,
  totalStars,
} from "../../src/index";

const CONTENT = join(import.meta.dirname, "../../content");

export function readMissions(): MissionDef[] {
  const dir = join(CONTENT, "missions");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => parseMission(JSON.parse(readFileSync(join(dir, f), "utf8"))));
}

export function readProgression(): Progression {
  return parseProgression(JSON.parse(readFileSync(join(CONTENT, "progression.json"), "utf8")));
}

export interface DistrictStep {
  district: string;
  earned: number;
  coinsAfter: number;
  carsBought: string[];
  ownedAfter: number;
  starsAfter: number;
}

/**
 * Plays every district in order, earning `starsFor(mission)` stars on each mission once, and
 * after each district buys the cheapest unowned cars it can afford.
 */
export function simulate(
  roster: CarRoster,
  missions: readonly MissionDef[],
  progression: Progression,
  starsFor: (mission: MissionDef) => 1 | 2 | 3,
): { steps: DistrictStep[]; save: SaveData } {
  let save = defaultSave(roster.starter);
  const steps: DistrictStep[] = [];
  const byPrice = [...roster.cars].sort((a, b) => a.price - b.price);
  for (const district of progression.districts) {
    const before = save.coins;
    for (const m of missions.filter((x) => x.district === district.id)) {
      save = recordMission(save, m, { success: true, stars: starsFor(m), time: 30 }).save;
    }
    const earned = save.coins - before;
    const carsBought: string[] = [];
    for (const car of byPrice) {
      const bought = purchaseCar(save, roster, car.id);
      if (bought.ok) {
        save = bought.save;
        carsBought.push(car.id);
      }
    }
    steps.push({
      district: district.id,
      earned,
      coinsAfter: save.coins,
      carsBought,
      ownedAfter: save.owned_cars.length - 1,
      starsAfter: totalStars(save),
    });
  }
  return { steps, save };
}
