import {
  type CarEntry,
  type CarRoster,
  type CarSpec,
  carSpecOf,
  type SaveData,
} from "@city-drive/core";

/** selected: driving it now. owned: can be selected. affordable: can be bought. locked: too dear. */
type CarState = "selected" | "owned" | "affordable" | "locked";

/** Relative bars, each 0..1, scaled across the roster so the differences are visible. */
export interface CarStats {
  speed: number;
  acceleration: number;
  grip: number;
}

export interface CarCard {
  id: string;
  name: string;
  modelId: string;
  price: number;
  state: CarState;
  /** Coins still missing for a locked car, otherwise 0. */
  missing: number;
  stats: CarStats;
}

const BAR_FLOOR = 0.2;

const rawStats = (spec: CarSpec) => ({
  speed: spec.topSpeedKmh,
  acceleration: spec.engineForce / spec.mass,
  grip: spec.frictionSlip,
});

function scale(value: number, min: number, max: number): number {
  if (max - min < 1e-9) return 0.6;
  return BAR_FLOOR + (1 - BAR_FLOOR) * ((value - min) / (max - min));
}

/** Speed, acceleration and grip of a car, derived from its CarSpec and scaled across the roster. */
export function carStats(entry: CarEntry, roster: CarRoster): CarStats {
  const all = roster.cars.map((c) => rawStats(carSpecOf(c)));
  const mine = rawStats(carSpecOf(entry));
  const range = (pick: (s: ReturnType<typeof rawStats>) => number) => {
    const values = all.map(pick);
    return [Math.min(...values), Math.max(...values)] as const;
  };
  const [sLo, sHi] = range((s) => s.speed);
  const [aLo, aHi] = range((s) => s.acceleration);
  const [gLo, gHi] = range((s) => s.grip);
  return {
    speed: scale(mine.speed, sLo, sHi),
    acceleration: scale(mine.acceleration, aLo, aHi),
    grip: scale(mine.grip, gLo, gHi),
  };
}

function carState(entry: CarEntry, save: SaveData): CarState {
  if (save.selected_car === entry.id) return "selected";
  if (save.owned_cars.includes(entry.id)) return "owned";
  return save.coins >= entry.price ? "affordable" : "locked";
}

export function garageCards(roster: CarRoster, save: SaveData): CarCard[] {
  return roster.cars.map((entry) => {
    const state = carState(entry, save);
    return {
      id: entry.id,
      name: entry.name,
      modelId: entry.model_id,
      price: entry.price,
      state,
      missing: state === "locked" ? entry.price - save.coins : 0,
      stats: carStats(entry, roster),
    };
  });
}
