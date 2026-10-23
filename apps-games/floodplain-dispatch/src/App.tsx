import { useCurrentScreen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { uiCueFor } from "./audio/ui";
import { BoardScreen } from "./screens/Board";
import { Boot } from "./screens/Boot";
import { Credits } from "./screens/Credits";
import { Daily } from "./screens/Daily";
import { Home } from "./screens/Home";
import { HowTo } from "./screens/HowTo";
import { Levels } from "./screens/Levels";
import { Records } from "./screens/Records";
import { Regions } from "./screens/Regions";
import { Settings } from "./screens/Settings";
import { Themes } from "./screens/Themes";
import { Confirm } from "./sheets/Confirm";
import {
  AppContext,
  type AppContextValue,
  useApp,
  useFeedback,
  useProfile,
  useReducedMotion,
  useSettings,
} from "./state/app";
import { GameContext } from "./state/useGame";
import { t } from "./strings";
import { installTheme } from "./theme/install";

function CurrentScreen() {
  const { router } = useApp();
  const entry = useCurrentScreen(router);
  switch (entry.name) {
    case "boot":
      return <Boot />;
    case "home":
      return <Home />;
    case "regions":
      return <Regions />;
    case "levels":
      return <Levels region={entry.params.region} />;
    case "board":
      return <BoardScreen target={entry.params} />;
    case "daily":
      return <Daily />;
    case "themes":
      return <Themes />;
    case "records":
      return <Records />;
    case "settings":
      return <Settings />;
    case "howto":
      return <HowTo />;
    case "credits":
      return <Credits />;
  }
}

function Shell() {
  const app = useApp();
  const profile = useProfile();
  const settings = useSettings();
  const reducedMotion = useReducedMotion();
  const feedback = useFeedback();
  const [quit, setQuit] = useState(false);
  const entry = useCurrentScreen(app.router);

  useEffect(() => {
    installTheme({
      themeId: profile.themeSelected,
      highContrast: settings.highContrast,
      reducedMotion,
    });
  }, [profile.themeSelected, settings.highContrast, reducedMotion]);

  useEffect(() => {
    feedback.setScene(entry.name === "board" ? "play" : "menu");
  }, [feedback, entry.name]);

  const onClickCapture = (event: MouseEvent): void => {
    const cue = uiCueFor(event.target);
    if (cue) feedback.fire({ type: "ui", ui: cue });
  };

  useEffect(
    () => app.lifecycle?.onBack(() => app.router.handleBack(), { onExit: () => setQuit(true) }),
    [app],
  );

  const key = `${entry.name}:${JSON.stringify(entry.params ?? null)}`;
  return (
    <>
      <div class="fd-app" key={key} onClickCapture={onClickCapture}>
        <CurrentScreen />
      </div>
      <Confirm
        open={quit}
        title={t("confirmQuitTitle")}
        body={t("confirmQuitBody")}
        confirmLabel={t("confirmQuitYes")}
        cancelLabel={t("cancel")}
        onCancel={() => setQuit(false)}
        onConfirm={() => {
          setQuit(false);
          app.exitApp?.();
        }}
      />
    </>
  );
}

export function App({ app }: { app: AppContextValue }) {
  return (
    <AppContext.Provider value={app}>
      <GameContext.Provider value={app.game}>
        <Shell />
      </GameContext.Provider>
    </AppContext.Provider>
  );
}
