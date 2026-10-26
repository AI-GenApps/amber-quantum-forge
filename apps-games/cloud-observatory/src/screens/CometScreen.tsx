import {
  type ChartSession,
  formatNumber,
  type Point,
  type TapResult,
  tapStar as tapChartStar,
} from "@web-games/cloud-observatory-core";
import { Card, Screen } from "@web-games/kit";
import { useMemo, useState } from "preact/hooks";
import { useApp } from "../app/context";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { CometResult } from "../session/types";
import { ChartBoard } from "../sky/ChartBoard";
import { t } from "../strings";

function freshTrace(pattern: readonly Point[]): ChartSession {
  return { constellationId: "comet", starCount: pattern.length, next: 0, mistakes: 0 };
}

export function CometScreen() {
  const { session, snapshot, feedback } = useApp();
  const pattern = useMemo(() => session.cometPattern(), [session]);
  const [trace, setTrace] = useState<ChartSession>(() => freshTrace(pattern));
  const [result, setResult] = useState<CometResult | null>(null);
  const status = session.cometStatus();
  const streak = snapshot.profile.cometStreak;

  const onTap = (index: number): TapResult => {
    const outcome = tapChartStar(trace, index);
    if (outcome.session !== trace) setTrace(outcome.session);
    if (outcome.result === "complete") {
      const claim = session.claimComet();
      setResult(claim);
      if (claim.ok) {
        feedback.sfx("comet");
        feedback.haptic("success");
      }
    }
    return outcome.result;
  };

  return (
    <Screen name="comet" class="co-screen co-comet">
      <ScreenHeader title={t("comet.title")} />
      <p class="co-comet__streak" data-streak={streak}>
        <Icon name="comet" />
        {t("comet.streak", { count: streak })}
      </p>
      {result?.ok ? (
        <Card tone="raised" class="co-comet__result">
          <h2 class="co-card__title" data-comet-result="claimed">
            {t("comet.claimedTitle")}
          </h2>
          <p>{t("comet.reward", { amount: formatNumber(result.reward) })}</p>
          <p>{t("comet.streakNow", { count: result.streak })}</p>
          {result.shards > 0 ? <p>{t("comet.shard", { count: result.shards })}</p> : null}
        </Card>
      ) : status === "ready" ? (
        <>
          <p class="co-comet__help">{t("comet.help")}</p>
          <ChartBoard
            stars={pattern}
            next={trace.next}
            closed={false}
            label={t("comet.boardLabel")}
            onTap={onTap}
          />
        </>
      ) : (
        <Card tone="raised" class="co-comet__result">
          <h2 class="co-card__title" data-comet-result={status}>
            {t(`comet.status.${status}` as const)}
          </h2>
          <p>{t(`comet.status.${status}.body` as const)}</p>
        </Card>
      )}
    </Screen>
  );
}
