import { useCurrentScreen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { useGameFeedback, useUiSounds } from "./feedback/useGameFeedback";
import { TutorialProvider } from "./onboarding/TutorialProvider";
import { Achievements } from "./screens/Achievements";
import { Almanac } from "./screens/Almanac";
import { BoardScreen } from "./screens/Board";
import { Boot } from "./screens/Boot";
import { Credits } from "./screens/Credits";
import { Daily } from "./screens/Daily";
import { Files } from "./screens/Files";
import { Home } from "./screens/Home";
import { HowTo } from "./screens/HowTo";
import { Intro } from "./screens/Intro";
import { Ledger } from "./screens/Ledger";
import { TownMap } from "./screens/Map";
import { Records } from "./screens/Records";
import { Reveal } from "./screens/Reveal";
import { Settings } from "./screens/Settings";
import { Table } from "./screens/Table";
import { Themes } from "./screens/Themes";
import { Viewer } from "./screens/Viewer";
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
    case "files":
      return <Files />;
    case "intro":
      return <Intro target={entry.params} />;
    case "table":
      return <Table target={entry.params} />;
    case "viewer":
      return <Viewer target={entry.params} />;
    case "board":
      return <BoardScreen target={entry.params} />;
    case "reveal":
      return <Reveal target={entry.params} />;
    case "map":
      return <TownMap />;
    case "almanac":
      return <Almanac target={entry.params} />;
    case "ledger":
      return <Ledger />;
    case "daily":
      return <Daily />;
    case "achievements":
      return <Achievements />;
    case "records":
      return <Records />;
    case "themes":
      return <Themes />;
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

  useEffect(
    () =>
      installTheme({
        themeId: profile.themeSelected,
        highContrast: settings.highContrast,
        reducedMotion,
      }),
    [profile.themeSelected, settings.highContrast, reducedMotion],
  );

  useEffect(() => {
    feedback.setScene(entry.name === "board" ? "case" : "desk");
  }, [feedback, entry.name]);

  useGameFeedback();
  useUiSounds();

  useEffect(
    () => app.lifecycle?.onBack(() => app.router.handleBack(), { onExit: () => setQuit(true) }),
    [app],
  );

  const key = `${entry.name}:${JSON.stringify(entry.params ?? null)}`;
  return (
    <TutorialProvider>
      <div class="lp-app" key={key} data-route={entry.name}>
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
    </TutorialProvider>
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
