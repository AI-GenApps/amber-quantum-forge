import { useEffect, useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { CoachCard, type CoachKind } from "../overlays/CoachCard";

/** The puzzles that introduce a mechanic with a one-time card. */
export const COACH_PUZZLES: Readonly<Record<string, CoachKind>> = {
  "bridge-01": "bridge",
  "sky-01": "sky",
};

/** The card to show on this puzzle (null once it was seen) and how to dismiss it for good. */
export function useCoachCard(puzzleKey: string): [CoachKind | null, () => void] {
  const { services } = useApp();
  const [kind, setKind] = useState<CoachKind | null>(null);

  useEffect(() => {
    const wanted = COACH_PUZZLES[puzzleKey];
    if (wanted === undefined) return undefined;
    let live = true;
    void services.flags.hasSeen(puzzleKey).then((seen) => {
      if (live && !seen) setKind(wanted);
    });
    return () => {
      live = false;
    };
  }, [services, puzzleKey]);

  const dismiss = (): void => {
    setKind(null);
    void services.flags.markSeen(puzzleKey);
  };
  return [kind, dismiss];
}

export function CoachCards({ kind, onDismiss }: { kind: CoachKind | null; onDismiss: () => void }) {
  return <CoachCard kind={kind} onDismiss={onDismiss} />;
}
