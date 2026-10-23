import type { Mechanics } from "../gen/ranges";
import { BRIDGE_PUZZLES } from "./campaign/bridge";
import { GARDEN_PUZZLES } from "./campaign/garden";
import { HARBOR_PUZZLES } from "./campaign/harbor";
import { SKY_PUZZLES } from "./campaign/sky";
import { CHAPTER_IDS, type ChapterId, type PuzzleRecord } from "./types";

export interface Chapter {
  readonly id: ChapterId;
  readonly title: string;
  /** At most 90 characters. */
  readonly blurb: string;
  /** The mechanic this chapter introduces. */
  readonly mechanic: string;
  /** Mechanics in play: this chapter's and every earlier one. */
  readonly mechanics: Mechanics;
  /** Total stars needed to open the chapter. */
  readonly unlockStars: number;
  /** Art slot id of the chapter backdrop. */
  readonly backdrop: string;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "harbor",
    title: "Harbor",
    blurb: "Light the moorings and close the ropes of the old harbor.",
    mechanic: "Lanterns and loops",
    mechanics: { stones: false, mirrors: false, gates: false },
    unlockStars: 0,
    backdrop: "backdrop-harbor",
  },
  {
    id: "garden",
    title: "Garden",
    blurb: "Count the stones along the quiet paths of the night garden.",
    mechanic: "Numbered stones",
    mechanics: { stones: true, mirrors: false, gates: false },
    unlockStars: 45,
    backdrop: "backdrop-garden",
  },
  {
    id: "bridge",
    title: "Bridge",
    blurb: "Let the light turn on the mirrors of the river crossings.",
    mechanic: "Mirrors",
    mechanics: { stones: true, mirrors: true, gates: false },
    unlockStars: 120,
    backdrop: "backdrop-bridge",
  },
  {
    id: "sky",
    title: "Sky",
    blurb: "Open the gates for every colour and send the lanterns skyward.",
    mechanic: "Colour gates and colours",
    mechanics: { stones: true, mirrors: true, gates: true },
    unlockStars: 210,
    backdrop: "backdrop-sky",
  },
];

/** Puzzles per chapter and the number of boards of each size: the table in the content plan. */
export const CHAPTER_SIZE_COUNTS: Readonly<Record<ChapterId, Readonly<Record<number, number>>>> = {
  harbor: { 5: 10, 6: 10, 7: 10 },
  garden: { 5: 5, 6: 10, 7: 10, 8: 5 },
  bridge: { 5: 4, 6: 8, 7: 8, 8: 6, 9: 4 },
  sky: { 6: 4, 7: 8, 8: 10, 9: 8 },
};

export const PUZZLES_PER_CHAPTER = 30;
export const PUZZLE_COUNT = 120;
export const STARS_PER_PUZZLE = 3;
export const MAX_STARS = PUZZLE_COUNT * STARS_PER_PUZZLE;

/** The 120 campaign puzzles in play order: Harbor 01 to Sky 30. */
export const CAMPAIGN: readonly PuzzleRecord[] = [
  ...HARBOR_PUZZLES,
  ...GARDEN_PUZZLES,
  ...BRIDGE_PUZZLES,
  ...SKY_PUZZLES,
];

const BY_ID: ReadonlyMap<string, number> = new Map(CAMPAIGN.map((record, k) => [record.id, k]));

export function getChapter(id: ChapterId): Chapter {
  return CHAPTERS[CHAPTER_IDS.indexOf(id)] as Chapter;
}

export function getPuzzle(id: string): PuzzleRecord | undefined {
  const at = BY_ID.get(id);
  return at === undefined ? undefined : CAMPAIGN[at];
}

export function chapterPuzzles(chapterId: ChapterId): readonly PuzzleRecord[] {
  return CAMPAIGN.filter((record) => record.chapter === chapterId);
}

/** The next puzzle in play order (the first of the next chapter after a chapter's last). */
export function nextPuzzle(id: string): PuzzleRecord | undefined {
  const at = BY_ID.get(id);
  return at === undefined ? undefined : CAMPAIGN[at + 1];
}

/** The chapter that is open once `stars` are earned: the highest with `unlockStars <= stars`. */
export function unlockedChapters(stars: number): readonly Chapter[] {
  return CHAPTERS.filter((chapter) => stars >= chapter.unlockStars);
}
