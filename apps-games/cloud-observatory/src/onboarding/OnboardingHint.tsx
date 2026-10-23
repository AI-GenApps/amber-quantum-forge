import { useApp } from "../app/context";
import { Icon } from "../components/Icon";
import { t } from "../strings";
import { STEP_SCREEN } from "./steps";

/** A coach mark in the page flow: it never covers a control and never captures taps. */
export function OnboardingHint({ screen }: { screen: "shell" | "chart" }) {
  const { onboarding, feedback } = useApp();
  const { step } = onboarding;
  if (step === null || STEP_SCREEN[step] !== screen) return null;
  return (
    <aside class="co-coach" data-coach={step} aria-label={t("coach.label")}>
      <Icon name="star" />
      <p class="co-coach__text" role="status">
        {t(`coach.${step}` as const)}
      </p>
      <button
        type="button"
        class="co-coach__skip"
        onClick={() => {
          feedback.sfx("click");
          onboarding.skip();
        }}
      >
        {t("coach.skip")}
      </button>
    </aside>
  );
}
