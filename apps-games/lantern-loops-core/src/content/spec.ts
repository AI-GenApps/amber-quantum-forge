import { COLOURS, type Colour } from "../puzzle";
import { GENERATOR_VERSION, type GenParams } from "../gen/generate";
import type { Mechanics, Range } from "../gen/ranges";
import { hashText } from "../gen/rng";
import { CHAPTER_IDS, type ChapterId } from "./types";

type TitleRow = readonly [title: string, size: number];

export interface PuzzleSpec {
  readonly id: string;
  readonly chapter: ChapterId;
  readonly index: number;
  readonly title: string;
  readonly size: number;
  readonly seed: number;
  readonly params: GenParams;
}

const HARBOR_TITLES: readonly TitleRow[] = [
  ["First Light", 5],
  ["Mooring Rope", 5],
  ["Little Skiff", 5],
  ["Dock Lamp", 5],
  ["Quiet Cove", 5],
  ["Rope Coil", 5],
  ["Gull Rest", 5],
  ["Ferry Line", 5],
  ["Net Loft", 5],
  ["Low Tide", 5],
  ["Bell Buoy", 6],
  ["Salt Wind", 6],
  ["Fish Market", 6],
  ["Harbor Steps", 6],
  ["Canal Mouth", 6],
  ["Tar and Twine", 6],
  ["Night Ferry", 6],
  ["Sail Maker", 6],
  ["Lamp Lighter", 6],
  ["Moonlit Quay", 6],
  ["Breakwater", 7],
  ["Lighthouse Stair", 7],
  ["Tidal Maze", 7],
  ["Anchor Chain", 7],
  ["Customs House", 7],
  ["Rope Walk", 7],
  ["Lantern Barge", 7],
  ["Harbor Bells", 7],
  ["Pier Lanterns", 7],
  ["Festival Night", 7],
];

const GARDEN_TITLES: readonly TitleRow[] = [
  ["Stepping Stones", 5],
  ["Pebble Path", 5],
  ["Moss Corner", 5],
  ["Raked Sand", 5],
  ["Plum Blossom", 5],
  ["Fern Hollow", 6],
  ["Bamboo Row", 6],
  ["Lily Pond", 6],
  ["Tea Arbor", 6],
  ["Gravel Court", 6],
  ["Willow Bend", 6],
  ["Mossy Wall", 6],
  ["Orchid Shade", 6],
  ["Rain Garden", 6],
  ["Wisteria Walk", 6],
  ["Fallen Petals", 7],
  ["Terrace Steps", 7],
  ["Moon Gate", 7],
  ["Cedar Grove", 7],
  ["Dew Morning", 7],
  ["Hidden Spring", 7],
  ["Lotus Court", 7],
  ["Twisting Root", 7],
  ["Maple Path", 7],
  ["Quiet Boulders", 7],
  ["Evening Garden", 8],
  ["Heron Pool", 8],
  ["Rockery", 8],
  ["Lantern Grove", 8],
  ["Garden Festival", 8],
];

const BRIDGE_TITLES: readonly TitleRow[] = [
  ["First Crossing", 5],
  ["Glass Pane", 5],
  ["Silver Mirror", 5],
  ["Narrow Span", 5],
  ["River Glint", 6],
  ["Echo Arch", 6],
  ["Reflection", 6],
  ["Rope Bridge", 6],
  ["Stone Arch", 6],
  ["Twin Span", 6],
  ["Moonlit Ford", 6],
  ["Painted Rail", 6],
  ["Covered Bridge", 7],
  ["Weathered Planks", 7],
  ["Ripple", 7],
  ["Bright Parapet", 7],
  ["Cable Walk", 7],
  ["Mist Crossing", 7],
  ["Mirror Lake", 7],
  ["Long Span", 7],
  ["Suspension", 8],
  ["Bridge of Lamps", 8],
  ["Echoing Keystone", 8],
  ["Silvered Rail", 8],
  ["Midnight Crossing", 8],
  ["Grand Arch", 8],
  ["Two Rivers", 9],
  ["Aqueduct", 9],
  ["Mirror Maze", 9],
  ["Bridge Festival", 9],
];

const SKY_TITLES: readonly TitleRow[] = [
  ["First Gate", 6],
  ["Rose Door", 6],
  ["Jade Latch", 6],
  ["Two Keys", 6],
  ["Cloud Stairs", 7],
  ["Kite String", 7],
  ["Wind Chimes", 7],
  ["Sky Lantern", 7],
  ["High Terrace", 7],
  ["Updraft", 7],
  ["Sunset Sail", 7],
  ["Feather Fall", 7],
  ["Cirrus", 8],
  ["Sky Pass", 8],
  ["Weather Vane", 8],
  ["Star Ladder", 8],
  ["Dusk Colours", 8],
  ["Violet Hour", 8],
  ["Aurora Gate", 8],
  ["Thunderhead", 8],
  ["Rainbow Tide", 8],
  ["Comet Tail", 8],
  ["Observatory Roof", 9],
  ["Lantern Armada", 9],
  ["Cloud Sea", 9],
  ["Sky Harbor", 9],
  ["Five Colours", 9],
  ["Zenith", 9],
  ["Midnight Sky", 9],
  ["Festival of Lanterns", 9],
];

export const CHAPTER_TITLE_ROWS: Readonly<Record<ChapterId, readonly TitleRow[]>> = {
  harbor: HARBOR_TITLES,
  garden: GARDEN_TITLES,
  bridge: BRIDGE_TITLES,
  sky: SKY_TITLES,
};

export const CHAPTER_MECHANICS: Readonly<Record<ChapterId, Mechanics>> = {
  harbor: { stones: false, mirrors: false, gates: false },
  garden: { stones: true, mirrors: false, gates: false },
  bridge: { stones: true, mirrors: true, gates: false },
  sky: { stones: true, mirrors: true, gates: true },
};

/** Accepted rating range per band of six puzzles; each band ends where the next begins. */
export const RATING_LADDER: Readonly<Record<ChapterId, readonly Range[]>> = {
  harbor: [[1, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  garden: [[1, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  bridge: [[1, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  sky: [[2, 3], [3, 3], [3, 4], [4, 5], [5, 5]],
};

export const ANCHOR_SHARE_GOAL: Readonly<Record<ChapterId, number>> = {
  harbor: 34,
  garden: 35,
  bridge: 35,
  sky: 35,
};

const SKY_EARLY: Readonly<Record<number, readonly Colour[]>> = {
  1: ["amber", "rose"],
  2: ["amber", "rose"],
  3: ["rose", "jade"],
  4: ["amber", "violet"],
  5: ["jade", "azure", "rose"],
};

const SKY_COLOUR_COUNT: Readonly<Record<number, number>> = {
  6: 2, 7: 3, 8: 2, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
  16: 3, 17: 4, 18: 3, 19: 4, 20: 3, 21: 4, 22: 4, 23: 4, 24: 4, 25: 3,
  26: 4, 27: 5, 28: 4, 29: 4, 30: 5,
};

/** The lantern colours a Sky puzzle uses: introduction order first, then rotating subsets. */
export function skyColours(index: number): readonly Colour[] {
  const early = SKY_EARLY[index];
  if (early !== undefined) return early;
  const count = SKY_COLOUR_COUNT[index] ?? 3;
  const start = (index * 3) % COLOURS.length;
  return Array.from({ length: count }, (_, k) => COLOURS[(start + k) % COLOURS.length] as Colour);
}

export function ratingRange(chapter: ChapterId, index: number): Range {
  const ladder = RATING_LADDER[chapter];
  return ladder[Math.floor((index - 1) / 6)] as Range;
}

export function campaignSeed(id: string): number {
  return hashText(`${GENERATOR_VERSION}|${id}`);
}

export function campaignSpecs(): PuzzleSpec[] {
  const out: PuzzleSpec[] = [];
  for (const chapter of CHAPTER_IDS) {
    CHAPTER_TITLE_ROWS[chapter].forEach(([title, size], k) => {
      const index = k + 1;
      const id = `${chapter}-${String(index).padStart(2, "0")}`;
      out.push({
        id,
        chapter,
        index,
        title,
        size,
        seed: campaignSeed(id),
        params: {
          id,
          size,
          mechanics: CHAPTER_MECHANICS[chapter],
          colours: chapter === "sky" ? skyColours(index) : ["amber"],
          relaxStones: chapter === "bridge" || chapter === "sky",
          maxAnchorShare: ANCHOR_SHARE_GOAL[chapter],
          rating: ratingRange(chapter, index),
          attempts: 120,
        },
      });
    });
  }
  return out;
}
