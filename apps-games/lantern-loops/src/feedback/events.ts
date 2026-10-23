import type { SoundId } from "../audio/sounds";

/** One thing that happened. Its id is also the sound id; cells and loops drive the motion. */
export interface FeedbackEvent {
  id: SoundId;
  /** Cells the event is about (changed tiles, newly lit lanterns). */
  cells?: readonly number[];
  /** Cell lists of newly closed loops in path order. */
  loops?: readonly (readonly number[])[];
}

export type FeedbackListener = (event: FeedbackEvent) => void;

export interface FeedbackBus {
  emit(event: FeedbackEvent | SoundId): void;
  subscribe(listener: FeedbackListener): () => void;
  /** The element that holds the board, so board events can animate it. Null off the puzzle screen. */
  setBoard(root: ParentNode | null): void;
  board(): ParentNode | null;
}

export function createFeedbackBus(): FeedbackBus {
  const listeners = new Set<FeedbackListener>();
  let root: ParentNode | null = null;
  return {
    emit(event) {
      const resolved: FeedbackEvent = typeof event === "string" ? { id: event } : event;
      for (const listener of [...listeners]) listener(resolved);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    setBoard(next) {
      root = next;
    },
    board: () => root,
  };
}
