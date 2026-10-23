import { createInitialState } from "../../src/state";
import type {
  BoonDef,
  Catalog,
  ConstellationDef,
  GameState,
  InstrumentDef,
  Point,
  UpgradeDef,
} from "../../src/types";

export const TELESCOPE: InstrumentDef = {
  id: "telescope",
  name: "Brass Telescope",
  baseCost: 15,
  baseSps: 0.2,
  growth: 1.12,
};

export const LENS: InstrumentDef = {
  id: "lens",
  name: "Lens Array",
  baseCost: 100,
  baseSps: 1.2,
  growth: 1.15,
};

export const UPGRADES: readonly UpgradeDef[] = [
  { id: "tel-1", instrumentId: "telescope", tier: 1, name: "Polished Brass" },
  { id: "tel-2", instrumentId: "telescope", tier: 2, name: "Steady Mount" },
  { id: "lens-1", instrumentId: "lens", tier: 1, name: "Ground Lenses" },
];

export const LYRE: ConstellationDef = {
  id: "lyre",
  name: "The Lyre",
  stars: [
    { x: 200, y: 300 },
    { x: 420, y: 250 },
    { x: 640, y: 320 },
    { x: 520, y: 520 },
    { x: 300, y: 540 },
  ],
  closed: false,
  cost: 60,
  requires: { instrumentId: "telescope", count: 2 },
};

export const CROWN: ConstellationDef = {
  id: "crown",
  name: "The Crown",
  stars: [
    { x: 200, y: 700 },
    { x: 350, y: 900 },
    { x: 550, y: 760 },
    { x: 750, y: 900 },
    { x: 800, y: 700 },
    { x: 500, y: 600 },
  ],
  closed: true,
  cost: 400,
  requires: { instrumentId: "telescope", count: 8 },
};

export const BOONS: readonly BoonDef[] = [
  {
    id: "dark-adapted",
    name: "Dark-Adapted Eyes",
    cost: 1,
    effect: { kind: "start-starlight", amount: 1000 },
  },
  {
    id: "brass-polish",
    name: "Brass Polish",
    cost: 2,
    effect: { kind: "instrument-mult", instrumentId: "telescope", factor: 2 },
  },
  {
    id: "night-watch",
    name: "Night Watch",
    cost: 4,
    effect: { kind: "offline-efficiency", value: 0.75 },
  },
];

export const CATALOG: Catalog = {
  instruments: [TELESCOPE, LENS],
  upgrades: UPGRADES,
  constellations: [LYRE, CROWN],
  boons: BOONS,
};

export const EXTRA_BOONS: readonly BoonDef[] = [
  { id: "clear-glass", name: "Clear Glass", cost: 3, effect: { kind: "cost-mult", factor: 0.95 } },
  {
    id: "apprentice",
    name: "Apprentice Bench",
    cost: 5,
    effect: { kind: "start-owned", owned: { telescope: 5, lens: 3 } },
  },
  { id: "atlas-ink", name: "Atlas Ink", cost: 8, effect: { kind: "atlas-factor", factor: 1.5 } },
  {
    id: "long-vigil",
    name: "Long Vigil",
    cost: 10,
    effect: { kind: "offline-efficiency", value: 1 },
  },
  {
    id: "second-sight",
    name: "Second Sight",
    cost: 12,
    effect: { kind: "upgrade-cost-mult", factor: 0.75 },
  },
  { id: "corona", name: "Corona", cost: 20, effect: { kind: "global-mult", factor: 1.5 } },
  { id: "totality", name: "Totality", cost: 40, effect: { kind: "global-mult", factor: 2 } },
];

export const FULL_CATALOG: Catalog = {
  ...CATALOG,
  upgrades: [
    ...UPGRADES,
    { id: "tel-3", instrumentId: "telescope", tier: 3, name: "Observatory Dome" },
  ],
  boons: [...BOONS, ...EXTRA_BOONS],
};

export function stateWith(patch: Partial<GameState> = {}): GameState {
  return { ...createInitialState(CATALOG), ...patch };
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function lcg(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current = (Math.imul(current, 1664525) + 1013904223) >>> 0;
    return current / 4294967296;
  };
}

export function ringLayout(count: number, radius = 300): Point[] {
  return Array.from({ length: count }, (_, i) => ({
    x: 500 + radius * Math.cos((2 * Math.PI * i) / count),
    y: 700 + radius * Math.sin((2 * Math.PI * i) / count),
  }));
}
