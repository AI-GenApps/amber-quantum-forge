import {
  archiveKeys,
  type ChapterId,
  decodePuzzle,
  decodeTiles,
  getPuzzle,
  getTutorial,
  type Puzzle,
  type Tiles,
  weekdayOf,
} from "@web-games/lantern-loops-core";
import { puzzleForDate } from "../services/daily";
import { t } from "../strings";
import { dayName } from "./format";

export type SourceKind = "campaign" | "tutorial" | "daily" | "archive";

export interface PuzzleSource {
  kind: SourceKind;
  /** Save key: the campaign or tutorial id, or `daily-YYYY-MM-DD`. */
  key: string;
  title: string;
  subtitle: string;
  puzzle: Puzzle;
  solution: Tiles;
  chapter: ChapterId | null;
  dateKey: string | null;
}

export const DAILY_PREFIX = "daily-";

export function dailyKeyOf(dateKey: string): string {
  return `${DAILY_PREFIX}${dateKey}`;
}

function decoded(
  code: string,
  id: string,
  solution: string,
  size: number,
): { puzzle: Puzzle; solution: Tiles } | null {
  const puzzle = decodePuzzle(code, id);
  const tiles = decodeTiles(solution, size);
  if (!puzzle.ok || !tiles.ok) return null;
  return { puzzle: puzzle.value, solution: tiles.value };
}

/** Resolves a route id into a playable puzzle; null for unknown ids and dates outside the window. */
export function resolveSource(id: string, today: string): PuzzleSource | null {
  const campaign = getPuzzle(id);
  if (campaign !== undefined) {
    const made = decoded(campaign.code, campaign.id, campaign.solution, campaign.size);
    if (made === null) return null;
    return {
      kind: "campaign",
      key: campaign.id,
      title: campaign.title,
      subtitle: t("common.boardSize", { size: campaign.size }),
      chapter: campaign.chapter,
      dateKey: null,
      ...made,
    };
  }
  const tutorial = getTutorial(id);
  if (tutorial !== undefined) {
    const made = decoded(tutorial.code, tutorial.id, tutorial.solution, tutorial.size);
    if (made === null) return null;
    return {
      kind: "tutorial",
      key: tutorial.id,
      title: tutorial.title,
      subtitle: t("puzzle.stepTutorial"),
      chapter: null,
      dateKey: null,
      ...made,
    };
  }
  if (!id.startsWith(DAILY_PREFIX)) return null;
  const dateKey = id.slice(DAILY_PREFIX.length);
  const isToday = dateKey === today;
  if (!isToday && !archiveKeys(today).includes(dateKey)) return null;
  const daily = puzzleForDate(dateKey);
  return {
    kind: isToday ? "daily" : "archive",
    key: daily.id,
    title: t(isToday ? "puzzle.dailyTitle" : "puzzle.archiveTitle", { date: dateKey }),
    subtitle: dayName(weekdayOf(dateKey)),
    puzzle: daily.puzzle,
    solution: daily.solution,
    chapter: null,
    dateKey,
  };
}
