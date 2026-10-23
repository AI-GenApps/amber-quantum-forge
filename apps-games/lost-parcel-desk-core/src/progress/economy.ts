import { CHAPTERS, chapterOf, getCase, PEOPLE, THEMES } from "../content";
import { requestHint } from "../hints";
import type { CaseDef, CaseState, HintRejection, HintResult, Person } from "../types";
import { MAX_FREEZES, type Profile, type RunKind, type StampCount } from "./profile";
import { appendHistory } from "./records";
import { chapterUnlocked, isClosed, themesUnlocked } from "./unlocks";

export const FIRST_CLOSE_POSTAGE = 10 as const;
export const STAMP_POSTAGE = 5 as const;
export const CHAPTER_BONUS = 40 as const;
export const HINT_PRICE: Readonly<Record<RunKind, number>> = { campaign: 20, daily: 15 };
export const FREEZE_PRICE = 30 as const;

export type PostageReason =
  | "first-close"
  | "stamp"
  | "chapter-bonus"
  | "daily-clear"
  | "streak-bonus";

export type EconomyEvent =
  | { type: "postage-gained"; amount: number; reason: PostageReason }
  | { type: "postage-spent"; amount: number; reason: "hint" | "freeze" }
  | { type: "chapter-bonus"; chapter: number; amount: number }
  | { type: "theme-unlocked"; themeId: string }
  | { type: "chapter-unlocked"; chapter: number }
  | { type: "stamp-gained"; caseId: string; stamps: number; previous: number }
  | { type: "ledger-unlocked"; caseId: string }
  | { type: "streak-extended"; streak: number }
  | { type: "streak-reset" }
  | { type: "freeze-used"; count: number }
  | { type: "achievement-earned"; id: string };

export interface CaseResult {
  stamps: number;
  hints: number;
  timeMs: number;
  wrongAccusations: number;
  cluesFound: number;
  byElimination: boolean;
}

export interface Applied {
  profile: Profile;
  events: EconomyEvent[];
}

export function resultOf(state: CaseState): CaseResult {
  return {
    stamps: state.stamps ?? 0,
    hints: state.hintsUsed,
    timeMs: state.elapsedMs,
    wrongAccusations: state.wrongAccusations,
    cluesFound: state.foundClueIds.length,
    byElimination: state.byElimination,
  };
}

function toStampCount(value: number): StampCount {
  return Math.max(0, Math.min(3, Math.floor(value))) as StampCount;
}

function unlockEvents(before: Profile, after: Profile): EconomyEvent[] {
  const events: EconomyEvent[] = [];
  for (const chapter of CHAPTERS) {
    if (!chapterUnlocked(before, chapter.id) && chapterUnlocked(after, chapter.id)) {
      events.push({ type: "chapter-unlocked", chapter: chapter.id });
    }
  }
  const had = new Set(themesUnlocked(before).map((theme) => theme.id));
  for (const theme of THEMES) {
    if (!had.has(theme.id) && themesUnlocked(after).some((item) => item.id === theme.id)) {
      events.push({ type: "theme-unlocked", themeId: theme.id });
    }
  }
  return events;
}

export function applyCaseResult(profile: Profile, caseId: string, result: CaseResult): Applied {
  const chapter = chapterOf(caseId);
  if (getCase(caseId) === undefined || chapter === undefined || result.stamps < 1) {
    return { profile, events: [] };
  }
  const stamps = toStampCount(result.stamps);
  const before = profile.cases[caseId];
  const previous = before?.stamps ?? 0;
  const events: EconomyEvent[] = [];
  let postage = profile.postage;
  const pay = (amount: number, reason: PostageReason) => {
    postage += amount;
    events.push({ type: "postage-gained", amount, reason });
  };

  if (previous === 0) pay(FIRST_CLOSE_POSTAGE, "first-close");
  if (stamps > previous) {
    events.push({ type: "stamp-gained", caseId, stamps, previous });
    pay(STAMP_POSTAGE * (stamps - previous), "stamp");
  }
  if (previous === 0) events.push({ type: "ledger-unlocked", caseId });

  const better =
    stamps > previous || (stamps === previous && result.hints < (before?.hintsOnBest ?? 0));
  const times = [before?.bestTimeMs, result.timeMs].filter(
    (time): time is number => typeof time === "number",
  );
  const cases = {
    ...profile.cases,
    [caseId]: {
      stamps: toStampCount(Math.max(stamps, previous)),
      bestTimeMs: times.length === 0 ? null : Math.min(...times),
      hintsOnBest: before === undefined || better ? result.hints : before.hintsOnBest,
      closedCount: (before?.closedCount ?? 0) + 1,
    },
  };

  const claimed = { ...profile.chapterBonusClaimed };
  const key = String(chapter.id);
  const finished = chapter.caseIds.every((id) => id === caseId || isClosed(profile, id));
  if (finished && claimed[key] !== true) {
    claimed[key] = true;
    pay(CHAPTER_BONUS, "chapter-bonus");
    events.push({ type: "chapter-bonus", chapter: chapter.id, amount: CHAPTER_BONUS });
  }

  const next: Profile = {
    ...profile,
    postage,
    cases,
    chapterBonusClaimed: claimed,
    history: appendHistory(profile.history, {
      kind: "campaign",
      id: caseId,
      stamps,
      hints: result.hints,
    }),
    stats: {
      ...profile.stats,
      casesClosed: profile.stats.casesClosed + 1,
      accusations:
        profile.stats.accusations + result.wrongAccusations + (result.byElimination ? 0 : 1),
      wrongAccusations: profile.stats.wrongAccusations + result.wrongAccusations,
      cluesFound: profile.stats.cluesFound + result.cluesFound,
    },
  };
  return { profile: next, events: [...events, ...unlockEvents(profile, next)] };
}

export type PurchaseFailure = "INSUFFICIENT_POSTAGE" | "FREEZES_FULL";
export type HintFailure = "INSUFFICIENT_POSTAGE" | HintRejection;

export type HintPurchase =
  | { ok: false; reason: HintFailure }
  | {
      ok: true;
      profile: Profile;
      state: CaseState;
      hint: Extract<HintResult, { ok: true }>;
      events: EconomyEvent[];
    };

export function buyHint(
  profile: Profile,
  def: CaseDef,
  state: CaseState,
  kind: RunKind,
  people: readonly Person[] = PEOPLE,
): HintPurchase {
  const hint = requestHint(def, people, state);
  if (!hint.ok) return { ok: false, reason: hint.reason };
  const price = HINT_PRICE[kind];
  if (profile.postage < price) return { ok: false, reason: "INSUFFICIENT_POSTAGE" };
  return {
    ok: true,
    profile: {
      ...profile,
      postage: profile.postage - price,
      stats: { ...profile.stats, hintsUsed: profile.stats.hintsUsed + 1 },
    },
    state: hint.state,
    hint,
    events: [{ type: "postage-spent", amount: price, reason: "hint" }],
  };
}

export type FreezePurchase =
  | { ok: false; reason: PurchaseFailure }
  | { ok: true; profile: Profile; events: EconomyEvent[] };

export function buyFreeze(profile: Profile): FreezePurchase {
  if (profile.streakFreezes >= MAX_FREEZES) return { ok: false, reason: "FREEZES_FULL" };
  if (profile.postage < FREEZE_PRICE) return { ok: false, reason: "INSUFFICIENT_POSTAGE" };
  return {
    ok: true,
    profile: {
      ...profile,
      postage: profile.postage - FREEZE_PRICE,
      streakFreezes: profile.streakFreezes + 1,
    },
    events: [{ type: "postage-spent", amount: FREEZE_PRICE, reason: "freeze" }],
  };
}
