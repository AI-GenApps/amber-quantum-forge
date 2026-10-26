import {
  defaultProfile,
  type Profile,
  type ProgressEvent,
  type ShiftResult,
  sceneFor,
} from "@web-games/the-last-window-core";
import type { ResultParams } from "../src/nav";
import { buildSummary } from "../src/screens/resultSummary";

export function shiftResult(overrides: Partial<ShiftResult> = {}): ShiftResult {
  return {
    kind: "day",
    day: 1,
    payments: 40,
    tips: 6,
    bonusCoins: 20,
    coins: 66,
    grade: { stars: 3, bonusCoins: 20, good: 1 },
    arrived: 6,
    counts: { delighted: 4, satisfied: 2, disappointed: 0, left: 0 },
    turnedAway: 0,
    mistakes: 1,
    longestDelightedRun: 4,
    fpGains: [{ regularId: 1, fp: 2 }],
    regularOutcomes: [{ regularId: 1, outcome: "delighted" }],
    ...overrides,
  };
}

export function sceneIds(...refs: Array<[number, number]>): string[] {
  return refs.map(([regular, index]) => sceneFor(regular, index)?.id ?? "");
}

export function resultParams(
  options: { day?: number; scenes?: string[]; events?: ProgressEvent[]; profile?: Profile } = {},
): ResultParams {
  const day = options.day ?? 1;
  const summary = buildSummary({
    kind: "day",
    day,
    result: shiftResult({ day }),
    events: options.events ?? [{ type: "friendship-level", regularId: 1, level: 1 }],
    queue: [],
    remainder: [],
    profile: options.profile ?? defaultProfile(),
  });
  return {
    target: { kind: "day", day },
    summary: { ...summary, scenes: options.scenes ?? [] },
    finale: false,
  };
}

/** A profile that finished the whole campaign with every regular fully befriended. */
export function lateProfile(overrides: Partial<Profile> = {}): Partial<Profile> {
  const base = defaultProfile();
  return { day: 15, coins: 500, ...overrides, regulars: base.regulars };
}
