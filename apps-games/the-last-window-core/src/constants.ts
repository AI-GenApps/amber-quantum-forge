import type { Outcome, Weather } from "./types";

export const TICK_MS = 100;
export const SHIFT_TICKS = { short: 1800, medium: 2100, long: 2400 } as const;
export const SEATS = 3;
export const DOOR_WAIT_TICKS = 50;
export const ARRIVAL_CUTOFF_TICKS = 200;
export const ARRIVAL_MIN_GAP_TICKS = 30;
export const FIRST_ARRIVAL_TICK = 10;
export const PATIENCE_WARNING_TICKS = 100;
export const WALKIN_LOOKS = 6;

export const STEP_TICKS = { brew: 8, steam: 6, water: 5, warm: 12 } as const;
export const PLATES = 2;
export const PORTIONS_PER_KIND = 5;
export const BASE_PASTRY_SLOTS = 3;
export const BASE_BOOK_SLOTS = 3;

export const DELIGHTED_PATIENCE_PCT = 35;
export const SATISFIED_MATCH_PCT = 60;
export const SCORE_EXACT = 10;
export const SCORE_PASTRY_SUBSTITUTE = 5;
export const SCORE_BOOK_OTHER_MOOD = 3;
export const SCORE_MISSING = 0;
export const SUBSTITUTE_MIN_PAYMENT = 1;
export const WRONG_MOOD_BOOK_PAYMENT = 1;

export const TIP_DELIGHTED_PCT = 40;
export const TIP_SATISFIED_PCT = 15;
export const FP_DELIGHTED = 2;
export const FP_SATISFIED = 1;
export const FP_PER_SERVE_MAX = 3;
export const FP_CAP = 8;
export const FRIENDSHIP_THRESHOLDS: readonly number[] = [1, 2, 4, 6, 8];

export const GRADE_THREE_STAR_GOOD_PCT = 80;
export const GRADE_TWO_STAR_GOOD_PCT = 60;
export const GRADE_BONUS_THREE = 20;
export const GRADE_BONUS_TWO = 10;
export const GRADE_BONUS_ONE = 5;

export const MAX_SCENES_PER_EVENING = 4;
export const MAX_SCENES_FINALE_EVENING = 8;
export const FINALE_DAY = 14;
export const SCENES_PER_REGULAR = 5;
export const SCENE_GIFT = 5;
export const FINAL_SCENE_GIFT = 15;

export const FAVOURITE_PCT = 70;
export const REGULAR_MOOD_PICK_PCT = 50;

export interface WeatherRule {
  pastryChancePct: number;
  bookChancePct: number;
  extraCustomers: number;
  patienceSeconds: number;
}

export const WEATHER_RULES: Readonly<Record<Weather, WeatherRule>> = {
  morning: { pastryChancePct: 70, bookChancePct: 20, extraCustomers: 0, patienceSeconds: 0 },
  evening: { pastryChancePct: 45, bookChancePct: 45, extraCustomers: 0, patienceSeconds: 0 },
  rain: { pastryChancePct: 55, bookChancePct: 30, extraCustomers: 1, patienceSeconds: 6 },
};

export interface PatienceRow {
  fromDay: number;
  toDay: number;
  seconds: number;
}

export const PATIENCE_TABLE: readonly PatienceRow[] = [
  { fromDay: 1, toDay: 1, seconds: 60 },
  { fromDay: 2, toDay: 3, seconds: 50 },
  { fromDay: 4, toDay: 8, seconds: 45 },
  { fromDay: 9, toDay: 14, seconds: 40 },
];

export const RELAXED_MULTIPLIER = 1.5;
export const LATE_PATIENCE_START_SECONDS = 40;
export const LATE_PATIENCE_FLOOR_SECONDS = 34;
export const LATE_PATIENCE_STEP_SHIFTS = 5;

export const OUTCOMES: readonly Outcome[] = ["delighted", "satisfied", "disappointed", "left"];
