import type { RatingValue } from "../gen/difficulty";

export type ChapterId = "harbor" | "garden" | "bridge" | "sky";

export const CHAPTER_IDS: readonly ChapterId[] = ["harbor", "garden", "bridge", "sky"];

/** One shipped campaign puzzle. `code` is the puzzle text code, `solution` one hex digit per cell. */
export interface PuzzleRecord {
  readonly id: string;
  readonly chapter: ChapterId;
  /** 1 to 30 inside the chapter. */
  readonly index: number;
  readonly title: string;
  readonly size: number;
  readonly code: string;
  readonly solution: string;
  readonly rating: RatingValue;
  /** `hashText("ll-gen-1|<id>")`: the generator seed that re-derives the puzzle. */
  readonly seed: number;
}

/** A tutorial board, outside the campaign. */
export interface TutorialRecord {
  readonly id: string;
  readonly title: string;
  readonly size: number;
  readonly code: string;
  readonly solution: string;
}
