export type DailyKind = "direct" | "rule-out";

export interface DailyTier {
  weekday: number;
  label: string;
  objects: number;
  kinds: readonly [DailyKind, DailyKind];
  flavour: number;
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function tier(
  weekday: number,
  objects: number,
  kinds: readonly [DailyKind, DailyKind],
  flavour: number,
): DailyTier {
  return { weekday, label: WEEKDAY_LABELS[weekday] ?? "", objects, kinds, flavour };
}

export const TIERS: readonly DailyTier[] = [
  tier(0, 3, ["direct", "direct"], 1),
  tier(1, 3, ["direct", "direct"], 1),
  tier(2, 4, ["direct", "direct"], 2),
  tier(3, 4, ["direct", "rule-out"], 2),
  tier(4, 4, ["direct", "rule-out"], 2),
  tier(5, 5, ["direct", "rule-out"], 3),
  tier(6, 5, ["rule-out", "rule-out"], 3),
];

export function tierFor(weekday: number): DailyTier {
  const index = ((Math.trunc(weekday) % 7) + 7) % 7;
  return TIERS[index] as DailyTier;
}
