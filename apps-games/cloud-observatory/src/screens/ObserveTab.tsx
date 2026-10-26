import { CATALOG, formatNumber, gatherValue } from "@web-games/cloud-observatory-core";
import { Card } from "@web-games/kit";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { Icon } from "../components/Icon";
import { SkyMap } from "../sky/SkyMap";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { NumberText } from "../ui/NumberText";
import { type NextGoal, nextGoal } from "./derive";

function goalText(goal: NextGoal): string {
  const cost = formatNumber(goal.cost);
  switch (goal.kind) {
    case "chart":
      return t("goal.chart", { name: goal.name, cost });
    case "eclipse":
      return t("goal.eclipse");
    case "gather":
      return t("goal.gather");
    case "upgrade":
      return goal.affordable
        ? t("goal.buyUpgrade", { name: goal.name, cost })
        : t("goal.saveUpgrade", { name: goal.name, cost });
    case "instrument":
      return goal.affordable
        ? t("goal.buy", { name: goal.name, cost })
        : t("goal.save", { name: goal.name, cost });
  }
}

export function ObserveTab() {
  const { session, snapshot, feedback, reducedMotion, router } = useApp();
  const { profile } = snapshot;
  const value = gatherValue(profile.game, CATALOG);
  const comet = session.cometStatus();
  const goal = nextGoal(profile);

  const gather = () => {
    if (session.gather().ok) feedback.sfx("gather");
  };

  return (
    <div class="co-observe" data-tab="observe">
      <SkyMap reducedMotion={reducedMotion} layers="full" class="co-observe__sky" />
      <div class="co-observe__top">
        {comet !== "locked" ? (
          <Btn
            variant="secondary"
            size="small"
            class="co-comet-btn"
            onClick={() => {
              feedback.sfx("click");
              router.push("comet");
            }}
          >
            <Icon name="comet" />
            <span>{t("observe.comet")}</span>
            <span class="co-comet-btn__state" data-comet={comet}>
              {t(`observe.comet.${comet}` as const)}
            </span>
          </Btn>
        ) : null}
      </div>
      <div class="co-observe__center">
        <button
          type="button"
          class="co-gather"
          onClick={gather}
          aria-label={t("observe.gatherLabel", { amount: formatNumber(value) })}
        >
          <span class="co-gather__word">{t("observe.gather")}</span>
          <span class="co-gather__value">
            +<NumberText value={value} />
          </span>
        </button>
        {!reducedMotion && profile.game.taps > 0 ? (
          <span key={profile.game.taps} class="co-pop" aria-hidden="true">
            +{formatNumber(value)}
          </span>
        ) : null}
      </div>
      <div class="co-observe__foot">
        <ArtImage slot="observatory-building" class="co-observe__building" />
        <Card class="co-goal" tone="raised">
          <p class="co-goal__text" data-goal={goal.kind}>
            {goalText(goal)}
          </p>
        </Card>
      </div>
    </div>
  );
}
