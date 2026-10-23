import type { BoonDef } from "../types";

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
  { id: "clear-glass", name: "Clear Glass", cost: 3, effect: { kind: "cost-mult", factor: 0.95 } },
  {
    id: "night-watch",
    name: "Night Watch",
    cost: 4,
    effect: { kind: "offline-efficiency", value: 0.75 },
  },
  {
    id: "apprentice",
    name: "The Apprentice's Bench",
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
