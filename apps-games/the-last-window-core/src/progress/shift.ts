import { CAMPAIGN_DAYS, MAX_COINS } from "../constants";
import { addFp, levelForFp } from "../story/friendship";
import type { SceneRef } from "../story/types";
import type { ShiftResult } from "../types";
import { coinsGained, type ProgressEvent } from "./events";
import {
  type DayRecord,
  MAX_COUNTER,
  MAX_VISITS,
  type Profile,
  type RegularRecord,
  regularOf,
} from "./profileTypes";
import { queueEvening, sceneIdOf, waitingScenes } from "./scenes";
import { unlocksForDay } from "./unlocks";

export type ShiftInfo = { kind: "day"; day: number } | { kind: "late" };

export interface ShiftExtras {
  itemsMade?: number;
}

export interface ShiftApplied {
  accepted: boolean;
  replay: boolean;
  advanced: boolean;
  profile: Profile;
  events: ProgressEvent[];
  queue: SceneRef[];
  remainder: SceneRef[];
}

function rejected(profile: Profile): ShiftApplied {
  return {
    accepted: false,
    replay: false,
    advanced: false,
    profile,
    events: [],
    queue: [],
    remainder: [],
  };
}

function bounded(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.floor(value)));
}

function applyRegulars(profile: Profile, result: ShiftResult): Profile["regulars"] {
  const regulars = { ...profile.regulars };
  const edit = (regularId: number, change: (row: RegularRecord) => RegularRecord): void => {
    const row = regulars[regularId];
    if (row !== undefined) regulars[regularId] = change(row);
  };
  for (const entry of result.regularOutcomes) {
    if (entry.outcome === "left") continue;
    edit(entry.regularId, (row) => ({ ...row, visits: Math.min(MAX_VISITS, row.visits + 1) }));
  }
  for (const gain of result.fpGains) {
    edit(gain.regularId, (row) => ({ ...row, fp: addFp(row.fp, gain.fp) }));
  }
  return regulars;
}

function betterDay(old: DayRecord | undefined, next: DayRecord): DayRecord {
  if (old === undefined) return next;
  if (next.stars !== old.stars) return next.stars > old.stars ? next : old;
  return next.earned > old.earned ? next : old;
}

function dayRecord(result: ShiftResult): DayRecord {
  const served = result.counts.delighted + result.counts.satisfied + result.counts.disappointed;
  return {
    stars: result.grade.stars,
    earned: bounded(result.coins, MAX_COUNTER),
    served,
    delighted: result.counts.delighted,
  };
}

function friendshipEvents(before: Profile, after: Profile): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  for (const [key, row] of Object.entries(after.regulars)) {
    const regularId = Number(key);
    const level = levelForFp(row.fp);
    if (level > levelForFp(regularOf(before, regularId).fp)) {
      events.push({ type: "friendship-level", regularId, level });
    }
  }
  return events;
}

function unlockEvents(day: number): ProgressEvent[] {
  const list = unlocksForDay(day);
  return [
    ...list.drinks.map((id): ProgressEvent => ({ type: "unlock", kind: "drink", id, day })),
    ...list.pastries.map((id): ProgressEvent => ({ type: "unlock", kind: "pastry", id, day })),
    ...list.books.map((id): ProgressEvent => ({ type: "unlock", kind: "book", id, day })),
    ...list.decor.map((id): ProgressEvent => ({ type: "decor-unlocked", id, day })),
  ];
}

function acceptable(profile: Profile, info: ShiftInfo): boolean {
  if (info.kind === "late") return profile.day > CAMPAIGN_DAYS;
  return (
    Number.isInteger(info.day) && info.day >= 1 && info.day <= Math.min(profile.day, CAMPAIGN_DAYS)
  );
}

export function applyShiftResult(
  profile: Profile,
  info: ShiftInfo,
  result: ShiftResult,
  extras: ShiftExtras = {},
): ShiftApplied {
  if (!acceptable(profile, info)) return rejected(profile);
  const served = result.counts.delighted + result.counts.satisfied + result.counts.disappointed;
  const stats = profile.stats;
  let next: Profile = {
    ...profile,
    coins: Math.min(MAX_COINS, profile.coins + Math.max(0, result.coins)),
    regulars: applyRegulars(profile, result),
    stats: {
      ...stats,
      served: bounded(stats.served + served, MAX_COUNTER),
      delighted: bounded(stats.delighted + result.counts.delighted, MAX_COUNTER),
      itemsMade: bounded(stats.itemsMade + (extras.itemsMade ?? 0), MAX_COUNTER),
      mistakes: bounded(stats.mistakes + result.mistakes, MAX_COUNTER),
    },
  };
  const events: ProgressEvent[] = [...coinsGained(result.coins, "shift")];
  let replay = false;
  let advanced = false;
  let capDay = 0;
  if (info.kind === "day") {
    capDay = info.day;
    replay = info.day < profile.day;
    next = {
      ...next,
      daysDone: {
        ...next.daysDone,
        [info.day]: betterDay(next.daysDone[info.day], dayRecord(result)),
      },
      diary: next.diary.includes(info.day)
        ? next.diary
        : [...next.diary, info.day].sort((a, b) => a - b),
    };
    if (info.day === profile.day) {
      advanced = true;
      next = { ...next, day: profile.day + 1 };
    }
  }
  const evening = queueEvening(next, capDay);
  next = evening.profile;
  const before = new Set(waitingScenes(profile).map((ref) => `${ref.regularId}-${ref.index}`));
  const fresh = waitingScenes(next).filter((ref) => !before.has(`${ref.regularId}-${ref.index}`));
  events.push(...friendshipEvents(profile, next));
  for (const ref of fresh) {
    const sceneId = sceneIdOf(ref);
    if (sceneId !== null) {
      events.push({ type: "scene-eligible", regularId: ref.regularId, index: ref.index, sceneId });
    }
  }
  if (advanced) {
    if (next.day <= CAMPAIGN_DAYS) events.push(...unlockEvents(next.day));
    else events.push({ type: "campaign-complete" });
  }
  return {
    accepted: true,
    replay,
    advanced,
    profile: next,
    events,
    queue: evening.queue,
    remainder: evening.remainder,
  };
}
