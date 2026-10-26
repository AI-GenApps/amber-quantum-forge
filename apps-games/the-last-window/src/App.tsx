import { useCurrentScreen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { ArtContext } from "./art/context";
import { ART_MANIFEST } from "./art/manifest";
import { musicSceneFor, uiEventForClick } from "./feedback/clicks";
import { useFeedback, useMusicScene } from "./feedback/hooks";
import { Credits } from "./screens/Credits";
import { Day } from "./screens/Day";
import { Home } from "./screens/Home";
import { HowTo } from "./screens/HowTo";
import { Journal } from "./screens/Journal";
import { Late } from "./screens/Late";
import { Prep } from "./screens/Prep";
import { Recipes } from "./screens/Recipes";
import { Result } from "./screens/Result";
import { Scene } from "./screens/Scene";
import { Settings } from "./screens/Settings";
import { Shift } from "./screens/Shift";
import { Shop } from "./screens/Shop";
import { Title } from "./screens/Title";
import { Confirm } from "./sheets/Confirm";
import {
  AppContext,
  type AppContextValue,
  useApp,
  useProfile,
  useReducedMotion,
  useSettings,
} from "./state/app";
import { GameContext } from "./state/useGame";
import { t } from "./strings";
import { installTheme } from "./theme/install";

const entryIds = new WeakMap<object, number>();
let nextEntryId = 1;

function entryKey(entry: object): number {
  let id = entryIds.get(entry);
  if (id === undefined) {
    id = nextEntryId++;
    entryIds.set(entry, id);
  }
  return id;
}

function CurrentScreen() {
  const { router } = useApp();
  const entry = useCurrentScreen(router);
  switch (entry.name) {
    case "title":
      return <Title />;
    case "home":
      return <Home />;
    case "day":
      return <Day day={entry.params.day} />;
    case "prep":
      return <Prep target={entry.params} />;
    case "shift":
      return <Shift target={entry.params} />;
    case "result":
      return <Result params={entry.params} />;
    case "scene":
      return <Scene params={entry.params} />;
    case "shop":
      return <Shop />;
    case "journal":
      return <Journal />;
    case "recipes":
      return <Recipes />;
    case "late":
      return <Late />;
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
  const [quit, setQuit] = useState(false);
  const entry = useCurrentScreen(app.router);
  const feedback = useFeedback();
  useMusicScene(musicSceneFor(entry.name));

  useEffect(() => {
    const onClick = (event: Event): void => {
      const cue = uiEventForClick(event.target);
      if (cue) feedback.fire(cue);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [feedback]);

  useEffect(() => {
    installTheme({
      highContrast: settings.highContrast,
      reducedMotion,
      textSize: profile.settings.textSize,
    });
  }, [settings.highContrast, reducedMotion, profile.settings.textSize]);

  useEffect(
    () => app.lifecycle?.onBack(() => app.router.handleBack(), { onExit: () => setQuit(true) }),
    [app],
  );

  return (
    <>
      <div class="tlw-app" key={entryKey(entry)} data-route={entry.name}>
        <CurrentScreen />
      </div>
      <Confirm
        open={quit}
        title={t("exitTitle")}
        body={t("exitBody")}
        confirmLabel={t("exitYes")}
        cancelLabel={t("exitNo")}
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
        <ArtContext.Provider value={app.artManifest ?? ART_MANIFEST}>
          <Shell />
        </ArtContext.Provider>
      </GameContext.Provider>
    </AppContext.Provider>
  );
}
