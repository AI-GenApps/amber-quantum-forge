import { CHALLENGE_BY_ID } from "../content";
import { CHAPTERS } from "../content/chapters";
import { PIECES_BY_THEME } from "../content/pieces";
import type { Stars } from "../types";
import { payAffinity } from "./affinity";
import { MAX_FREEZES, toStars } from "./profile";
import { addStat, appendHistory } from "./records";
import {
  type BestResult,
  FRAME_IDS,
  type FrameId,
  type Profile,
  type ProgressEvent,
  type ProgressUpdate,
  type SpendReason,
} from "./types";
import { chapterCleared, chapterUnlockedAt, totalStarsOf } from "./unlocks";

export const FIRST_CLEAR_COINS = 10;
export const STAR_COINS = 5;
export const CHAPTER_BONUS_COINS = 40;
export const HINT_PRICE = { campaign: 20, daily: 30 } as const;
export const FREEZE_PRICE = 25;
export const FRAME_PRICE: Readonly<Record<Exclude<FrameId, "plain">, number>> = {
  paper: 30,
  polaroid: 40,
  magazine: 60,
};

export type HintKind = keyof typeof HINT_PRICE;

export type EconomyFailure =
  | "INSUFFICIENT_COINS"
  | "MAX_FREEZES"
  | "ALREADY_OWNED"
  | "NOT_OWNED"
  | "UNKNOWN_FRAME";

export type EconomyResult =
  | ({ readonly ok: true } & ProgressUpdate)
  | { readonly ok: false; readonly reason: EconomyFailure };

export interface CampaignScore {
  readonly stars: Stars;
  readonly harmony: number;
  readonly spend: number;
}

function gained(
  events: ProgressEvent[],
  amount: number,
  reason: "first-clear" | "star" | "chapter-bonus",
): number {
  if (amount > 0) events.push({ type: "coins-gained", amount, reason });
  return amount;
}

function unlockEvents(before: number, after: number): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  for (const chapter of CHAPTERS) {
    if (chapterUnlockedAt(chapter.index, before) || !chapterUnlockedAt(chapter.index, after)) {
      continue;
    }
    let closetSize = 0;
    for (const other of CHAPTERS) {
      if (chapterUnlockedAt(other.index, after))
        closetSize += PIECES_BY_THEME[other.themeId].length;
    }
    events.push({ type: "chapter-unlocked", chapterIndex: chapter.index });
    events.push({
      type: "pieces-unlocked",
      chapterIndex: chapter.index,
      count: PIECES_BY_THEME[chapter.themeId].length,
      closetSize,
    });
  }
  return events;
}

export function applyCampaignResult(
  profile: Profile,
  challengeId: string,
  score: CampaignScore,
  dateKey = "",
): ProgressUpdate {
  const def = CHALLENGE_BY_ID.get(challengeId);
  if (def === undefined) return { profile, events: [] };
  const stars = toStars(score.stars);
  const previous = profile.stars[challengeId] ?? 0;
  const improved = stars > previous;
  const oldBest = profile.best[challengeId];
  const sharperBest = stars === previous && stars > 0 && score.harmony > (oldBest?.harmony ?? -1);
  const events: ProgressEvent[] = [];
  let coins = profile.coins;
  const nextStars: Record<string, Stars> = { ...profile.stars };
  const nextBest: Record<string, BestResult> = { ...profile.best };
  if (improved) {
    nextStars[challengeId] = stars;
    events.push({ type: "star-gained", challengeId, from: previous as Stars, to: stars });
    if (previous === 0) coins += gained(events, FIRST_CLEAR_COINS, "first-clear");
    coins += gained(events, STAR_COINS * (stars - previous), "star");
  }
  if (improved || sharperBest) {
    nextBest[challengeId] = { stars, harmony: score.harmony, spend: score.spend };
  }
  let next: Profile = { ...profile, coins, stars: nextStars, best: nextBest };
  const claimed = { ...next.chapterBonusClaimed };
  const chapter = CHAPTERS[def.chapterIndex];
  if (
    chapter !== undefined &&
    claimed[chapter.themeId] !== true &&
    chapterCleared(nextStars, def.chapterIndex)
  ) {
    claimed[chapter.themeId] = true;
    next = {
      ...next,
      coins: next.coins + gained(events, CHAPTER_BONUS_COINS, "chapter-bonus"),
      chapterBonusClaimed: claimed,
    };
    events.push({
      type: "chapter-bonus",
      chapterIndex: def.chapterIndex,
      amount: CHAPTER_BONUS_COINS,
    });
  }
  const paid = payAffinity(next, def.clientId);
  next = paid.profile;
  events.push(...paid.events);
  events.push(...unlockEvents(totalStarsOf(profile.stars), totalStarsOf(nextStars)));
  next = appendHistory(next, {
    kind: "campaign",
    ref: challengeId,
    stars,
    harmony: score.harmony,
    key: dateKey,
  });
  if (stars >= 1) next = addStat(next, "looksFinished");
  if (improved) next = addStat(next, "starsEarned", stars - previous);
  return { profile: next, events };
}

function spend(profile: Profile, price: number, reason: SpendReason): EconomyResult {
  if (profile.coins < price) return { ok: false, reason: "INSUFFICIENT_COINS" };
  return {
    ok: true,
    profile: { ...profile, coins: profile.coins - price },
    events: [{ type: "coins-spent", amount: price, reason }],
  };
}

export function buyHint(profile: Profile, kind: HintKind): EconomyResult {
  const result = spend(profile, HINT_PRICE[kind], "hint");
  return result.ok ? { ...result, profile: addStat(result.profile, "hintsUsed") } : result;
}

export function buyFreeze(profile: Profile): EconomyResult {
  if (profile.streakFreezes >= MAX_FREEZES) return { ok: false, reason: "MAX_FREEZES" };
  const result = spend(profile, FREEZE_PRICE, "freeze");
  return result.ok
    ? { ...result, profile: { ...result.profile, streakFreezes: profile.streakFreezes + 1 } }
    : result;
}

function isPaidFrame(frame: string): frame is Exclude<FrameId, "plain"> {
  return frame in FRAME_PRICE;
}

export function buyFrame(profile: Profile, frame: string): EconomyResult {
  if (!isPaidFrame(frame)) {
    const known = (FRAME_IDS as readonly string[]).includes(frame);
    return { ok: false, reason: known ? "ALREADY_OWNED" : "UNKNOWN_FRAME" };
  }
  if (profile.framesOwned.includes(frame)) return { ok: false, reason: "ALREADY_OWNED" };
  const result = spend(profile, FRAME_PRICE[frame], "frame");
  if (!result.ok) return result;
  const owned = FRAME_IDS.filter((id) => id === frame || profile.framesOwned.includes(id));
  return { ...result, profile: { ...result.profile, framesOwned: owned } };
}

export function selectFrame(profile: Profile, frame: string): EconomyResult {
  const known = FRAME_IDS.find((id) => id === frame);
  if (known === undefined) return { ok: false, reason: "UNKNOWN_FRAME" };
  if (!profile.framesOwned.includes(known)) return { ok: false, reason: "NOT_OWNED" };
  return { ok: true, profile: { ...profile, frameSelected: known }, events: [] };
}
