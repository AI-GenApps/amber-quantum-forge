import {
  formatDuration,
  formatNumber,
  type ResumeSummary,
} from "@web-games/cloud-observatory-core";
import { useEffect } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { useCountUp } from "../motion/useCountUp";
import { t } from "../strings";

export interface WelcomeBackProps {
  summary: ResumeSummary | null;
  onClose: () => void;
}

export function WelcomeBack({ summary, onClose }: WelcomeBackProps) {
  const { feedback, uiFrames, reducedMotion } = useApp();
  const shown = summary !== null;
  useEffect(() => {
    if (shown) feedback.sfx("welcome");
  }, [shown, feedback]);
  const gained = useCountUp(summary?.gained ?? 0, reducedMotion, uiFrames);
  return (
    <ManagedSheet open={summary !== null} title={t("welcome.title")} onClose={onClose}>
      {summary ? (
        <div class="co-stack" data-sheet="welcome-back">
          <p>{t("welcome.away", { time: formatDuration(summary.awaySeconds) })}</p>
          <p class="co-big" data-gained={summary.gained}>
            <span class="co-sr-only">
              {t("welcome.gained", { amount: formatNumber(summary.gained) })}
            </span>
            <span aria-hidden="true">{t("welcome.gained", { amount: formatNumber(gained) })}</span>
          </p>
          <p>{t("welcome.efficiency", { percent: Math.round(summary.efficiency * 100) })}</p>
          {summary.capped ? <p>{t("welcome.capped")}</p> : null}
          <Btn fullWidth onClick={onClose}>
            {t("welcome.continue")}
          </Btn>
        </div>
      ) : null}
    </ManagedSheet>
  );
}
