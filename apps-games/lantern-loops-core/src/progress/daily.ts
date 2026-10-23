import { GENERATOR_VERSION, type GenParams, type GenResult, generatePuzzle } from "../gen/generate";
import type { Mechanics, Range } from "../gen/ranges";
import { createRng, hashText, mixSeed } from "../gen/rng";
import { COLOURS, type Colour } from "../puzzle";
import type { Weekday } from "./calendar";

export { GENERATOR_VERSION };

export interface DailyTier {
  readonly weekday: Weekday;
  readonly dayName: string;
  /** 1 (easy) to 7 (hardest). */
  readonly tier: number;
  readonly size: number;
  readonly mechanics: Mechanics;
  /** Lantern colours used: inclusive range of how many. */
  readonly colourCount: Range;
  /** Accepted difficulty rating range handed to the generator. */
  readonly rating: Range;
}

const LANTERNS: Mechanics = { stones: false, mirrors: false, gates: false };
const STONES: Mechanics = { stones: true, mirrors: false, gates: false };
const MIRRORS: Mechanics = { stones: true, mirrors: true, gates: false };
const ALL: Mechanics = { stones: true, mirrors: true, gates: true };

/** The seven weekday templates of `product.md` (Daily). Changing any value changes every daily. */
export const DAILY_TIERS: readonly DailyTier[] = [
  {
    weekday: 1,
    dayName: "Monday",
    tier: 1,
    size: 5,
    mechanics: LANTERNS,
    colourCount: [1, 1],
    rating: [1, 1],
  },
  {
    weekday: 2,
    dayName: "Tuesday",
    tier: 2,
    size: 6,
    mechanics: STONES,
    colourCount: [1, 1],
    rating: [1, 2],
  },
  {
    weekday: 3,
    dayName: "Wednesday",
    tier: 3,
    size: 7,
    mechanics: STONES,
    colourCount: [1, 1],
    rating: [2, 3],
  },
  {
    weekday: 4,
    dayName: "Thursday",
    tier: 4,
    size: 7,
    mechanics: MIRRORS,
    colourCount: [1, 1],
    rating: [2, 3],
  },
  {
    weekday: 5,
    dayName: "Friday",
    tier: 5,
    size: 8,
    mechanics: MIRRORS,
    colourCount: [1, 1],
    rating: [3, 4],
  },
  {
    weekday: 6,
    dayName: "Saturday",
    tier: 6,
    size: 8,
    mechanics: ALL,
    colourCount: [2, 3],
    rating: [3, 4],
  },
  {
    weekday: 7,
    dayName: "Sunday",
    tier: 7,
    size: 9,
    mechanics: ALL,
    colourCount: [3, 5],
    rating: [3, 5],
  },
];

export const DAILY_ATTEMPTS = 8;
export const DAILY_ANCHOR_SHARE = 40;

export function dailyTier(weekday: Weekday): DailyTier {
  return DAILY_TIERS[weekday - 1] as DailyTier;
}

export function dailyId(dateKey: string): string {
  return `daily-${dateKey}`;
}

/** The generator seed: the app's date seed mixed with the generator version. */
export function dailyGenSeed(seed: number): number {
  return hashText(`${GENERATOR_VERSION}|daily|${seed >>> 0}`);
}

function pickColours(genSeed: number, tier: DailyTier): readonly Colour[] {
  if (tier.colourCount[1] === 1) return ["amber"];
  const rng = createRng(mixSeed(genSeed, 0x636f6c));
  const count = rng.between(tier.colourCount[0], tier.colourCount[1]);
  return rng.shuffle(COLOURS).slice(0, count);
}

export function dailyParams(weekday: Weekday, seed = 0, id?: string): GenParams {
  const tier = dailyTier(weekday);
  const colours = pickColours(dailyGenSeed(seed), tier);
  return {
    ...(id === undefined ? {} : { id }),
    size: tier.size,
    mechanics: tier.mechanics,
    colours,
    relaxStones: tier.mechanics.mirrors,
    maxAnchorShare: DAILY_ANCHOR_SHARE,
    rating: tier.rating,
    attempts: DAILY_ATTEMPTS,
  };
}

/** Deterministic daily puzzle for the date seed and ISO weekday; same input, same board. */
export function generateDaily(seed: number, weekday: Weekday, id?: string): GenResult {
  return generatePuzzle(dailyParams(weekday, seed, id), dailyGenSeed(seed));
}
