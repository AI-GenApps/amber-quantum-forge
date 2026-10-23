import { Button, Card, Screen } from "@web-games/kit";
import { useApp } from "../app/AppContext";
import { Backdrop } from "../components/Backdrop";
import type { Progression } from "../services/progression";
import { t } from "../strings";
import {
  completes,
  type OnboardingState,
  type OnboardingStep,
  reduce,
  routeFor,
  stepTextKey,
} from "./machine";

/** Saves `onboardingDone`; called when the walk-through ends by solving or by Skip. */
export function finishOnboarding(progression: Progression): Promise<void> {
  return progression.patch({ onboardingDone: true }).then(() => undefined);
}

const WELCOME_STATE: OnboardingState = { step: "welcome" };

/** First-launch welcome. Start opens the two guided boards; Skip goes straight to Home. */
export function OnboardingScreen() {
  const { router, services } = useApp();
  const start = (): void => {
    const next = reduce(WELCOME_STATE, "start");
    const route = routeFor(next);
    if (route.name === "puzzle") router.push("puzzle", { id: route.id });
  };
  const skip = (): void => {
    const next = reduce(WELCOME_STATE, "skip");
    if (completes(WELCOME_STATE, next)) void finishOnboarding(services.progression);
    router.reset("home");
  };
  return (
    <Screen name="onboarding" class="ll-screen ll-onboarding">
      <Backdrop chapter="key-art" />
      <div class="ll-onboarding-card">
        <Card tone="raised">
          <h1 class="ll-title">{t("onboarding.title")}</h1>
          <p class="ll-body">{t(stepTextKey("welcome"))}</p>
          <div class="ll-stack">
            <Button fullWidth onClick={start}>
              {t("onboarding.start")}
            </Button>
            <Button fullWidth variant="ghost" onClick={skip}>
              {t("onboarding.skip")}
            </Button>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

export interface TutorialBannerProps {
  step: OnboardingStep;
  onSkip: () => void;
}

/** One sentence for the current board and a Skip that stays on screen the whole time. */
export function TutorialBanner({ step, onSkip }: TutorialBannerProps) {
  return (
    <div class="ll-coach-line" data-testid="tutorial-step" data-step={step}>
      <p class="ll-body">{t(stepTextKey(step))}</p>
      <Button variant="ghost" size="small" onClick={onSkip}>
        {t("onboarding.skip")}
      </Button>
    </div>
  );
}
