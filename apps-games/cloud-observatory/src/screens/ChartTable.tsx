import {
  CATALOG,
  chartCost,
  constellationById,
  formatNumber,
  loreForTrigger,
} from "@web-games/cloud-observatory-core";
import { Screen } from "@web-games/kit";
import { useEffect, useRef, useState } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { OnboardingHint } from "../onboarding/OnboardingHint";
import { ChartBoard } from "../sky/ChartBoard";
import { t } from "../strings";
import { cx } from "../ui/cx";
import { atlasBonusPercent } from "./derive";

interface Completion {
  readonly name: string;
  readonly flawless: boolean;
  readonly mistakes: number;
  readonly cost: number;
  readonly bonus: number;
  readonly loreId: string | undefined;
  readonly loreTitle: string | undefined;
}

export function ChartTable({ id }: { id: string }) {
  const { session, snapshot, router, feedback, openEntry, notify } = useApp();
  const def = constellationById.get(id);
  const chart = snapshot.chart;
  const [done, setDone] = useState<Completion | null>(null);
  const finished = useRef(false);

  useEffect(
    () => () => {
      if (!finished.current) session.abandonChart();
    },
    [session],
  );

  if (def === undefined) return null;

  const leave = () => {
    session.abandonChart();
    if (!router.pop()) router.reset("shell");
  };

  const finish = () => {
    const cost = chartCost(def, snapshot.profile.game, CATALOG);
    const result = session.finishChart();
    if (!result.ok) {
      notify(t("chart.failed"), "danger");
      return;
    }
    finished.current = true;
    feedback.sfx("chart-done");
    feedback.haptic("success");
    const lore = loreForTrigger("constellation", def.id);
    setDone({
      name: def.name,
      flawless: result.flawless,
      mistakes: result.mistakes,
      cost,
      bonus: atlasBonusPercent(session.snapshot().profile),
      loreId: lore?.id,
      loreTitle: lore?.title,
    });
  };

  const next = chart?.next ?? (done ? def.stars.length : 0);
  const mistakes = chart?.mistakes ?? done?.mistakes ?? 0;

  return (
    <Screen name="chart" class="co-screen co-chart">
      <ScreenHeader title={def.name} onBack={leave} />
      <div class="co-chart__info">
        <div
          class="co-pips"
          role="img"
          aria-label={t("chart.progress", { next, total: def.stars.length })}
          data-pips={def.stars.length}
        >
          {def.stars.map((star, index) => (
            <span
              key={`${star.x}-${star.y}`}
              class={cx("co-pip", index < next && "co-pip--on")}
              data-pip={index < next ? "on" : "off"}
            />
          ))}
        </div>
        <p class="co-chart__count" data-progress={next}>
          {t("chart.progress", { next, total: def.stars.length })}
        </p>
        <p class="co-chart__mistakes" data-mistakes={mistakes}>
          {t("chart.mistakes", { count: mistakes })}
        </p>
      </div>
      <OnboardingHint screen="chart" />
      <ChartBoard
        stars={def.stars}
        next={next}
        closed={def.closed}
        label={t("chart.boardLabel", { name: def.name })}
        onTap={(index) => session.tapStar(index)}
        onComplete={finish}
      />
      <Btn variant="secondary" onClick={leave} class="co-chart__cancel">
        {t("chart.cancel")}
      </Btn>
      <ManagedSheet
        open={done !== null}
        title={t("chart.doneTitle", { name: done?.name ?? "" })}
        dismissOnBackdrop={false}
        onClose={() => router.pop()}
      >
        {done ? (
          <div class="co-stack" data-sheet="chart-complete">
            <p>
              {done.flawless
                ? t("chart.flawless")
                : t("chart.doneMistakes", { count: done.mistakes })}
            </p>
            <ul class="co-summary">
              <li>{t("chart.spent", { cost: formatNumber(done.cost) })}</li>
              <li>{t("chart.bonusNow", { percent: done.bonus })}</li>
              {done.loreTitle ? <li>{t("chart.newEntry", { title: done.loreTitle })}</li> : null}
            </ul>
            {done.loreId ? (
              <Btn
                variant="secondary"
                fullWidth
                onClick={() => {
                  if (done.loreId) openEntry(done.loreId);
                }}
              >
                {t("chart.readEntry")}
              </Btn>
            ) : null}
            <Btn fullWidth onClick={() => router.pop()}>
              {t("chart.backToAtlas")}
            </Btn>
          </div>
        ) : null}
      </ManagedSheet>
    </Screen>
  );
}
