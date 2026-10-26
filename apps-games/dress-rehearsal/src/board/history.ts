import type { Look } from "@web-games/dress-rehearsal-core";

export interface History {
  readonly past: readonly Look[];
  readonly present: Look;
  readonly future: readonly Look[];
}

export const HISTORY_LIMIT = 200;

export function sameLook(a: Look, b: Look): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Look>;
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}

export function startHistory(look: Look = {}): History {
  return { past: [], present: look, future: [] };
}

export function commit(history: History, next: Look): History {
  if (sameLook(history.present, next)) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function canUndo(history: History): boolean {
  return history.past.length > 0;
}

export function canRedo(history: History): boolean {
  return history.future.length > 0;
}

export function undo(history: History): History {
  const previous = history.past[history.past.length - 1];
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: History): History {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}
