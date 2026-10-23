import {
  DRINK_TOKENS,
  type DrinkToken,
  drinkRule,
  type ShiftState,
} from "@web-games/the-last-window-core";
import { drinkName, TOKEN_WORDS } from "../../labels";
import { t } from "../../strings";
import { drinkGuide } from "./expected";

export interface DrinkStationProps {
  state: ShiftState;
  guide: boolean;
  onStep: (token: DrinkToken) => void;
}

export function drinkTokens(state: ShiftState): DrinkToken[] {
  const used = new Set<DrinkToken>();
  for (const id of state.def.unlocked.drinks) {
    for (const token of drinkRule(id).steps) used.add(token);
  }
  return DRINK_TOKENS.filter((token) => used.has(token));
}

export function DrinkStation({ state, guide, onStep }: DrinkStationProps) {
  const info = drinkGuide(state);
  const cup = state.cup;
  const waiting = cup !== null && cup.lock > 0;
  return (
    <section class="tlw-station" aria-label={t("shiftDrinkStation")} data-testid="drink-station">
      <h2 class="tlw-station__title">{t("shiftDrinkStation")}</h2>
      <p class="tlw-station__state" data-testid="cup-state">
        {cup === null
          ? t("shiftCupIdle")
          : t("shiftCupBusy", {
              drink: drinkName(cup.drink),
              seat: cup.seat + 1,
              step: Math.min(cup.step, drinkRule(cup.drink).steps.length),
              total: drinkRule(cup.drink).steps.length,
            })}
        {waiting && info ? (
          <span
            class="tlw-wait"
            role="progressbar"
            aria-label={t("shiftWait", { seconds: (cup.lock / 10).toFixed(1) })}
            aria-valuemin={0}
            aria-valuemax={info.lockTotal}
            aria-valuenow={info.lockTotal - cup.lock}
          >
            <span
              class="tlw-wait__fill"
              style={{
                width: `${Math.round(((info.lockTotal - cup.lock) / Math.max(1, info.lockTotal)) * 100)}%`,
              }}
            />
          </span>
        ) : null}
      </p>
      <div class="tlw-steps">
        {drinkTokens(state).map((token) => {
          const next = info?.expected === token;
          const label =
            next && info
              ? t("shiftStepLabel", {
                  drink: drinkName(info.drink),
                  step: info.step,
                  total: info.total,
                  token: TOKEN_WORDS[token].toLowerCase(),
                })
              : t("shiftStepPlain", { token: TOKEN_WORDS[token] });
          return (
            <button
              key={token}
              type="button"
              class={`tlw-step${guide && next ? " tlw-step--guide" : ""}`}
              aria-label={label}
              aria-disabled={waiting}
              data-token={token}
              onClick={() => onStep(token)}
            >
              {TOKEN_WORDS[token]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
