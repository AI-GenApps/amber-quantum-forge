import type { OutcomeCounts, ShiftResult } from "../../src";

export interface ResultOptions {
  kind?: ShiftResult["kind"];
  day?: number;
  payments?: number;
  tips?: number;
  stars?: 1 | 2 | 3;
  counts?: Partial<OutcomeCounts>;
  mistakes?: number;
  run?: number;
  fp?: Array<[number, number]>;
  seen?: Array<[number, ShiftResult["regularOutcomes"][number]["outcome"]]>;
}

const BONUS = { 1: 5, 2: 10, 3: 20 } as const;

export function fakeResult(options: ResultOptions = {}): ShiftResult {
  const stars = options.stars ?? 2;
  const counts: OutcomeCounts = {
    delighted: 2,
    satisfied: 3,
    disappointed: 0,
    left: 0,
    ...options.counts,
  };
  const payments = options.payments ?? 40;
  const tips = options.tips ?? 6;
  const bonusCoins = BONUS[stars];
  const arrived = counts.delighted + counts.satisfied + counts.disappointed + counts.left;
  return {
    kind: options.kind ?? "day",
    day: options.day ?? 1,
    payments,
    tips,
    bonusCoins,
    coins: payments + tips + bonusCoins,
    grade: {
      stars,
      bonusCoins,
      good: arrived === 0 ? 0 : (counts.delighted + counts.satisfied) / arrived,
    },
    arrived,
    counts,
    turnedAway: 0,
    mistakes: options.mistakes ?? 0,
    longestDelightedRun: options.run ?? 2,
    fpGains: (options.fp ?? []).map(([regularId, fp]) => ({ regularId, fp })),
    regularOutcomes: (options.seen ?? []).map(([regularId, outcome]) => ({ regularId, outcome })),
  };
}
