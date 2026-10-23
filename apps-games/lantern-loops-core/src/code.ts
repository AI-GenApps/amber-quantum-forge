import type { Tiles } from "./board";
import {
  type Cell,
  type Clue,
  COLOURS,
  type Colour,
  gate,
  lantern,
  MAX_SIZE,
  mirror,
  openCell,
  type Puzzle,
  stoneCell,
  validatePuzzleShape,
} from "./puzzle";
import { isLegalTile } from "./tile";

export type CodeErrorCode =
  | "not-a-string"
  | "empty"
  | "too-long"
  | "bad-row-count"
  | "row-length"
  | "bad-token"
  | "bad-fixed"
  | "invalid-puzzle"
  | "bad-tiles"
  | "bad-length";

export interface CodeError {
  readonly code: CodeErrorCode;
  readonly message: string;
  readonly position: number | null;
}

export type CodeResult<T> =
  | { readonly ok: true; value: T }
  | { readonly ok: false; error: CodeError };

const ROW_SEPARATOR = "|";
const MAX_CODE_LENGTH = 4 * MAX_SIZE * MAX_SIZE + MAX_SIZE;
const COLOUR_LETTERS: Readonly<Record<Colour, string>> = {
  amber: "a",
  rose: "r",
  jade: "j",
  azure: "b",
  violet: "v",
};
const LETTER_COLOURS: Readonly<Record<string, Colour>> = Object.fromEntries(
  COLOURS.map((colour) => [COLOUR_LETTERS[colour], colour]),
);

function fail<T>(
  code: CodeErrorCode,
  message: string,
  position: number | null = null,
): CodeResult<T> {
  return { ok: false, error: { code, message, position } };
}

function encodeClue(clue: Clue): string {
  if (clue.kind === "lantern") return `L${COLOUR_LETTERS[clue.colour]}`;
  if (clue.kind === "gate") return `G${COLOUR_LETTERS[clue.colour]}`;
  return `M${clue.shape}`;
}

function encodeCell(cell: Cell): string {
  if (cell.kind === "stone") return `S${cell.stone ?? 0}`;
  const base = cell.clue === undefined ? "." : encodeClue(cell.clue);
  return cell.fixed === undefined ? base : `${base}=${cell.fixed.toString(16)}`;
}

/** One segment per row, separated by "|", one token per cell. */
export function encodePuzzle(puzzle: Puzzle): string {
  const rows: string[] = [];
  for (let r = 0; r < puzzle.size; r++) {
    let row = "";
    for (let c = 0; c < puzzle.size; c++)
      row += encodeCell(puzzle.cells[r * puzzle.size + c] as Cell);
    rows.push(row);
  }
  return rows.join(ROW_SEPARATOR);
}

interface Parsed {
  readonly cell: Cell;
  readonly next: number;
}

function parseCell(row: string, at: number): CodeResult<Parsed> {
  const head = row[at];
  let clue: Clue | undefined;
  let pos = at + 1;
  if (head === ".") {
    clue = undefined;
  } else if (head === "S") {
    const digit = row[pos];
    if (digit === undefined || !/^[0-4]$/.test(digit))
      return fail("bad-token", "stone needs a digit 0-4", at);
    if (row[pos + 1] === "=") return fail("bad-fixed", "stone cannot hold a tile", pos + 1);
    return { ok: true, value: { cell: stoneCell(Number(digit)), next: pos + 1 } };
  } else if (head === "L" || head === "G") {
    const colour = LETTER_COLOURS[row[pos] ?? ""];
    if (colour === undefined) return fail("bad-token", "unknown colour letter", pos);
    pos += 1;
    clue = head === "L" ? { kind: "lantern", colour } : { kind: "gate", colour };
  } else if (head === "M") {
    const shape = row[pos];
    if (shape !== "/" && shape !== "\\") return fail("bad-token", "mirror needs / or \\", pos);
    pos += 1;
    clue = { kind: "mirror", shape };
  } else {
    return fail("bad-token", `unknown token ${head ?? "end"}`, at);
  }
  let fixed: number | undefined;
  if (row[pos] === "=") {
    const digit = row[pos + 1] ?? "";
    if (!/^[0-9a-f]$/.test(digit))
      return fail("bad-fixed", "fixed tile needs one hex digit", pos + 1);
    fixed = Number.parseInt(digit, 16);
    if (!isLegalTile(fixed) || fixed === 0)
      return fail("bad-fixed", "fixed tile is not one of the six tiles", pos + 1);
    pos += 2;
  }
  return {
    ok: true,
    value: {
      cell: clue === undefined ? openCell(undefined, fixed) : withClue(clue, fixed),
      next: pos,
    },
  };
}

function withClue(clue: Clue, fixed: number | undefined): Cell {
  if (clue.kind === "lantern") return lantern(clue.colour, fixed);
  if (clue.kind === "gate") return gate(clue.colour, fixed);
  return mirror(clue.shape, fixed);
}

export function decodePuzzle(code: string, id = "custom"): CodeResult<Puzzle> {
  if (typeof code !== "string") return fail("not-a-string", "code must be a string");
  if (code.length === 0) return fail("empty", "code is empty");
  if (code.length > MAX_CODE_LENGTH) return fail("too-long", "code is too long");
  const rows = code.split(ROW_SEPARATOR);
  const size = rows.length;
  if (size < 4 || size > MAX_SIZE) return fail("bad-row-count", `${size} rows is not a valid size`);
  const cells: Cell[] = [];
  for (let r = 0; r < size; r++) {
    const row = rows[r] as string;
    let at = 0;
    let count = 0;
    while (at < row.length) {
      const parsed = parseCell(row, at);
      if (!parsed.ok) {
        const base = rows.slice(0, r).reduce((sum, line) => sum + line.length + 1, 0);
        return fail(parsed.error.code, parsed.error.message, base + (parsed.error.position ?? at));
      }
      cells.push(parsed.value.cell);
      at = parsed.value.next;
      count += 1;
      if (count > size) break;
    }
    if (count !== size)
      return fail("row-length", `row ${r + 1} has ${count} cells, expected ${size}`);
  }
  const puzzle: Puzzle = { id, size, cells };
  const shape = validatePuzzleShape(puzzle);
  if (!shape.ok) return fail("invalid-puzzle", shape.errors[0]?.message ?? "invalid puzzle");
  return { ok: true, value: puzzle };
}

/** One hex digit per cell, row-major. */
export function encodeTiles(tiles: Tiles): string {
  let out = "";
  for (let i = 0; i < tiles.length; i++) out += (tiles[i] ?? 0).toString(16);
  return out;
}

export function decodeTiles(code: string, size: number): CodeResult<Tiles> {
  if (typeof code !== "string") return fail("not-a-string", "code must be a string");
  if (code.length !== size * size) return fail("bad-length", `expected ${size * size} digits`);
  const tiles = new Uint8Array(code.length);
  for (let i = 0; i < code.length; i++) {
    const digit = code[i] as string;
    if (!/^[0-9a-f]$/.test(digit)) return fail("bad-tiles", "tile code needs hex digits", i);
    const mask = Number.parseInt(digit, 16);
    if (!isLegalTile(mask)) return fail("bad-tiles", "tile is not one of the six tiles", i);
    tiles[i] = mask;
  }
  return { ok: true, value: tiles };
}
