import type { Placement } from "@web-games/floodplain-dispatch-core";

function sameKind(a: Placement, b: Placement): boolean {
  return a.x === b.x && a.y === b.y && a.kind === b.kind;
}

function sameSetup(a: Placement, b: Placement): boolean {
  return (
    sameKind(a, b) &&
    a.dir === b.dir &&
    (a.opensWeek ?? null) === (b.opensWeek ?? null) &&
    (a.closesWeek ?? null) === (b.closesWeek ?? null)
  );
}

/** The next reference piece the plan does not hold yet, or null when the plan matches it. */
export function nextHint(
  reference: readonly Placement[],
  placements: readonly Placement[],
): Placement | null {
  for (const piece of reference) {
    if (!placements.some((own) => sameSetup(own, piece))) return { ...piece };
  }
  return null;
}
