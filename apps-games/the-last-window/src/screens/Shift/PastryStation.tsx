import {
  PASTRY_TOKENS,
  type PastryId,
  type PastryToken,
  pastryRule,
  type ShiftState,
} from "@web-games/the-last-window-core";
import { ItemIcon } from "../../art/ItemIcon";
import { pastryName, TOKEN_WORDS } from "../../labels";
import { t } from "../../strings";
import { Glyph } from "../../ui/Glyph";
import { plateGuide, targetPlate } from "./expected";

export interface PastryStationProps {
  state: ShiftState;
  guide: boolean;
  onPick: (id: PastryId) => void;
  onStep: (plate: number, token: PastryToken) => void;
  onSelectSeat: (seat: number) => void;
  onDiscard: (plate: number) => void;
}

export function pastryTokens(state: ShiftState): PastryToken[] {
  const used = new Set<PastryToken>();
  for (const entry of state.stock) {
    for (const token of pastryRule(entry.pastry).steps) used.add(token);
  }
  return PASTRY_TOKENS.filter((token) => token !== "plate" && used.has(token));
}

export function PastryStation({
  state,
  guide,
  onPick,
  onStep,
  onSelectSeat,
  onDiscard,
}: PastryStationProps) {
  const target = targetPlate(state);
  const targetPlateState = target === null ? null : (state.plates[target] ?? null);
  const targetGuide = targetPlateState === null ? null : plateGuide(targetPlateState);
  const activeSeat = state.active === null ? null : state.seats[state.active];
  const wantsPick =
    activeSeat !== null &&
    activeSeat !== undefined &&
    activeSeat.order?.pastry !== null &&
    activeSeat.order?.pastry !== undefined &&
    activeSeat.tray.pastry === null;
  const hasPlate = state.plates.some((plate) => plate !== null && plate.seat === state.active);
  return (
    <section class="tlw-station" aria-label={t("shiftPastryStation")} data-testid="pastry-station">
      <h2 class="tlw-station__title">{t("shiftPastryStation")}</h2>
      <div class="tlw-picks">
        {state.stock.map((entry) => {
          const out = entry.portions <= 0;
          const glow =
            guide && wantsPick && !hasPlate && activeSeat?.order?.pastry === entry.pastry;
          return (
            <button
              key={entry.pastry}
              type="button"
              class={`tlw-step tlw-step--item${glow ? " tlw-step--guide" : ""}`}
              aria-disabled={out}
              aria-label={
                out
                  ? t("shiftPastryOut", { pastry: pastryName(entry.pastry) })
                  : t("shiftPastryPick", {
                      pastry: pastryName(entry.pastry),
                      portions: entry.portions,
                    })
              }
              data-pastry={entry.pastry}
              onClick={() => onPick(entry.pastry)}
            >
              <ItemIcon slot={entry.pastry} />
              <span>{pastryName(entry.pastry)}</span>
              <span class="tlw-step__count">{entry.portions}</span>
            </button>
          );
        })}
      </div>
      <div class="tlw-plates">
        {state.plates.map((plate, index) => {
          if (plate === null) {
            return (
              <div key={index} class="tlw-plate tlw-plate--empty" data-testid={`plate-${index}`}>
                {t("shiftPlateEmpty", { n: index + 1 })}
              </div>
            );
          }
          const info = plateGuide(plate);
          const baking = plate.oven > 0;
          const ready = !baking && info.expected !== null && plate.step > 1;
          return (
            <div
              key={index}
              class={`tlw-plate${ready ? " tlw-plate--ready" : ""}${target === index ? " tlw-plate--target" : ""}`}
              data-testid={`plate-${index}`}
            >
              <button
                type="button"
                class="tlw-plate__body"
                aria-label={t("shiftPlateFull", {
                  n: index + 1,
                  pastry: pastryName(plate.pastry),
                  seat: plate.seat + 1,
                  state: baking
                    ? t("shiftOven", { seconds: (plate.oven / 10).toFixed(1) })
                    : ready
                      ? t("shiftOvenReady")
                      : t("shiftPlateStep", { step: info.step, total: info.total }),
                })}
                onClick={() => onSelectSeat(plate.seat)}
              >
                <ItemIcon slot={plate.pastry} />
                <span>
                  {baking
                    ? t("shiftOven", { seconds: (plate.oven / 10).toFixed(1) })
                    : ready
                      ? t("shiftOvenReady")
                      : t("shiftPlateStep", { step: info.step, total: info.total })}
                </span>
              </button>
              <button
                type="button"
                class="tlw-plate__discard"
                aria-label={t("shiftDiscard", { item: pastryName(plate.pastry) })}
                onClick={() => onDiscard(index)}
              >
                <Glyph name="trash" />
              </button>
            </div>
          );
        })}
      </div>
      <div class="tlw-steps">
        {pastryTokens(state).map((token) => {
          const next = targetGuide?.expected === token;
          const label =
            next && targetGuide && target !== null
              ? t("shiftPastryStep", {
                  pastry: pastryName(targetGuide.plate.pastry),
                  step: targetGuide.step,
                  total: targetGuide.total,
                  token: TOKEN_WORDS[token].toLowerCase(),
                })
              : t("shiftPastryStepPlain", { token: TOKEN_WORDS[token] });
          return (
            <button
              key={token}
              type="button"
              class={`tlw-step${guide && next ? " tlw-step--guide" : ""}`}
              aria-label={label}
              data-token={token}
              onClick={() => target !== null && onStep(target, token)}
            >
              {TOKEN_WORDS[token]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
