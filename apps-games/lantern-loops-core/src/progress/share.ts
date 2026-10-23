import type { Tiles } from "../board";
import { analyseLoops } from "../loops";
import { type Colour, cellAt, type Puzzle } from "../puzzle";

export const SHARE_TITLE = "Lantern Loops Daily";
export const LANTERN_EMOJI = "🏮";
export const STONE_EMOJI = "⬜";
export const EMPTY_EMOJI = "⬛";

export const COLOUR_SQUARES: Readonly<Record<Colour, string>> = {
  amber: "🟧",
  rose: "🟥",
  jade: "🟩",
  azure: "🟦",
  violet: "🟪",
};

export interface ShareInput {
  readonly dateKey: string;
  readonly stars: number;
  readonly seconds: number;
  readonly puzzle: Puzzle;
  readonly tiles: Tiles;
  /** Default true: lanterns, stones and empty cells only, no path. */
  readonly hidePath?: boolean;
}

/** `m:ss`, or `h:mm:ss` from one hour on. Fractions are dropped, negatives count as 0. */
export function formatDuration(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function colourOfCells(puzzle: Puzzle, tiles: Tiles): Map<number, Colour> {
  const map = new Map<number, Colour>();
  for (const loop of analyseLoops(puzzle, tiles).loops) {
    const colour = loop.colour;
    if (colour === null || colour === "mixed") continue;
    for (const cell of loop.cells) map.set(cell, colour);
  }
  return map;
}

function emojiGrid(puzzle: Puzzle, tiles: Tiles, hidePath: boolean): string[] {
  const colours = hidePath ? new Map<number, Colour>() : colourOfCells(puzzle, tiles);
  const rows: string[] = [];
  for (let r = 0; r < puzzle.size; r++) {
    let row = "";
    for (let c = 0; c < puzzle.size; c++) {
      const i = r * puzzle.size + c;
      const cell = cellAt(puzzle, i);
      if (cell.kind === "stone") row += STONE_EMOJI;
      else if (hidePath) row += cell.clue?.kind === "lantern" ? LANTERN_EMOJI : EMPTY_EMOJI;
      else {
        const colour = colours.get(i);
        row += colour === undefined ? EMPTY_EMOJI : COLOUR_SQUARES[colour];
      }
    }
    rows.push(row);
  }
  return rows;
}

export function buildShareText(input: ShareInput): string {
  const stars = Math.max(1, Math.min(3, Math.floor(input.stars)));
  const header = `${SHARE_TITLE} ${input.dateKey}`;
  const summary = `${stars} ${stars === 1 ? "star" : "stars"}  ${formatDuration(input.seconds)}`;
  const grid = emojiGrid(input.puzzle, input.tiles, input.hidePath ?? true);
  return [header, summary, ...grid].join("\n");
}
