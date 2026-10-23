import { useEffect } from "preact/hooks";
import type { Session } from "../state/session";
import { deriveEvents } from "./derive";
import type { FeedbackBus } from "./events";

/** Emits feedback events for every change the player makes to the board. */
export function useBoardFeedback(bus: FeedbackBus, session: Session, showConflicts: boolean): void {
  useEffect(() => {
    let previous = session.state();
    return session.subscribe((next) => {
      const before = previous;
      previous = next;
      if (before === next) return;
      for (const event of deriveEvents(session.puzzle, before, next, { showConflicts })) {
        bus.emit(event);
      }
    });
  }, [bus, session, showConflicts]);
}
