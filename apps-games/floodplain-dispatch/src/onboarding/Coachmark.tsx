import { TUTORIAL_STEPS } from "@web-games/floodplain-dispatch-core";
import { Button } from "@web-games/kit";
import { t } from "../strings";

export function coachHint(step: number): string {
  switch (step) {
    case 1:
      return t("coachHint1");
    case 2:
      return t("coachHint2");
    case 3:
      return t("coachHint3");
    case 4:
      return t("coachHint4");
    default:
      return t("coachHint5");
  }
}

export interface CoachmarkProps {
  step: number;
  /** Shown on the informational steps that have no board action. */
  onAck?: (() => void) | undefined;
  onSkip: () => void;
}

export function Coachmark({ step, onAck, onSkip }: CoachmarkProps) {
  const entry = TUTORIAL_STEPS[step - 1];
  if (!entry) return null;
  return (
    <section
      class="fd-coach"
      role="status"
      aria-live="polite"
      data-testid="coachmark"
      data-step={step}
    >
      <p class="fd-coach__step">{t("coachStep", { step, total: TUTORIAL_STEPS.length })}</p>
      <p class="fd-coach__text">{entry.text}</p>
      <p class="fd-coach__hint">{coachHint(step)}</p>
      <div class="fd-coach__actions">
        {onAck ? (
          <Button size="small" onClick={onAck}>
            {t("cardGotIt")}
          </Button>
        ) : null}
        <Button size="small" variant="ghost" onClick={onSkip}>
          {t("coachSkip")}
        </Button>
      </div>
    </section>
  );
}
