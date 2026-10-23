import { daysBetween } from "@web-games/kit";
import {
  applyDailySolve,
  archiveKeys,
  archiveReward,
  bestStars,
  type ChapterId,
  chapterReward,
  chaptersCleared,
  dailyReward,
  getPuzzle,
  grant,
  newlyUnlocked,
  refreshOnOpen as refreshStreak,
  type StreakEvent,
  type StreakState,
  spendHint as spendToken,
  starsForHints,
  totalStars,
} from "@web-games/lantern-loops-core";
import type { Profile } from "../save/profile";

const ARCHIVE_REWARD_WINDOW_DAYS = 40;

export interface Reward {
  /** Tokens that reached the balance. */
  tokensGranted: number;
  /** True when the token jar was full and part of the reward was dropped. */
  tokensCapped: boolean;
  balance: number;
}

export interface PuzzleResult extends Reward {
  kind: "campaign";
  id: string;
  stars: number;
  previousStars: number;
  newBestTime: boolean;
  chaptersUnlocked: ChapterId[];
  chaptersCleared: ChapterId[];
}

export interface DailyResult extends Reward {
  kind: "daily" | "archive";
  dateKey: string;
  stars: number;
  previousStars: number;
  /** False on a replay: no tokens and no streak change. */
  firstSolve: boolean;
  streak: number;
  streakCounted: boolean;
  events: StreakEvent[];
}

export interface HintResult {
  ok: boolean;
  balance: number;
}

export interface SolveInput {
  hints: number;
  seconds: number;
}

export interface Step<R> {
  profile: Profile;
  result: R;
}

function cleanSeconds(seconds: number): number {
  return Number.isFinite(seconds) ? Math.max(1, Math.round(seconds)) : 1;
}

function pay(profile: Profile, amount: number): { profile: Profile; reward: Reward } {
  const { balance, granted, capped } = grant(profile.tokens, amount);
  return {
    profile: { ...profile, tokens: balance },
    reward: { tokensGranted: granted, tokensCapped: capped, balance },
  };
}

export function streakOf(profile: Profile): StreakState {
  return {
    streak: profile.streak,
    bestStreak: profile.bestStreak,
    lastDailyDate: profile.lastDailyDate,
    freezes: profile.freezes,
    freezeWeek: profile.freezeWeek,
    milestonesGranted: profile.milestonesGranted,
  };
}

function withStreak(profile: Profile, state: StreakState): Profile {
  return {
    ...profile,
    streak: state.streak,
    bestStreak: state.bestStreak,
    lastDailyDate: state.lastDailyDate,
    freezes: state.freezes,
    freezeWeek: state.freezeWeek,
    milestonesGranted: [...state.milestonesGranted],
  };
}

export function completePuzzle(
  profile: Profile,
  id: string,
  input: SolveInput,
): Step<PuzzleResult> {
  if (getPuzzle(id) === undefined) throw new RangeError(`Unknown campaign puzzle: ${id}`);
  const seconds = cleanSeconds(input.seconds);
  const previousStars = profile.stars[id] ?? 0;
  const stars = bestStars(previousStars, starsForHints(input.hints));
  const previousTime = profile.bestTimes[id];
  const newBestTime = previousTime === undefined || seconds < previousTime;

  let next: Profile = {
    ...profile,
    stars: { ...profile.stars, [id]: stars },
    bestTimes: newBestTime ? { ...profile.bestTimes, [id]: seconds } : profile.bestTimes,
    playSeconds: profile.playSeconds + seconds,
  };
  const unlocked = newlyUnlocked(totalStars(profile.stars), totalStars(next.stars));
  const cleared = chaptersCleared(next.stars).filter((c) => !profile.chaptersCleared.includes(c));
  next = { ...next, chaptersCleared: [...profile.chaptersCleared, ...cleared] };
  const paid = pay(next, cleared.length * chapterReward());
  return {
    profile: paid.profile,
    result: {
      kind: "campaign",
      id,
      stars,
      previousStars,
      newBestTime,
      chaptersUnlocked: unlocked,
      chaptersCleared: cleared,
      ...paid.reward,
    },
  };
}

function recordDaily(profile: Profile, dateKey: string, stars: number, seconds: number): Profile {
  const old = profile.dailiesSolved[dateKey];
  return {
    ...profile,
    dailiesSolved: {
      ...profile.dailiesSolved,
      [dateKey]: {
        stars: bestStars(old?.stars, stars),
        seconds: old === undefined ? seconds : Math.min(old.seconds, seconds),
      },
    },
    playSeconds: profile.playSeconds + seconds,
  };
}

export function completeDaily(
  profile: Profile,
  today: string,
  input: SolveInput,
): Step<DailyResult> {
  const seconds = cleanSeconds(input.seconds);
  const stars = starsForHints(input.hints);
  const previousStars = profile.dailiesSolved[today]?.stars ?? 0;
  const firstSolve = profile.dailiesSolved[today] === undefined;
  const recorded = recordDaily(profile, today, stars, seconds);
  if (!firstSolve) {
    return {
      profile: recorded,
      result: {
        kind: "daily",
        dateKey: today,
        stars: Math.max(previousStars, stars),
        previousStars,
        firstSolve,
        streak: recorded.streak,
        streakCounted: false,
        events: [],
        tokensGranted: 0,
        tokensCapped: false,
        balance: recorded.tokens,
      },
    };
  }
  const gap = profile.lastDailyDate === null ? null : daysBetween(profile.lastDailyDate, today);
  const solved = applyDailySolve(streakOf(recorded), {
    today,
    daysSinceLast: gap,
    hints: input.hints,
  });
  const milestone = solved.events.reduce(
    (sum, event) => (event.kind === "milestone" ? sum + event.tokens : sum),
    0,
  );
  const paid = pay(withStreak(recorded, solved.state), dailyReward(input.hints) + milestone);
  return {
    profile: paid.profile,
    result: {
      kind: "daily",
      dateKey: today,
      stars,
      previousStars,
      firstSolve,
      streak: solved.state.streak,
      streakCounted: solved.counted,
      events: solved.events,
      ...paid.reward,
    },
  };
}

export function completeArchive(
  profile: Profile,
  today: string,
  dateKey: string,
  input: SolveInput,
): Step<DailyResult> {
  if (!archiveKeys(today).includes(dateKey)) {
    throw new RangeError(`${dateKey} is not in the archive window of ${today}`);
  }
  const seconds = cleanSeconds(input.seconds);
  const stars = starsForHints(input.hints);
  const previous = profile.dailiesSolved[dateKey];
  const firstSolve = previous === undefined;
  const recorded = recordDaily(profile, dateKey, stars, seconds);
  const earns = firstSolve && !profile.archiveRewarded.includes(dateKey);
  const amount = earns ? archiveReward(input.hints) : 0;
  const rewarded = amount > 0 ? [...profile.archiveRewarded, dateKey] : profile.archiveRewarded;
  const recent = rewarded.filter(
    (key) => daysBetween(key, today) <= ARCHIVE_REWARD_WINDOW_DAYS && daysBetween(key, today) >= 0,
  );
  const paid = pay({ ...recorded, archiveRewarded: recent }, amount);
  return {
    profile: paid.profile,
    result: {
      kind: "archive",
      dateKey,
      stars: Math.max(previous?.stars ?? 0, stars),
      previousStars: previous?.stars ?? 0,
      firstSolve,
      streak: profile.streak,
      streakCounted: false,
      events: [],
      ...paid.reward,
    },
  };
}

export function spendHint(profile: Profile): Step<HintResult> {
  const spent = spendToken(profile.tokens);
  if (!spent.ok) return { profile, result: { ok: false, balance: spent.balance } };
  return {
    profile: { ...profile, tokens: spent.balance, hintsUsed: profile.hintsUsed + 1 },
    result: { ok: true, balance: spent.balance },
  };
}

export interface OpenResult {
  events: StreakEvent[];
}

export function refreshOnOpen(profile: Profile, today: string): Step<OpenResult> {
  const refreshed = refreshStreak(streakOf(profile), { today });
  return { profile: withStreak(profile, refreshed.state), result: { events: refreshed.events } };
}
