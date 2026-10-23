import {
  type EconomyEvent,
  type Evaluation,
  headlineFor,
  REGIONS,
  THEMES,
} from "@web-games/floodplain-dispatch-core";
import { Button, StarRating } from "@web-games/kit";
import { t } from "../strings";
import { Glyph } from "../ui/Glyph";
import { AppSheet } from "./AppSheet";

export interface ResultProps {
  open: boolean;
  evaluation: Evaluation;
  budget: number;
  events: readonly EconomyEvent[] | null;
  streak: number | null;
  next: string | null;
  shareNote: string;
  onNext: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onShare: () => void;
  onClose: () => void;
}

export function coinsFrom(events: readonly EconomyEvent[] | null): number {
  let total = 0;
  for (const event of events ?? []) if (event.type === "coins-gained") total += event.amount;
  return total;
}

export function unlockLines(events: readonly EconomyEvent[] | null): string[] {
  const lines: string[] = [];
  for (const event of events ?? []) {
    if (event.type === "region-unlocked") {
      const region = REGIONS.find((entry) => entry.id === event.region);
      lines.push(t("resultUnlockRegion", { name: region?.name ?? event.region }));
    } else if (event.type === "theme-unlocked") {
      const theme = THEMES.find((entry) => entry.id === event.themeId);
      lines.push(t("resultUnlockTheme", { name: theme?.name ?? event.themeId }));
    }
  }
  return lines;
}

function Goal({ met, text }: { met: boolean; text: string }) {
  return (
    <li class={met ? "fd-goal fd-goal--met" : "fd-goal"}>
      <Glyph kind={met ? "check" : "dot"} size={18} />
      <span>{text}</span>
      <span class="fd-sr-only">{met ? "met" : "not met"}</span>
    </li>
  );
}

export function Result(props: ResultProps) {
  const { evaluation: ev } = props;
  const coins = coinsFrom(props.events);
  const lines = unlockLines(props.events);
  return (
    <AppSheet open={props.open} onClose={props.onClose} title={headlineFor(ev.stars)}>
      <div class="fd-result" data-testid="result">
        <StarRating value={ev.stars} label={t("resultStarsLabel", { stars: ev.stars })} />
        <p class="fd-result__score" data-testid="result-score">
          {t("resultScore", { score: ev.score })}
        </p>
        <p>{t("resultSpend", { spend: ev.spend, par: ev.par, budget: props.budget })}</p>
        <ul class="fd-result__list">
          <li>{t("resultHouses", { supplied: ev.housesSupplied, total: ev.housesTotal })}</li>
          <li>
            {ev.housesFlooded > 0
              ? t("resultFlooded", { flooded: ev.housesFlooded })
              : t("resultNoFlood")}
          </li>
          <li>{t("resultFields", { irrigated: ev.fieldsIrrigated, total: ev.fieldsTotal })}</li>
        </ul>
        <ul class="fd-result__goals" aria-label="Star goals">
          <Goal met={ev.starSupply} text={t("resultGoalSupply")} />
          <Goal met={ev.starDry} text={t("resultGoalDry")} />
          <Goal met={ev.starThrift} text={t("resultGoalThrift")} />
        </ul>
        {coins > 0 ? <p class="fd-result__coins">{t("resultCoins", { amount: coins })}</p> : null}
        {props.streak !== null ? <p>{t("resultStreak", { streak: props.streak })}</p> : null}
        {lines.map((line) => (
          <p key={line} class="fd-result__unlock">
            {line}
          </p>
        ))}
        {props.shareNote ? (
          <p role="status" class="fd-result__note">
            {props.shareNote}
          </p>
        ) : null}
      </div>
      <div class="fd-sheet__actions fd-sheet__actions--wrap">
        {props.next ? <Button onClick={props.onNext}>{t("resultNext")}</Button> : null}
        <Button variant="secondary" onClick={props.onRetry}>
          {t("resultRetry")}
        </Button>
        <Button variant="secondary" onClick={props.onEdit}>
          {t("resultEdit")}
        </Button>
        <Button variant="secondary" onClick={props.onShare}>
          {t("resultShare")}
        </Button>
      </div>
    </AppSheet>
  );
}
