import { useCurrentScreen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { Boot } from "./screens/Boot";
import { Challenges } from "./screens/Challenges";
import { Chapters } from "./screens/Chapters";
import { Clients } from "./screens/Clients";
import { Closet } from "./screens/Closet";
import { Credits } from "./screens/Credits";
import { Daily } from "./screens/Daily";
import { Gallery } from "./screens/Gallery";
import { Home } from "./screens/Home";
import { HowTo } from "./screens/HowTo";
import { Settings } from "./screens/Settings";
import { Styling } from "./screens/Styling";
import { Confirm } from "./sheets/Confirm";
import {
  AppContext,
  type AppContextValue,
  useApp,
  useReducedMotion,
  useSettings,
} from "./state/app";
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
    case "chapters":
      return <Chapters />;
    case "challenges":
      return <Challenges chapter={entry.params.chapter} />;
    case "styling":
      return <Styling target={entry.params} />;
    case "daily":
      return <Daily />;
    case "closet":
      return <Closet />;
    case "clients":
      return <Clients />;
    case "gallery":
      return <Gallery />;
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
  const settings = useSettings();
  const reducedMotion = useReducedMotion();
  const [quit, setQuit] = useState(false);
  const entry = useCurrentScreen(app.router);

  useEffect(() => {
    installTheme({ highContrast: settings.highContrast, reducedMotion });
  }, [settings.highContrast, reducedMotion]);

  useEffect(
    () => app.lifecycle?.onBack(() => app.router.handleBack(), { onExit: () => setQuit(true) }),
    [app],
  );

  const key = `${entry.name}:${JSON.stringify(entry.params ?? null)}`;
  return (
    <>
      <div class="dr-app" key={key}>
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
      <Shell />
    </AppContext.Provider>
  );
}
