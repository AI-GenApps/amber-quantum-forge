import {
  GRADE_BONUS_ONE,
  GRADE_BONUS_THREE,
  GRADE_BONUS_TWO,
  GRADE_THREE_STAR_GOOD_PCT,
  GRADE_TWO_STAR_GOOD_PCT,
} from "../constants";
import type { Grade, GradeSummary, Outcome, ShiftResult, ShiftState } from "../types";

export function gradeShift(summary: GradeSummary): Grade {
  const good = summary.counts.delighted + summary.counts.satisfied;
  const ratio = summary.arrived === 0 ? 0 : good / summary.arrived;
  if (
    summary.arrived > 0 &&
    good * 100 >= GRADE_THREE_STAR_GOOD_PCT * summary.arrived &&
    summary.counts.left === 0
  ) {
    return { stars: 3, bonusCoins: GRADE_BONUS_THREE, good: ratio };
  }
  if (summary.arrived > 0 && good * 100 >= GRADE_TWO_STAR_GOOD_PCT * summary.arrived) {
    return { stars: 2, bonusCoins: GRADE_BONUS_TWO, good: ratio };
  }
  return { stars: 1, bonusCoins: GRADE_BONUS_ONE, good: ratio };
}

export function longestDelightedRun(resolved: readonly Outcome[]): number {
  let best = 0;
  let run = 0;
  for (const outcome of resolved) {
    run = outcome === "delighted" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function buildResult(state: ShiftState): ShiftResult {
  const stats = state.stats;
  const grade = gradeShift({ counts: stats.counts, arrived: stats.arrived });
  return {
    kind: state.def.kind,
    day: state.def.day,
    payments: stats.payments,
    tips: stats.tips,
    bonusCoins: grade.bonusCoins,
    coins: stats.payments + stats.tips + grade.bonusCoins,
    grade,
    arrived: stats.arrived,
    counts: { ...stats.counts },
    turnedAway: stats.turnedAway,
    mistakes: stats.mistakes,
    longestDelightedRun: longestDelightedRun(stats.resolved),
    fpGains: stats.fpGains.map((entry) => ({ ...entry })),
    regularOutcomes: stats.regularOutcomes.map((entry) => ({ ...entry })),
  };
}
