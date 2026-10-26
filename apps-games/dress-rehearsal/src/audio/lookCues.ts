import type { LivePreview, RuleResult } from "@web-games/dress-rehearsal-core";
import type { FeedbackEvent } from "./events";

export interface TimedEvent {
  readonly delayMs: number;
  readonly event: FeedbackEvent;
}

export const RULE_CUE_DELAY_MS = 90 as const;
export const COMPLETE_CUE_DELAY_MS = 200 as const;

export function ruleTransitions(
  before: readonly RuleResult[],
  after: readonly RuleResult[],
): { met: number; broken: number } {
  const was = new Map(before.map((rule) => [rule.code, rule.met]));
  let met = 0;
  let broken = 0;
  for (const rule of after) {
    const previous = was.get(rule.code);
    if (previous === undefined || previous === rule.met) continue;
    if (rule.met) met += 1;
    else broken += 1;
  }
  return { met, broken };
}

/**
 * Cues for what a board change did to the checklist: one chip sound (a rule that broke wins over
 * a rule that was met) and, when the last slot got filled, the look-complete chime.
 */
export function lookCues(before: LivePreview, after: LivePreview): TimedEvent[] {
  const out: TimedEvent[] = [];
  const { met, broken } = ruleTransitions(before.rules, after.rules);
  if (broken > 0) out.push({ delayMs: RULE_CUE_DELAY_MS, event: { type: "rule-broken" } });
  else if (met > 0) out.push({ delayMs: RULE_CUE_DELAY_MS, event: { type: "rule-met" } });
  if (!before.complete && after.complete) {
    out.push({ delayMs: COMPLETE_CUE_DELAY_MS, event: { type: "look-complete" } });
  }
  return out;
}
