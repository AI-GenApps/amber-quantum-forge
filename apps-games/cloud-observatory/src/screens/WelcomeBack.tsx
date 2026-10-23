import {
  formatDuration,
  formatNumber,
  type ResumeSummary,
} from "@web-games/cloud-observatory-core";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { t } from "../strings";

export interface WelcomeBackProps {
  summary: ResumeSummary | null;
  onClose: () => void;
}

export function WelcomeBack({ summary, onClose }: WelcomeBackProps) {
  return (
    <ManagedSheet open={summary !== null} title={t("welcome.title")} onClose={onClose}>
      {summary ? (
        <div class="co-stack" data-sheet="welcome-back">
          <p>{t("welcome.away", { time: formatDuration(summary.awaySeconds) })}</p>
          <p class="co-big" data-gained={summary.gained}>
            {t("welcome.gained", { amount: formatNumber(summary.gained) })}
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
