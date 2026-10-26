import { openSlots, type Slot, type SlotSetId } from "@web-games/dress-rehearsal-core";

export const GRID_COLUMNS = 3 as const;

export interface SlotCell {
  readonly slot: Slot;
  /** 1-based grid column. */
  readonly col: number;
  /** 1-based grid row. */
  readonly row: number;
  readonly rowSpan: number;
}

export interface SlotLayout {
  readonly cells: readonly SlotCell[];
  readonly rows: number;
}

/** Flat-lay reading order: head and accessories first, then the base, then the feet. */
export const FLOW_ORDER: readonly Slot[] = [
  "hat",
  "accessory",
  "bag",
  "outer",
  "top",
  "dress",
  "shoes",
  "bottom",
];

export function rowSpanOf(slot: Slot): number {
  return slot === "dress" ? 2 : 1;
}

/**
 * Dense row-major placement of the open slots on a three-column grid. The dress is two rows tall,
 * so it spans the rows of the top and the bottom next to it. The DOM board and the export image
 * use the same cells.
 */
export function layoutFor(set: SlotSetId): SlotLayout {
  return layoutFromSlots(openSlots(set));
}

export function layoutFromSlots(open: readonly Slot[]): SlotLayout {
  const taken = new Set<string>();
  const cells: SlotCell[] = [];
  let rows = 0;
  for (const slot of FLOW_ORDER) {
    if (!open.includes(slot)) continue;
    const span = rowSpanOf(slot);
    for (let row = 1; ; row += 1) {
      let placed = false;
      for (let col = 1; col <= GRID_COLUMNS; col += 1) {
        const free = Array.from({ length: span }, (_, i) => `${col}:${row + i}`).every(
          (key) => !taken.has(key),
        );
        if (!free) continue;
        for (let i = 0; i < span; i += 1) taken.add(`${col}:${row + i}`);
        cells.push({ slot, col, row, rowSpan: span });
        rows = Math.max(rows, row + span - 1);
        placed = true;
        break;
      }
      if (placed) break;
    }
  }
  return { cells, rows };
}
