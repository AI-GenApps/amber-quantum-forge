import { localDateKey } from "@web-games/kit";
import {
  type CaseDef,
  PEOPLE_BY_ID,
  tierFor,
  WEEKDAY_LABELS,
} from "@web-games/lost-parcel-desk-core";
import { weekdayOfKey } from "../state/dailyCase";
import { shortDate } from "./format";

export interface DailyIntro {
  title: string;
  label: string;
  foundAt: string;
  dateKey: string;
}

export function todayKey(now: Date): string {
  return localDateKey(now);
}

/** Intro copy for the generated Daily Parcel; the case itself has no authored label. */
export function dailyIntro(now: Date, heldKey?: string): DailyIntro {
  const dateKey = heldKey ?? todayKey(now);
  const weekday = weekdayOfKey(dateKey);
  const tier = tierFor(weekday);
  return {
    title: `${WEEKDAY_LABELS[weekday] ?? ""} ${shortDate(dateKey)}`.trim(),
    label: `Today's parcel. ${tier.objects} items in the bag. Addressee torn away.`,
    foundAt: "The sorting-room floor",
    dateKey,
  };
}

/** Reveal text for a generated case, built from its deductions (generated cases have no authored reveal). */
export function dailyReveal(def: CaseDef): string {
  const lines = def.deductions.map((deduction) => {
    const tags = deduction.clueIds.map((id) => def.clues.find((clue) => clue.id === id)?.tag ?? id);
    const source =
      tags.length > 1 ? `The ${tags.join(" and the ")} together` : `The ${tags[0] ?? "clue"}`;
    const relation = deduction.polarity === "is" ? "is" : "is not";
    return `${source} show the owner's ${deduction.facet} ${relation} ${deduction.value}.`;
  });
  const owner = PEOPLE_BY_ID[def.ownerId]?.name ?? "the owner";
  return `${lines.join(" ")} That leaves ${owner}.`;
}
