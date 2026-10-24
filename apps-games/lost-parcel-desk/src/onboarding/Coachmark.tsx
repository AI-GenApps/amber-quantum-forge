import { Button } from "@web-games/kit";
import { TOTAL_TUTORIAL_STEPS } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";
import { promptFor } from "./tutorial";

export interface CoachmarkProps {
  step: number;
  onSkip: () => void;
}

export function Coachmark({ step, onSkip }: CoachmarkProps) {
  return (
    <section
      class="lp-coach"
      role="status"
      aria-live="polite"
      data-testid="coachmark"
      data-step={step}
    >
      <p class="lp-coach__step">{t("coachStep", { step, total: TOTAL_TUTORIAL_STEPS })}</p>
      <p class="lp-coach__text" data-testid="coach-text">
        {promptFor(step)}
      </p>
      <Button size="small" variant="ghost" onClick={onSkip}>
        {t("coachSkip")}
      </Button>
    </section>
  );
}
