import { DIRECTIONS } from "../board";
import type { Placement } from "../types";

export interface Dims {
  width: number;
  height: number;
}

export function neighborCells(board: Dims, index: number): number[] {
  const x = index % board.width;
  const y = Math.floor(index / board.width);
  const out: number[] = [];
  for (const dir of DIRECTIONS) {
    const nx = x + (dir === "E" ? 1 : dir === "W" ? -1 : 0);
    const ny = y + (dir === "S" ? 1 : dir === "N" ? -1 : 0);
    if (nx >= 0 && ny >= 0 && nx < board.width && ny < board.height)
      out.push(ny * board.width + nx);
  }
  return out;
}

export function placementKey(placements: readonly Placement[], board: Dims): string {
  return placements
    .map((p) => {
      const cell = p.y * board.width + p.x;
      return `${cell}${p.kind[0]}${p.dir ?? ""}${p.opensWeek ?? ""}-${p.closesWeek ?? ""}`;
    })
    .sort()
    .join("|");
}

export class MinHeap<T> {
  private readonly items: { priority: number; value: T }[] = [];

  get size(): number {
    return this.items.length;
  }

  push(priority: number, value: T): void {
    const items = this.items;
    items.push({ priority, value });
    let at = items.length - 1;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      const up = items[parent];
      const me = items[at];
      if (!up || !me || up.priority <= me.priority) break;
      items[parent] = me;
      items[at] = up;
      at = parent;
    }
  }

  pop(): T | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (!top) return undefined;
    if (items.length > 0 && last) {
      items[0] = last;
      let at = 0;
      for (;;) {
        const left = at * 2 + 1;
        const right = left + 1;
        let low = at;
        if (items[left] && (items[left]?.priority ?? 0) < (items[low]?.priority ?? 0)) low = left;
        if (items[right] && (items[right]?.priority ?? 0) < (items[low]?.priority ?? 0))
          low = right;
        if (low === at) break;
        const a = items[at];
        const b = items[low];
        if (!a || !b) break;
        items[at] = b;
        items[low] = a;
        at = low;
      }
    }
    return top.value;
  }
}

export interface PathField {
  dist: Float64Array;
  prev: Int32Array;
}

export interface Surface extends Dims {
  heights: ArrayLike<number>;
}

export function pathField(
  board: Surface,
  sources: readonly number[],
  passable: (cell: number) => boolean,
  jitter: Float64Array,
): PathField {
  const count = board.width * board.height;
  const dist = new Float64Array(count).fill(Number.POSITIVE_INFINITY);
  const prev = new Int32Array(count).fill(-1);
  const heap = new MinHeap<number>();
  for (const cell of sources) {
    if (!passable(cell)) continue;
    const start = 1 + (jitter[cell] ?? 0);
    if (start < (dist[cell] ?? Number.POSITIVE_INFINITY)) {
      dist[cell] = start;
      heap.push(start, cell);
    }
  }
  for (let cell = heap.pop(); cell !== undefined; cell = heap.pop()) {
    const here = dist[cell] ?? 0;
    for (const next of neighborCells(board, cell)) {
      if (!passable(next)) continue;
      const climb = Math.max(0, (board.heights[next] ?? 0) - (board.heights[cell] ?? 0));
      const cost = here + 1 + 0.12 * climb + (jitter[next] ?? 0);
      if (cost < (dist[next] ?? Number.POSITIVE_INFINITY)) {
        dist[next] = cost;
        prev[next] = cell;
        heap.push(cost, next);
      }
    }
  }
  return { dist, prev };
}

export function traceBack(field: PathField, end: number): number[] {
  const out: number[] = [];
  for (let cell = end; cell >= 0; cell = field.prev[cell] ?? -1) out.push(cell);
  return out;
}
