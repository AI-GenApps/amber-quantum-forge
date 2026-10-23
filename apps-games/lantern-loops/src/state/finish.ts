import {
  buildShareText,
  type ChapterId,
  isChapterUnlocked,
  nextPuzzle,
  type StreakEvent,
  TUTORIALS,
  totalStars,
} from "@web-games/lantern-loops-core";
import type { AppEnv } from "../app/AppContext";
import type { PuzzleSource, SourceKind } from "../app/source";
import type { SessionState } from "./session";

export interface WinSummary {
  kind: SourceKind;
  stars: number;
  seconds: number;
  hints: number;
  tokensGranted: number;
  tokensCapped: boolean;
  newBestTime: boolean;
  streak: number | null;
  events: StreakEvent[];
  chaptersUnlocked: ChapterId[];
  chaptersCleared: ChapterId[];
  /** The next campaign puzzle when it is open, else null. */
  nextId: string | null;
  /** Emoji grid text for daily and archive solves. */
  shareText: string | null;
}

export function secondsOf(elapsedMs: number): number {
  return Math.max(1, Math.round(elapsedMs / 1000));
}

const blank = (kind: SourceKind, seconds: number, hints: number): WinSummary => ({
  kind,
  stars: 0,
  seconds,
  hints,
  tokensGranted: 0,
  tokensCapped: false,
  newBestTime: false,
  streak: null,
  events: [],
  chaptersUnlocked: [],
  chaptersCleared: [],
  nextId: null,
  shareText: null,
});

/** Records a solved board through the progression services and describes the result. */
export async function finishRun(
  env: AppEnv,
  source: PuzzleSource,
  state: SessionState,
): Promise<WinSummary> {
  const { progression } = env.services;
  const seconds = secondsOf(state.elapsedMs);
  const input = { hints: state.hintCount, seconds };
  const base = blank(source.kind, seconds, state.hintCount);
  if (source.kind === "tutorial") {
    const following = TUTORIALS[TUTORIALS.findIndex((entry) => entry.id === source.key) + 1];
    return { ...base, nextId: following?.id ?? null };
  }

  if (source.kind === "campaign") {
    const result = await progression.completePuzzle(source.key, input);
    const upcoming = nextPuzzle(source.key);
    const total = totalStars(progression.current().stars);
    return {
      ...base,
      stars: result.stars,
      tokensGranted: result.tokensGranted,
      tokensCapped: result.tokensCapped,
      newBestTime: result.newBestTime,
      chaptersUnlocked: result.chaptersUnlocked,
      chaptersCleared: result.chaptersCleared,
      nextId: upcoming && isChapterUnlocked(upcoming.chapter, total) ? upcoming.id : null,
    };
  }

  const dateKey = source.dateKey as string;
  const result =
    source.kind === "daily"
      ? await progression.completeDaily(input)
      : await progression.completeArchive(dateKey, input);
  const profile = progression.current();
  return {
    ...base,
    stars: result.stars,
    tokensGranted: result.tokensGranted,
    tokensCapped: result.tokensCapped,
    streak: source.kind === "daily" ? result.streak : null,
    events: result.events,
    shareText: buildShareText({
      dateKey,
      stars: result.stars,
      seconds,
      puzzle: source.puzzle,
      tiles: state.tiles,
      hidePath: profile.hidePathInShare,
    }),
  };
}
