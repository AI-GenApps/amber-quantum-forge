import type { Tiles } from "./board";
import { cellAt, type Puzzle } from "./puzzle";
import { E, isTileMask, MIRROR_CORNERS, N, S, W } from "./tile";

/** Cell states in domain bit order: bit k of a domain means STATE_MASKS[k] is still possible. */
export const STATE_MASKS: readonly number[] = [0, 10, 5, 3, 6, 12, 9];
export const ALL_STATES = 0b1111111;
export const EMPTY_STATE = 1;

const BIT_OF_MASK = new Uint8Array(16);
STATE_MASKS.forEach((mask, k) => {
  BIT_OF_MASK[mask] = 1 << k;
});

export function stateBit(mask: number): number {
  return BIT_OF_MASK[mask] ?? 0;
}

function statesWith(dir: number): number {
  let set = 0;
  STATE_MASKS.forEach((mask, k) => {
    if ((mask & dir) !== 0) set |= 1 << k;
  });
  return set;
}

/** HAS[dir] and LACK[dir] are the state sets that do and do not open towards dir. */
export const HAS: Readonly<Record<number, number>> = {
  [N]: statesWith(N),
  [E]: statesWith(E),
  [S]: statesWith(S),
  [W]: statesWith(W),
};
export const LACK: Readonly<Record<number, number>> = {
  [N]: ALL_STATES & ~statesWith(N),
  [E]: ALL_STATES & ~statesWith(E),
  [S]: ALL_STATES & ~statesWith(S),
  [W]: ALL_STATES & ~statesWith(W),
};
export const NOT_EMPTY = ALL_STATES & ~EMPTY_STATE;

/** Initial domains from clues, fixed tiles, the board edge and the partial board. */
export function buildDomains(puzzle: Puzzle, partial?: Tiles): Uint8Array | null {
  const n = puzzle.size;
  const dom = new Uint8Array(n * n);
  for (let i = 0; i < dom.length; i++) {
    const cell = cellAt(puzzle, i);
    let set = ALL_STATES;
    if (cell.kind === "stone") set = EMPTY_STATE;
    else {
      const clue = cell.clue;
      if (clue?.kind === "lantern") set &= NOT_EMPTY;
      else if (clue?.kind === "mirror") {
        set &= MIRROR_CORNERS[clue.shape].reduce((acc, m) => acc | stateBit(m), 0);
      } else if (clue?.kind === "gate") set &= stateBit(10) | stateBit(5);
      if (cell.fixed !== undefined) set &= stateBit(cell.fixed);
      const given = partial?.[i] ?? 0;
      if (given !== 0) set &= isTileMask(given) ? stateBit(given) : 0;
      const row = Math.floor(i / n);
      const col = i % n;
      if (row === 0) set &= LACK[N] as number;
      if (row === n - 1) set &= LACK[S] as number;
      if (col === 0) set &= LACK[W] as number;
      if (col === n - 1) set &= LACK[E] as number;
    }
    if (cell.kind === "stone" && (partial?.[i] ?? 0) !== 0) return null;
    if (set === 0) return null;
    dom[i] = set;
  }
  return dom;
}

export function isSingleton(set: number): boolean {
  return set !== 0 && (set & (set - 1)) === 0;
}

export interface Propagator {
  /** Runs arc consistency and stone bounds from the seed cells to a fixed point. False on contradiction. */
  run(dom: Uint8Array, seeds: readonly number[]): boolean;
  full(dom: Uint8Array): boolean;
}

interface StoneBound {
  readonly target: number;
  readonly around: number[];
}

/** Edge arc consistency plus stone-count bounds, with a worklist so searches can re-run it cheaply. */
export function createPropagator(puzzle: Puzzle): Propagator {
  const n = puzzle.size;
  const total = n * n;
  const stones: StoneBound[] = [];
  const stonesAround: number[][] = Array.from({ length: total }, () => []);
  const links: Array<Array<{ to: number; here: number; there: number }>> = Array.from(
    { length: total },
    () => [],
  );
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / n);
    const col = i % n;
    const steps: Array<[number, number, number, number]> = [
      [row > 0 ? i - n : -1, N, S, 0],
      [col < n - 1 ? i + 1 : -1, E, W, 0],
      [row < n - 1 ? i + n : -1, S, N, 0],
      [col > 0 ? i - 1 : -1, W, E, 0],
    ];
    const around: number[] = [];
    for (const [to, here, there] of steps) {
      if (to < 0) continue;
      (links[i] as Array<{ to: number; here: number; there: number }>).push({ to, here, there });
      if (cellAt(puzzle, to).kind === "open") around.push(to);
    }
    const cell = cellAt(puzzle, i);
    if (cell.kind === "stone") {
      const index = stones.length;
      stones.push({ target: cell.stone ?? 0, around });
      for (const j of around) (stonesAround[j] as number[]).push(index);
    }
  }
  const queued = new Uint8Array(total);
  const queue = new Int32Array(total * 10);

  const run = (dom: Uint8Array, seeds: readonly number[]): boolean => {
    let head = 0;
    let tail = 0;
    const push = (cell: number): void => {
      if (queued[cell] === 1) return;
      queued[cell] = 1;
      queue[tail++] = cell;
    };
    const clear = (): void => {
      for (let k = head; k < tail; k++) queued[queue[k] as number] = 0;
    };
    for (const seed of seeds) push(seed);
    while (head < tail) {
      const u = queue[head++] as number;
      queued[u] = 0;
      for (const link of links[u] as Array<{ to: number; here: number; there: number }>) {
        const setA = dom[u] as number;
        const setB = dom[link.to] as number;
        const hasHere = HAS[link.here] as number;
        const hasThere = HAS[link.there] as number;
        const lackHere = LACK[link.here] as number;
        const lackThere = LACK[link.there] as number;
        const can1 = (setA & hasHere) !== 0 && (setB & hasThere) !== 0;
        const can0 = (setA & lackHere) !== 0 && (setB & lackThere) !== 0;
        let nextA = setA;
        let nextB = setB;
        if (!can1) {
          nextA &= ~hasHere;
          nextB &= ~hasThere;
        }
        if (!can0) {
          nextA &= ~lackHere;
          nextB &= ~lackThere;
        }
        if (nextA === 0 || nextB === 0) {
          clear();
          return false;
        }
        if (nextA !== setA) {
          dom[u] = nextA;
          push(u);
        }
        if (nextB !== setB) {
          dom[link.to] = nextB;
          push(link.to);
        }
      }
      for (const index of stonesAround[u] as number[]) {
        const stone = stones[index] as StoneBound;
        let must = 0;
        let may = 0;
        for (const j of stone.around) {
          const set = dom[j] as number;
          if ((set & EMPTY_STATE) === 0) must++;
          if ((set & NOT_EMPTY) !== 0) may++;
        }
        if (must > stone.target || may < stone.target) {
          clear();
          return false;
        }
        const forceEmpty = must === stone.target;
        const forceTile = may === stone.target;
        if (!forceEmpty && !forceTile) continue;
        for (const j of stone.around) {
          const set = dom[j] as number;
          if ((set & EMPTY_STATE) === 0 || (set & NOT_EMPTY) === 0) continue;
          dom[j] = forceEmpty ? EMPTY_STATE : set & NOT_EMPTY;
          push(j);
        }
      }
    }
    return true;
  };

  return {
    run,
    full: (dom) =>
      run(
        dom,
        Array.from({ length: total }, (_, i) => i),
      ),
  };
}
