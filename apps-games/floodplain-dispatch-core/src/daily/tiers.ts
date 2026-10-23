import type { PieceKind } from "../types";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EventPlan {
  type: "surge" | "drought" | "storm-tide";
  count: number;
  minDelta: number;
  maxDelta: number;
  minWeeks: number;
  maxWeeks: number;
}

export interface TidePlan {
  minPeriod: number;
  maxPeriod: number;
  minAmp: number;
  maxAmp: number;
}

export interface DailyTier {
  weekday: Weekday;
  name: string;
  width: number;
  height: number;
  weeks: number;
  inlets: number;
  rate: number;
  houses: number;
  fields: number;
  pieces: readonly PieceKind[];
  reach: number;
  minPar: number;
  events: readonly EventPlan[];
  tide: TidePlan | null;
}

const CB: readonly PieceKind[] = ["canal", "barrier"];
const CBP: readonly PieceKind[] = ["canal", "barrier", "pump"];
const CBPS: readonly PieceKind[] = ["canal", "barrier", "pump", "gate"];
const ALL: readonly PieceKind[] = ["canal", "barrier", "pump", "gate", "reservoir"];

const surges = (count: number, minDelta: number, maxDelta: number): EventPlan => ({
  type: "surge",
  count,
  minDelta,
  maxDelta,
  minWeeks: 2,
  maxWeeks: 3,
});

const droughts = (count: number): EventPlan => ({
  type: "drought",
  count,
  minDelta: 2,
  maxDelta: 3,
  minWeeks: 4,
  maxWeeks: 6,
});

export const DAILY_TIERS: readonly DailyTier[] = [
  {
    weekday: 0,
    minPar: 6,
    reach: 7,
    name: "Plain Monday",
    width: 8,
    height: 12,
    weeks: 20,
    inlets: 1,
    rate: 2,
    houses: 2,
    fields: 1,
    pieces: CB,
    events: [],
    tide: null,
  },
  {
    weekday: 1,
    minPar: 7,
    reach: 7,
    name: "Surge Tuesday",
    width: 8,
    height: 12,
    weeks: 22,
    inlets: 1,
    rate: 3,
    houses: 2,
    fields: 2,
    pieces: CB,
    events: [surges(1, 2, 3)],
    tide: null,
  },
  {
    weekday: 2,
    minPar: 9,
    reach: 8,
    name: "Double Surge Wednesday",
    width: 9,
    height: 13,
    weeks: 22,
    inlets: 1,
    rate: 3,
    houses: 3,
    fields: 2,
    pieces: CBP,
    events: [surges(2, 2, 3)],
    tide: null,
  },
  {
    weekday: 3,
    minPar: 11,
    reach: 8,
    name: "Gate Thursday",
    width: 10,
    height: 14,
    weeks: 24,
    inlets: 2,
    rate: 3,
    houses: 3,
    fields: 3,
    pieces: CBPS,
    events: [surges(2, 2, 4)],
    tide: null,
  },
  {
    weekday: 4,
    minPar: 13,
    reach: 9,
    name: "Reservoir Friday",
    width: 10,
    height: 14,
    weeks: 26,
    inlets: 2,
    rate: 3,
    houses: 4,
    fields: 3,
    pieces: ALL,
    events: [droughts(2), surges(1, 3, 4)],
    tide: null,
  },
  {
    weekday: 5,
    minPar: 14,
    reach: 9,
    name: "Tide Saturday",
    width: 11,
    height: 15,
    weeks: 26,
    inlets: 1,
    rate: 3,
    houses: 4,
    fields: 3,
    pieces: ALL,
    events: [surges(1, 3, 3)],
    tide: { minPeriod: 6, maxPeriod: 10, minAmp: 1, maxAmp: 2 },
  },
  {
    weekday: 6,
    minPar: 17,
    reach: 10,
    name: "Everything Sunday",
    width: 12,
    height: 16,
    weeks: 28,
    inlets: 2,
    rate: 3,
    houses: 5,
    fields: 4,
    pieces: ALL,
    events: [
      surges(2, 3, 4),
      droughts(1),
      { type: "storm-tide", count: 1, minDelta: 1, maxDelta: 2, minWeeks: 2, maxWeeks: 3 },
    ],
    tide: { minPeriod: 6, maxPeriod: 10, minAmp: 1, maxAmp: 3 },
  },
];

export function tierFor(weekday: number): DailyTier {
  const index = ((Math.trunc(weekday) % 7) + 7) % 7;
  return DAILY_TIERS[index] as DailyTier;
}
