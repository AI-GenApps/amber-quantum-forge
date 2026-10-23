import { useEffect, useState } from "preact/hooks";
import { type CaseTarget, isDailyTarget } from "../nav";
import { useApp } from "./app";
import type { ActiveCase } from "./game";
import { useGame } from "./useGame";

export function matchesTarget(active: ActiveCase | null, target: CaseTarget): active is ActiveCase {
  if (active === null) return false;
  return isDailyTarget(target)
    ? active.kind === "daily"
    : active.kind === "campaign" && active.id === target.caseId;
}

export interface CaseView {
  active: ActiveCase | null;
  /** Set when the case could not be opened (locked or unknown). */
  failed: boolean;
}

/** Returns the open case for a route target, resuming it from the store or the save when needed. */
export function useCase(target: CaseTarget, ensure = true): CaseView {
  const { game } = useApp();
  const { active } = useGame();
  const [failed, setFailed] = useState(false);
  const matched = matchesTarget(active, target);
  const key = isDailyTarget(target) ? "daily" : target.caseId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: key identifies the target
  useEffect(() => {
    if (!ensure || matched) return;
    let alive = true;
    const start = isDailyTarget(target) ? game.startDaily() : game.startCase(target.caseId);
    void start.then((outcome) => {
      if (alive && !outcome.ok) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [game, key, matched, ensure]);
  return { active: matched ? active : null, failed };
}
