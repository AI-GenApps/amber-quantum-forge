import {
  type Arrival,
  addFp,
  BOOKS,
  type BookId,
  bookCarriesMood,
  buildArrivals,
  DAYS,
  type DayDef,
  eligibleScenes,
  eveningQueue,
  getRegular,
  type MoodId,
  noDecorEffects,
  type PastryId,
  patienceTicks,
  type RegularDue,
  type RegularProgress,
  type ShiftDef,
  type ShiftResult,
  type StockPlan,
  suggestStock,
  TUTORIAL_PATIENCE_FREE,
  tutorialArrivals,
  type Unlocked,
} from "../../src";
import { type BotPolicy, playShift } from "./bot";

export function unlockedAt(day: number): Unlocked {
  const drinks: Unlocked["drinks"][number][] = [];
  const pastries: Unlocked["pastries"][number][] = [];
  const books: Unlocked["books"][number][] = [];
  for (const entry of DAYS.filter((d) => d.day <= day)) {
    drinks.push(...entry.unlocks.drinks);
    pastries.push(...entry.unlocks.pastries);
    books.push(...entry.unlocks.books);
  }
  return { drinks, pastries, books };
}

export function dueFor(day: DayDef): RegularDue[] {
  return day.regularsDue.map((regularId) => ({ regularId, likes: getRegular(regularId).likes }));
}

export function seedFor(day: number): number {
  return day * 7919;
}

export function contentDef(day: DayDef): ShiftDef {
  const unlocked = unlockedAt(day.day);
  const arrivals: Arrival[] =
    day.day === 1
      ? tutorialArrivals()
      : buildArrivals(seedFor(day.day), day.customers, day.shiftTicks, dueFor(day), {
          unlocked,
          weather: day.weather,
          shelfEmpty: false,
        });
  return {
    kind: "day",
    day: day.day,
    weather: day.weather,
    lengthTicks: day.shiftTicks,
    basePatienceTicks: patienceTicks(day.patienceSeconds, false),
    relaxed: false,
    decor: noDecorEffects(),
    unlocked,
    arrivals,
    patienceFreeArrivals: day.day === 1 ? TUTORIAL_PATIENCE_FREE : 0,
    seed: seedFor(day.day),
  };
}

function subsets<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...rest] = items as [T, ...T[]];
  return [...subsets(rest, size - 1).map((tail) => [head, ...tail]), ...subsets(rest, size)];
}

export function foresightStock(def: ShiftDef): StockPlan {
  const tally = new Map<PastryId, number>();
  const moods: { mood: MoodId; weight: number }[] = [];
  for (const arrival of def.arrivals) {
    const weight = arrival.customer.kind === "regular" ? 3 : 1;
    const pastry = arrival.order.pastry;
    if (pastry !== null) tally.set(pastry, (tally.get(pastry) ?? 0) + weight);
    if (arrival.order.mood !== null) moods.push({ mood: arrival.order.mood, weight });
  }
  const pastries = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
  const available = BOOKS.filter((book) => def.unlocked.books.includes(book.id)).map((b) => b.id);
  const size = Math.min(3, available.length);
  const score = (set: readonly BookId[]) =>
    moods.reduce(
      (sum, m) => sum + (set.some((id) => bookCarriesMood(id, m.mood)) ? m.weight : 0),
      0,
    );
  const books = subsets(available, size).sort((a, b) => score(b) - score(a))[0] ?? [];
  return { pastries, books };
}

export function suggestedStock(day: DayDef, def: ShiftDef): StockPlan {
  return suggestStock(dueFor(day), def.unlocked, def.decor.shelfSlots);
}

export interface DayLog {
  day: number;
  result: ShiftResult;
  eligible: number;
  played: number;
  waiting: number;
}

export interface CampaignRun {
  logs: DayLog[];
  progress: RegularProgress[];
  firstEligible: Map<string, number>;
}

export function playCampaign(
  policy: BotPolicy,
  stockFor: (day: DayDef, def: ShiftDef) => StockPlan,
): CampaignRun {
  const progress: RegularProgress[] = Array.from({ length: 8 }, (_, i) => ({
    regularId: i + 1,
    fp: 0,
    visits: 0,
    scenesDone: 0,
  }));
  const logs: DayLog[] = [];
  const firstEligible = new Map<string, number>();
  for (const day of DAYS) {
    const def = contentDef(day);
    const run = playShift(def, stockFor(day, def), policy);
    for (const entry of run.result.regularOutcomes) {
      const row = progress[entry.regularId - 1];
      if (row !== undefined && entry.outcome !== "left") row.visits += 1;
    }
    for (const gain of run.result.fpGains) {
      const row = progress[gain.regularId - 1];
      if (row !== undefined) row.fp = addFp(row.fp, gain.fp);
    }
    const eligible = eligibleScenes(progress);
    for (const ref of eligible) {
      const key = `${ref.regularId}-${ref.index}`;
      if (!firstEligible.has(key)) firstEligible.set(key, day.day);
    }
    const queue = eveningQueue(eligible, undefined, day.day);
    for (const ref of queue) {
      const row = progress[ref.regularId - 1];
      if (row !== undefined) row.scenesDone = ref.index;
    }
    logs.push({
      day: day.day,
      result: run.result,
      eligible: eligible.length,
      played: queue.length,
      waiting: eligible.length - queue.length,
    });
  }
  return { logs, progress, firstEligible };
}
