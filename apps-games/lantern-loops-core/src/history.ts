import { equalTiles, type Tiles } from "./board";

export const MAX_HISTORY_STEPS = 2000;

export interface History {
  /** Records a new board; equal boards are ignored. Inside a group, the group keeps one step. */
  push(tiles: Tiles): boolean;
  undo(): Tiles | null;
  redo(): Tiles | null;
  canUndo(): boolean;
  canRedo(): boolean;
  current(): Tiles;
  beginGroup(): void;
  endGroup(): void;
  /** Number of undo steps currently stored. */
  steps(): number;
  reset(initial: Tiles): void;
}

export function createHistory(initial: Tiles, maxSteps = MAX_HISTORY_STEPS): History {
  let states: Tiles[] = [initial.slice()];
  let at = 0;
  let grouping = false;
  let groupOpen = false;

  const closeGroup = (): void => {
    grouping = false;
    groupOpen = false;
  };

  return {
    push(tiles) {
      if (equalTiles(states[at] as Tiles, tiles)) return false;
      if (grouping && groupOpen) {
        states[at] = tiles.slice();
        const before = states[at - 1];
        if (before !== undefined && equalTiles(before, tiles)) {
          states.splice(at, 1);
          at -= 1;
          groupOpen = false;
        }
        return true;
      }
      states = states.slice(0, at + 1);
      states.push(tiles.slice());
      at += 1;
      if (states.length - 1 > maxSteps) {
        states.shift();
        at -= 1;
      }
      if (grouping) groupOpen = true;
      return true;
    },
    undo() {
      closeGroup();
      if (at === 0) return null;
      at -= 1;
      return (states[at] as Tiles).slice();
    },
    redo() {
      closeGroup();
      if (at >= states.length - 1) return null;
      at += 1;
      return (states[at] as Tiles).slice();
    },
    canUndo: () => at > 0,
    canRedo: () => at < states.length - 1,
    current: () => (states[at] as Tiles).slice(),
    beginGroup() {
      grouping = true;
      groupOpen = false;
    },
    endGroup: closeGroup,
    steps: () => at,
    reset(next) {
      states = [next.slice()];
      at = 0;
      closeGroup();
    },
  };
}
