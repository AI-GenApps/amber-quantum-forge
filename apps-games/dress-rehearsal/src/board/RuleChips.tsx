import type { RuleResult } from "@web-games/dress-rehearsal-core";
import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { t } from "../strings";
import { Icon } from "../ui/Icon";

export interface RuleChipsProps {
  rules: readonly RuleResult[];
  showDetail?: boolean;
  label?: string;
  /** True while the board is empty: rules that hold vacuously are not shown as met yet. */
  pending?: boolean;
}

function state(rule: RuleResult, pending: boolean): "true" | "false" | "pending" {
  if (pending) return "pending";
  return rule.met ? "true" : "false";
}

/** Rule checklist: every chip carries an icon and text, never colour alone. */
export function RuleChips({ rules, showDetail = true, label, pending = false }: RuleChipsProps) {
  const motion = useMotion();
  const list = useRef<HTMLUListElement>(null);
  const previous = useRef<Map<string, string> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the chips flip only when the rules or the pending flag change
  useEffect(() => {
    const next = new Map(rules.map((rule) => [rule.code, state(rule, pending)]));
    const before = previous.current;
    previous.current = next;
    if (before === null || !list.current) return;
    for (const chip of Array.from(list.current.children)) {
      const code = (chip as HTMLElement).dataset.code;
      const was = code === undefined ? undefined : before.get(code);
      const now = code === undefined ? undefined : next.get(code);
      if (was !== undefined && now !== undefined && was !== now && now !== "pending") {
        void motion.chipFlip(chip as HTMLElement);
      }
    }
  }, [rules, pending]);

  return (
    <ul ref={list} class="dr-chips" data-testid="rule-chips" aria-label={label ?? t("rulesLabel")}>
      {rules.map((rule) => {
        const status = state(rule, pending);
        const word =
          status === "pending"
            ? t("rulePending")
            : status === "true"
              ? t("ruleMet")
              : t("ruleUnmet");
        return (
          <li key={rule.code} class="dr-chip" data-code={rule.code} data-met={status}>
            <span class="dr-chip__icon">
              <Icon
                name={status === "pending" ? "brief" : status === "true" ? "check" : "cross"}
                size={18}
              />
            </span>
            <span class="dr-chip__body">
              <span class="dr-chip__text">{rule.chip}</span>
              {showDetail && status !== "pending" ? (
                <span class="dr-chip__detail">{rule.detail}</span>
              ) : null}
            </span>
            <span class="dr-sr-only">{word}</span>
          </li>
        );
      })}
    </ul>
  );
}
