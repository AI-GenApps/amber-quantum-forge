import { ProgressBar, Screen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { Backdrop } from "../components/Backdrop";
import { t } from "../strings";

export function BootScreen() {
  const env = useApp();
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    let live = true;
    const run = async (): Promise<void> => {
      try {
        await env.boot((value) => live && setFraction(value));
      } catch {
        // A failed preload never blocks the game; missing art falls back to code-drawn scenes.
      }
      if (!live) return;
      setFraction(1);
      const done = env.services.progression.current().onboardingDone;
      env.router.reset(done ? "home" : "onboarding");
    };
    void run();
    return () => {
      live = false;
    };
  }, [env]);

  return (
    <Screen name="boot" class="ll-screen ll-boot">
      <Backdrop chapter="key-art" />
      <div class="ll-boot-center">
        <h1 class="ll-brand">{t("app.title")}</h1>
        <p class="ll-tagline">{t("boot.loading")}</p>
        <ProgressBar value={fraction} max={1} label={t("boot.progress")} />
      </div>
    </Screen>
  );
}
