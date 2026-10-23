/** Hint-token economy numbers (`economy.md`). Every number lives here once. */
export const TOKEN_CONFIG = {
  start: 3,
  cap: 20,
  hintCost: 1,
  daily: 1,
  dailyNoHintBonus: 1,
  archive: 1,
  chapterCleared: 5,
} as const;

/** Streak days to tokens, paid once per streak run. */
export const MILESTONES: Readonly<Record<number, number>> = {
  3: 1,
  7: 2,
  14: 2,
  30: 4,
  60: 5,
  100: 8,
};

export const MILESTONE_DAYS: readonly number[] = [3, 7, 14, 30, 60, 100];

export interface GrantResult {
  readonly balance: number;
  readonly granted: number;
  /** True when part or all of the amount was dropped because the jar is full. */
  readonly capped: boolean;
}

function whole(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function grant(balance: number, amount: number): GrantResult {
  const current = Math.min(whole(balance), TOKEN_CONFIG.cap);
  const wanted = whole(amount);
  const granted = Math.min(wanted, TOKEN_CONFIG.cap - current);
  return { balance: current + granted, granted, capped: granted < wanted };
}

export interface SpendResult {
  readonly ok: boolean;
  readonly balance: number;
}

export function spendHint(balance: number): SpendResult {
  const current = whole(balance);
  if (current < TOKEN_CONFIG.hintCost) return { ok: false, balance: current };
  return { ok: true, balance: current - TOKEN_CONFIG.hintCost };
}

export function dailyReward(hints: number): number {
  return TOKEN_CONFIG.daily + (hints === 0 ? TOKEN_CONFIG.dailyNoHintBonus : 0);
}

/** Tokens for reaching `days` of streak; 0 when the day is not a milestone. */
export function milestoneReward(days: number): number {
  return MILESTONES[days] ?? 0;
}

export function archiveReward(hints: number): number {
  return hints === 0 ? TOKEN_CONFIG.archive : 0;
}

export function chapterReward(): number {
  return TOKEN_CONFIG.chapterCleared;
}
