import { GAME_TITLE } from "../content";
import type { ShiftEvent, ShiftResult } from "../types";
import type { LateRecords } from "./profileTypes";

export type ShareInput =
  | { kind: "day"; day: number; stars: number; happy: number; customers: number; coins: number }
  | { kind: "late"; date: string; stars: number; coins: number; delightedRun: number };

export function shareText(input: ShareInput): string {
  if (input.kind === "day") {
    return `${GAME_TITLE}, Day ${input.day}: ${input.stars}/3 stars, ${input.happy} of ${input.customers} customers smiling, ${input.coins} coins earned.`;
  }
  return `${GAME_TITLE}, Late Shift ${input.date}: ${input.stars}/3 stars, ${input.coins} coins, ${input.delightedRun} delighted in a row.`;
}

export function shareInputFor(result: ShiftResult, date: string | null): ShareInput {
  if (result.kind === "late" && date !== null) {
    return {
      kind: "late",
      date,
      stars: result.grade.stars,
      coins: result.coins,
      delightedRun: result.longestDelightedRun,
    };
  }
  return {
    kind: "day",
    day: result.day,
    stars: result.grade.stars,
    happy: result.counts.delighted + result.counts.satisfied,
    customers: result.arrived,
    coins: result.coins,
  };
}

export function countItemsServed(events: readonly ShiftEvent[]): number {
  let items = 0;
  for (const event of events) {
    if (event.type !== "served") continue;
    const { drink, pastry, book } = event.scores;
    if (drink > 0) items += 1;
    if (pastry !== null && pastry > 0) items += 1;
    if (book !== null && book > 0) items += 1;
  }
  return items;
}

export function betterRecords(records: LateRecords, result: ShiftResult): LateRecords {
  return {
    bestEarnings: Math.max(records.bestEarnings, result.coins),
    bestDelightedRun: Math.max(records.bestDelightedRun, result.longestDelightedRun),
  };
}
