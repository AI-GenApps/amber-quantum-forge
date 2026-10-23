import {
  applyHint,
  type Brush,
  countTiles,
  createHistory,
  decodeTiles,
  dragPath,
  type Evaluation,
  emptyTiles,
  encodeTiles,
  equalTiles,
  eraseCells,
  evaluate,
  type Hint,
  type Locked,
  lockedMask,
  type Puzzle,
  type Tiles,
  tapCell,
} from "@web-games/lantern-loops-core";
import type { RunState } from "../save/runs";

/** What produced the latest change; feedback (sound, haptics, motion) reads it. */
export type EditCause =
  | "start"
  | "tap"
  | "drag"
  | "drag-end"
  | "cancel"
  | "undo"
  | "redo"
  | "restart"
  | "hint"
  | "brush";

export interface SessionState {
  cause: EditCause;
  tiles: Tiles;
  locked: Locked;
  hintCells: readonly number[];
  hintCount: number;
  elapsedMs: number;
  moves: number;
  brush: Brush;
  canUndo: boolean;
  canRedo: boolean;
  solved: boolean;
  /** Tiles the player placed that a restart would clear. */
  clearable: number;
  evaluation: Evaluation;
}

export interface SessionInit {
  puzzle: Puzzle;
  solution: Tiles;
  brush: Brush;
  saved?: RunState | null;
}

export type SessionListener = (state: SessionState) => void;

export interface Session {
  readonly puzzle: Puzzle;
  readonly solution: Tiles;
  state(): SessionState;
  subscribe(listener: SessionListener): () => void;
  setBrush(brush: Brush): void;
  tap(cell: number): boolean;
  erase(cell: number): boolean;
  beginDrag(): void;
  updateDrag(cells: readonly number[]): void;
  endDrag(): boolean;
  cancelDrag(): void;
  undo(): boolean;
  redo(): boolean;
  restart(): boolean;
  placeHint(hint: Hint): void;
  tick(ms: number): void;
  toRun(puzzleKey: string): RunState;
}

function restore(init: SessionInit): { tiles: Tiles; hintCells: number[]; run: RunState | null } {
  const { puzzle, solution, saved } = init;
  const fresh = { tiles: emptyTiles(puzzle), hintCells: [] as number[], run: null };
  if (!saved) return fresh;
  const decoded = decodeTiles(saved.tiles, puzzle.size);
  if (!decoded.ok) return fresh;
  const tiles = decoded.value;
  const hintCells = saved.locked.filter(
    (i) => i < tiles.length && puzzle.cells[i]?.fixed === undefined,
  );
  for (const i of hintCells) tiles[i] = solution[i] ?? 0;
  return { tiles, hintCells, run: saved };
}

export function createSession(init: SessionInit): Session {
  const { puzzle, solution } = init;
  const restored = restore(init);
  let tiles = restored.tiles;
  const hintCells = new Set<number>(restored.hintCells);
  let locked = lockedMask(puzzle, hintCells);
  let hintCount = restored.run?.hintCount ?? 0;
  let elapsedMs = restored.run?.elapsedMs ?? 0;
  let moves = restored.run?.moves ?? 0;
  let brush = init.brush;
  let dragBase: Tiles | null = null;
  let solvedFlag = evaluate(puzzle, tiles).solved;
  const history = createHistory(tiles);
  const listeners = new Set<SessionListener>();
  let cached: SessionState | null = null;

  let cause: EditCause = "start";

  const invalidate = (next: EditCause): void => {
    cause = next;
    cached = null;
    const snapshot = api.state();
    for (const listener of [...listeners]) listener(snapshot);
  };

  const overlayHints = (base: Tiles): Tiles => {
    const next = base.slice();
    for (const i of hintCells) next[i] = solution[i] ?? 0;
    return next;
  };

  const travel = (step: () => Tiles | null, kind: "undo" | "redo"): boolean => {
    for (let next = step(); next !== null; next = step()) {
      const shown = overlayHints(next);
      if (equalTiles(shown, tiles)) continue;
      tiles = shown;
      invalidate(kind);
      return true;
    }
    return false;
  };

  const settle = (): void => {
    if (!solvedFlag && evaluate(puzzle, tiles).solved) solvedFlag = true;
  };

  const commit = (next: Tiles, changed: boolean, kind: EditCause): boolean => {
    if (!changed || solvedFlag) return false;
    tiles = next;
    if (history.push(tiles)) moves += 1;
    settle();
    invalidate(kind);
    return true;
  };

  const api: Session = {
    puzzle,
    solution,
    state() {
      if (cached) return cached;
      const evaluation = evaluate(puzzle, tiles);
      const fixedCount = countTiles(emptyTiles(puzzle));
      cached = {
        cause,
        tiles,
        locked,
        hintCells: [...hintCells],
        hintCount,
        elapsedMs,
        moves,
        brush,
        canUndo: history.canUndo() && !solvedFlag,
        canRedo: history.canRedo() && !solvedFlag,
        solved: solvedFlag,
        clearable: Math.max(0, countTiles(tiles) - fixedCount - hintCells.size),
        evaluation,
      };
      return cached;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    setBrush(next) {
      if (brush === next) return;
      brush = next;
      invalidate("brush");
    },
    tap(cell) {
      const result = tapCell(puzzle, tiles, locked, cell, brush);
      return commit(result.tiles, result.changed.length > 0, "tap");
    },
    erase(cell) {
      const result = eraseCells(puzzle, tiles, locked, [cell]);
      return commit(result.tiles, result.changed.length > 0, "tap");
    },
    beginDrag() {
      if (!solvedFlag) dragBase = tiles.slice();
    },
    updateDrag(cells) {
      if (dragBase === null || solvedFlag) return;
      const result =
        brush === "erase"
          ? eraseCells(puzzle, dragBase, locked, cells)
          : dragPath(puzzle, dragBase, locked, cells);
      tiles = result.changed.length === 0 ? dragBase : result.tiles;
      invalidate("drag");
    },
    endDrag() {
      const base = dragBase;
      dragBase = null;
      if (base === null) return false;
      const changed = tiles.some((value, i) => value !== base[i]);
      if (!changed) return false;
      if (history.push(tiles)) moves += 1;
      settle();
      invalidate("drag-end");
      return true;
    },
    cancelDrag() {
      if (dragBase === null) return;
      tiles = dragBase;
      dragBase = null;
      invalidate("cancel");
    },
    undo() {
      if (solvedFlag) return false;
      return travel(() => history.undo(), "undo");
    },
    redo() {
      if (solvedFlag) return false;
      return travel(() => history.redo(), "redo");
    },
    restart() {
      if (solvedFlag || api.state().clearable === 0) return false;
      const cleared = overlayHints(emptyTiles(puzzle));
      return commit(cleared, true, "restart");
    },
    placeHint(hint) {
      if (solvedFlag) return;
      const placed = applyHint(tiles, locked, hint);
      hintCells.add(hint.cell);
      locked = placed.locked;
      hintCount += 1;
      tiles = placed.tiles;
      history.push(tiles);
      moves += 1;
      settle();
      invalidate("hint");
    },
    tick(ms) {
      if (solvedFlag || !(ms > 0)) return;
      elapsedMs += ms;
      cached = cached && { ...cached, elapsedMs };
    },
    toRun(puzzleKey) {
      return {
        puzzleKey,
        tiles: encodeTiles(tiles),
        locked: [...hintCells].sort((a, b) => a - b),
        hintCount,
        elapsedMs: Math.round(elapsedMs),
        moves,
      };
    },
  };
  return api;
}
