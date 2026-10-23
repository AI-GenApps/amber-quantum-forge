import { ProgressBar } from "@web-games/kit";
import { t } from "../strings";

export interface BudgetMeterProps {
  left: number;
  budget: number;
  par: number;
}

export function BudgetMeter({ left, budget, par }: BudgetMeterProps) {
  const spent = budget - left;
  return (
    <div class="fd-budget" data-testid="budget">
      <ProgressBar value={left} max={budget} label={t("budgetLabel")} />
      <p class="fd-budget__text">
        <span data-testid="budget-left">{t("budgetValue", { left, budget })}</span>
        <span class={spent <= par ? "fd-budget__par fd-budget__par--ok" : "fd-budget__par"}>
          {t("budgetPar", { par })}
        </span>
      </p>
    </div>
  );
}
