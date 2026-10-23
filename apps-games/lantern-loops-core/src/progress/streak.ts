import { isoWeekKey } from "./calendar";
import { MILESTONE_DAYS, milestoneReward } from "./tokens";

export const MAX_FREEZES = 1;

export interface StreakState {
  readonly streak: number;
  readonly bestStreak: number;
  /** Date key of the last daily solved on its own date, or null. */
  readonly lastDailyDate: string | null;
  readonly freezes: number;
  /** ISO week key of the last freeze refill check, "" before the first open. */
  readonly freezeWeek: string;
  /** Milestone days already paid in the current streak run. */
  readonly milestonesGranted: readonly number[];
}

export type StreakEvent =
  | { readonly kind: "freeze-used" }
  | { readonly kind: "streak-reset"; readonly previous: number }
  | { readonly kind: "milestone"; readonly days: number; readonly tokens: number }
  | { readonly kind: "clock-went-back" }
  | { readonly kind: "freeze-refilled" };

export interface StreakResult {
  readonly state: StreakState;
  readonly events: StreakEvent[];
  /** False when the solve did not count for the streak (same day, or the clock went back). */
  readonly counted: boolean;
}

export interface DailySolveInput {
  readonly today: string;
  /** Days from the last streak solve to `today`; null when there is none. */
  readonly daysSinceLast: number | null;
  readonly hints: number;
}

export const initialStreak: StreakState = {
  streak: 0,
  bestStreak: 0,
  lastDailyDate: null,
  freezes: 1,
  freezeWeek: "",
  milestonesGranted: [],
};

function milestoneEvents(state: StreakState): { state: StreakState; events: StreakEvent[] } {
  const days = state.streak;
  const tokens = milestoneReward(days);
  if (!MILESTONE_DAYS.includes(days) || state.milestonesGranted.includes(days)) {
    return { state, events: [] };
  }
  return {
    state: { ...state, milestonesGranted: [...state.milestonesGranted, days] },
    events: [{ kind: "milestone", days, tokens }],
  };
}

/** Streak after a daily solved on `today`. Idempotent for the same day. */
export function applyDailySolve(state: StreakState, input: DailySolveInput): StreakResult {
  const { today, daysSinceLast } = input;
  if (daysSinceLast !== null && daysSinceLast < 0) {
    return { state, events: [{ kind: "clock-went-back" }], counted: false };
  }
  if (daysSinceLast === 0) return { state, events: [], counted: false };

  const events: StreakEvent[] = [];
  let next: StreakState = { ...state, lastDailyDate: today };
  if (daysSinceLast === null) {
    next = { ...next, streak: 1, milestonesGranted: [] };
  } else if (daysSinceLast === 1) {
    next = { ...next, streak: state.streak + 1 };
  } else if (daysSinceLast === 2 && state.freezes > 0) {
    events.push({ kind: "freeze-used" });
    next = { ...next, streak: state.streak + 1, freezes: state.freezes - 1 };
  } else {
    if (state.streak > 0) events.push({ kind: "streak-reset", previous: state.streak });
    next = { ...next, streak: 1, milestonesGranted: [] };
  }
  next = { ...next, bestStreak: Math.max(next.bestStreak, next.streak) };
  const milestone = milestoneEvents(next);
  return { state: milestone.state, events: [...events, ...milestone.events], counted: true };
}

/** First open of a new ISO week refills the freeze to the cap. Never refills twice in a week. */
export function refreshOnOpen(
  state: StreakState,
  input: { today: string },
): { state: StreakState; events: StreakEvent[] } {
  const week = isoWeekKey(input.today);
  if (week < state.freezeWeek) return { state, events: [{ kind: "clock-went-back" }] };
  if (week === state.freezeWeek) return { state, events: [] };
  const freezes = Math.max(state.freezes, MAX_FREEZES);
  const events: StreakEvent[] = freezes > state.freezes ? [{ kind: "freeze-refilled" }] : [];
  return { state: { ...state, freezes, freezeWeek: week }, events };
}

/** The streak to show: 0 once a missed day can no longer be saved by a freeze. */
export function liveStreak(state: StreakState, daysSinceLast: number | null): number {
  if (daysSinceLast === null || daysSinceLast <= 1) return state.streak;
  if (daysSinceLast === 2 && state.freezes > 0) return state.streak;
  return 0;
}
