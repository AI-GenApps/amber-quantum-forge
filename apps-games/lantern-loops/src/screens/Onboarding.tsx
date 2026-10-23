import { Button, Card, Screen } from "@web-games/kit";
import { useApp } from "../app/AppContext";
import { Backdrop } from "../components/Backdrop";
import { t } from "../strings";

/** First-launch welcome. The guided boards are the two tutorial puzzles. */
export function OnboardingScreen() {
  const { router, services } = useApp();
  const skip = (): void => {
    void services.progression.patch({ onboardingDone: true });
    router.reset("home");
  };
  return (
    <Screen name="onboarding" class="ll-screen ll-onboarding">
      <Backdrop chapter="key-art" />
      <div class="ll-onboarding-card">
        <Card tone="raised" title={t("onboarding.title")}>
          <p class="ll-body">{t("onboarding.body")}</p>
          <div class="ll-stack">
            <Button fullWidth onClick={() => router.push("puzzle", { id: "tutorial-1" })}>
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
