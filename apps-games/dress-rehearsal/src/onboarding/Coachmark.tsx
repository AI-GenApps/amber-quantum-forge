import {
  type ClientDef,
  THREE_STAR_HARMONY,
  TUTORIAL_STEPS,
} from "@web-games/dress-rehearsal-core";
import { Button } from "@web-games/kit";
import { t } from "../strings";

const HINTS = ["coachHint1", "coachHint2", "coachHint3", "coachHint4", "coachHint5"] as const;

export function coachHint(step: number): string {
  const key = HINTS[Math.min(HINTS.length, Math.max(1, step)) - 1] ?? "coachHint1";
  return t(key, { bar: THREE_STAR_HARMONY });
}

export interface CoachmarkProps {
  step: number;
  client: ClientDef;
  onClientSeen: () => void;
  onSkip: () => void;
}

/** Inline step card above the board; step 1 introduces the client and is closed with a button. */
export function Coachmark({ step, client, onClientSeen, onSkip }: CoachmarkProps) {
  const entry = TUTORIAL_STEPS[step - 1];
  if (!entry) return null;
  return (
    <section
      class="dr-coach"
      role="status"
      aria-live="polite"
      data-testid="coachmark"
      data-step={step}
    >
      <p class="dr-eyebrow">{t("coachStep", { step, total: TUTORIAL_STEPS.length })}</p>
      <p class="dr-coach__title">{entry.title}</p>
      {step === 1 ? (
        <p class="dr-coach__client">{t("coachClient", { name: client.name, role: client.role })}</p>
      ) : null}
      <p class="dr-coach__hint">{coachHint(step)}</p>
      <div class="dr-coach__actions">
        {step === 1 ? (
          <Button size="small" onClick={onClientSeen}>
            {t("coachGotIt")}
          </Button>
        ) : null}
        <Button size="small" variant="ghost" onClick={onSkip}>
          {t("coachSkip")}
        </Button>
      </div>
    </section>
  );
}
