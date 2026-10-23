import { MAX_HEIGHT } from "./constants";
import type { CellKind } from "./types";

export type LayoutErrorCode = "EMPTY" | "RAGGED_ROW" | "BAD_TOKEN" | "BAD_HEIGHT";

export interface LayoutError {
  code: LayoutErrorCode;
  row: number;
  column: number;
}

export interface ParsedLayout {
  width: number;
  height: number;
  kinds: CellKind[];
  heights: number[];
}

export type LayoutResult = { ok: true; layout: ParsedLayout } | { ok: false; error: LayoutError };

const KIND_BY_CHAR: Readonly<Record<string, CellKind>> = {
  ".": "land",
  H: "house",
  F: "field",
  T: "scenery",
  I: "inlet",
  S: "sea",
};

const CHAR_BY_KIND: Readonly<Record<CellKind, string>> = {
  land: ".",
  house: "H",
  field: "F",
  scenery: "T",
  inlet: "I",
  sea: "S",
};

function fail(code: LayoutErrorCode, row: number, column: number): LayoutResult {
  return { ok: false, error: { code, row, column } };
}

export function parseLayout(rows: readonly string[]): LayoutResult {
  const first = rows[0];
  if (first === undefined || first.trim() === "") return fail("EMPTY", 0, 0);
  const width = first.split(" ").length;
  const kinds: CellKind[] = [];
  const heights: number[] = [];
  for (let row = 0; row < rows.length; row++) {
    const text = rows[row] as string;
    const tokens = text.split(" ");
    if (text.trim() === "" || tokens.length !== width) {
      return fail("RAGGED_ROW", row, Math.min(tokens.length, width));
    }
    for (let column = 0; column < tokens.length; column++) {
      const token = tokens[column] as string;
      const kind = token.length === 2 ? KIND_BY_CHAR[token.charAt(0)] : undefined;
      if (kind === undefined) return fail("BAD_TOKEN", row, column);
      const height = token.charCodeAt(1) - 48;
      if (height < 0 || height > MAX_HEIGHT) return fail("BAD_HEIGHT", row, column);
      kinds.push(kind);
      heights.push(height);
    }
  }
  return { ok: true, layout: { width, height: rows.length, kinds, heights } };
}

export function formatLayout(layout: ParsedLayout): string[] {
  const rows: string[] = [];
  for (let y = 0; y < layout.height; y++) {
    const tokens: string[] = [];
    for (let x = 0; x < layout.width; x++) {
      const i = y * layout.width + x;
      tokens.push(`${CHAR_BY_KIND[layout.kinds[i] as CellKind]}${layout.heights[i]}`);
    }
    rows.push(tokens.join(" "));
  }
  return rows;
}
