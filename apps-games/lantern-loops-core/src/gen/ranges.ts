import type { Colour } from "../puzzle";

export type Range = readonly [number, number];

export interface Mechanics {
  readonly stones: boolean;
  readonly mirrors: boolean;
  readonly gates: boolean;
}

export interface ClueRanges {
  readonly lanterns: Range;
  readonly stones: Range;
  readonly mirrors: Range;
  readonly gates: Range;
}

/** Clue ranges per board size, the table in `.agents/games/lantern-loops/content-plan.md` section 2. */
export const SIZE_RANGES: Readonly<Record<number, ClueRanges>> = {
  4: { lanterns: [1, 2], stones: [1, 2], mirrors: [1, 1], gates: [1, 1] },
  5: { lanterns: [2, 3], stones: [2, 3], mirrors: [1, 2], gates: [1, 1] },
  6: { lanterns: [3, 4], stones: [3, 5], mirrors: [2, 3], gates: [1, 2] },
  7: { lanterns: [3, 5], stones: [4, 6], mirrors: [2, 4], gates: [2, 3] },
  8: { lanterns: [4, 6], stones: [5, 8], mirrors: [3, 5], gates: [2, 4] },
  9: { lanterns: [5, 8], stones: [6, 9], mirrors: [4, 6], gates: [3, 5] },
};

/** Bridge and Sky stones use 60 to 100% of the Garden range (low end scaled, at least 1). */
export function relaxedStones(range: Range): Range {
  return [Math.max(1, Math.round(range[0] * 0.6)), range[1]];
}

export const NO_MECHANICS: Mechanics = { stones: false, mirrors: false, gates: false };

export function rangesFor(size: number, mechanics: Mechanics, relaxStones = false): ClueRanges {
  const base = SIZE_RANGES[size] ?? SIZE_RANGES[9];
  if (base === undefined) throw new RangeError(`no clue ranges for size ${size}`);
  return {
    lanterns: base.lanterns,
    stones: !mechanics.stones ? [0, 0] : relaxStones ? relaxedStones(base.stones) : base.stones,
    mirrors: mechanics.mirrors ? base.mirrors : [0, 0],
    gates: mechanics.gates ? base.gates : [0, 0],
  };
}

export const AMBER_ONLY: readonly Colour[] = ["amber"];
