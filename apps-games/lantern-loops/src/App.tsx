import { Button, Sheet, systemPrefersReducedMotion, useCurrentScreen } from "@web-games/kit";
import { useEffect, useRef, useState } from "preact/hooks";
import { AppContext, type AppEnv, useApp, useSheetBack } from "./app/AppContext";
import { AboutScreen } from "./screens/About";
import { ArchiveScreen } from "./screens/Archive";
import { BootScreen } from "./screens/Boot";
import { ChaptersScreen } from "./screens/Chapters";
import { DailyScreen } from "./screens/Daily";
import { HomeScreen } from "./screens/Home";
import { HowToScreen } from "./screens/HowTo";
import { OnboardingScreen } from "./screens/Onboarding";
import { PuzzleScreen } from "./screens/Puzzle";
import { PuzzleListScreen } from "./screens/PuzzleList";
import { SettingsScreen } from "./screens/Settings";
import { StatsScreen } from "./screens/Stats";
import { useSettings } from "./state/hooks";
import { t } from "./strings";
import { injectGameStyles } from "./theme/styles";
import { applyGameTheme } from "./theme/tokens";

function Outlet() {
  const { router } = useApp();
  const screen = useCurrentScreen(router);
  switch (screen.name) {
    case "boot":
      return <BootScreen />;
    case "onboarding":
      return <OnboardingScreen />;
    case "home":
      return <HomeScreen />;
    case "chapters":
      return <ChaptersScreen />;
    case "puzzleList":
      return <PuzzleListScreen chapter={screen.params.chapter} />;
    case "puzzle":
      return <PuzzleScreen key={screen.params.id} id={screen.params.id} />;
    case "daily":
      return <DailyScreen />;
    case "archive":
      return <ArchiveScreen />;
    case "stats":
      return <StatsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "howto":
      return <HowToScreen page={screen.params.page} />;
    default:
      return <AboutScreen />;
  }
}

function ExitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { exitApp } = useApp();
  useSheetBack(open, onClose);
  return (
    <Sheet open={open} onClose={onClose} title={t("home.exitTitle")} variant="modal">
      <p class="ll-body">{t("home.exitBody")}</p>
      <div class="ll-actions">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="danger" onClick={exitApp}>
          {t("home.exitConfirm")}
        </Button>
      </div>
    </Sheet>
  );
}

function Shell() {
  const env = useApp();
  const { router, lifecycle, motion, services } = env;
  const screen = useCurrentScreen(router);
  const settings = useSettings(services.settings);
  const [exitOpen, setExitOpen] = useState(false);
  const outlet = useRef<HTMLDivElement>(null);
  const reduced = services.settings.effectiveReducedMotion(systemPrefersReducedMotion());

  useEffect(() => {
    injectGameStyles();
  }, []);

  useEffect(() => applyGameTheme(settings.highContrast), [settings.highContrast]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? "true" : "false";
  }, [reduced]);

  useEffect(
    () =>
      lifecycle.onBack(() => router.handleBack(), {
        onExit: () => setExitOpen(true),
      }),
    [lifecycle, router],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: every route change replays the transition
  useEffect(() => {
    const el = outlet.current;
    if (!el) return;
    void motion.tween(
      el,
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 200 },
    );
  }, [screen, motion]);

  return (
    <div class="ll-app">
      <div class="ll-outlet" ref={outlet} data-route={screen.name}>
        <Outlet />
      </div>
      <ExitSheet open={exitOpen} onClose={() => setExitOpen(false)} />
    </div>
  );
}

export function App({ env }: { env: AppEnv }) {
  return (
    <AppContext.Provider value={env}>
      <Shell />
    </AppContext.Provider>
  );
}
