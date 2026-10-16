import { useLayoutEffect, useState } from "preact/hooks";
import type { TouchInput } from "../input";
import type { AppController, AppView } from "./controller";
import { RotateOverlay } from "./controls/RotateOverlay";
import { TouchControls } from "./controls/TouchControls";
import type { MinimapModel } from "./model/minimap";
import { Briefing } from "./screens/Briefing";
import { Garage } from "./screens/Garage";
import { Home } from "./screens/Home";
import { Hud } from "./screens/Hud";
import { MapScreen } from "./screens/MapScreen";
import { Pause } from "./screens/Pause";
import { Results } from "./screens/Results";
import { Settings } from "./screens/Settings";
import type { UiContent } from "./types";

export interface AppProps {
  controller: AppController;
  content: UiContent;
  touch: TouchInput;
  minimap: () => MinimapModel | undefined;
}

/** Re-renders when the controller publishes a new view. */
function useView(controller: AppController): AppView {
  const [view, setView] = useState(controller.view);
  // Layout effect: subscribe before the browser paints, so no update between render and subscribe is lost.
  useLayoutEffect(() => {
    setView(controller.view);
    return controller.subscribe(() => setView(controller.view));
  }, [controller]);
  return view;
}

function PlayLayer({ view, controller, content, touch, minimap }: AppProps & { view: AppView }) {
  const play = view.play;
  if (!play) return null;
  const phase = play.hud.phase;
  const driving = view.screen === "play" || view.screen === "pause";
  const ended = phase === "success" || phase === "fail" || phase === "results";
  return (
    <>
      <Hud play={play} controller={controller} minimap={minimap()} />
      {view.screen === "play" && phase === "briefing" && play.mission ? (
        <Briefing mission={play.mission} controller={controller} />
      ) : null}
      {view.screen === "play" && ended && play.result ? (
        <Results
          view={view}
          result={play.result}
          summary={Object.values(content.missions)
            .flat()
            .find((m) => m.id === play.result?.id)}
          controller={controller}
        />
      ) : null}
      {content.showTouch && driving && phase !== "briefing" && !ended ? (
        <TouchControls input={touch} layout={view.save.settings.control_layout} />
      ) : null}
    </>
  );
}

function Screens(props: AppProps & { view: AppView }) {
  const { view, controller, content } = props;
  switch (view.screen) {
    case "home":
      return <Home view={view} controller={controller} content={content} />;
    case "map":
      return <MapScreen view={view} controller={controller} content={content} />;
    case "garage":
      return <Garage view={view} controller={controller} content={content} />;
    case "settings":
      return <Settings view={view} controller={controller} />;
    case "pause":
      return (
        <>
          <PlayLayer {...props} />
          <Pause view={view} controller={controller} />
        </>
      );
    case "play":
      return <PlayLayer {...props} />;
  }
}

/** The whole UI: the current screen, a loading veil, an error banner and the portrait guard. */
export function App(props: AppProps) {
  const view = useView(props.controller);
  return (
    <div class="cd-app" data-screen={view.screen}>
      <Screens {...props} view={view} />
      {view.loading ? (
        <div class="cd-loading" role="status">
          <div class="cd-spinner" aria-hidden="true" />
          <p>{view.loading}</p>
        </div>
      ) : null}
      {view.error ? (
        <div class="cd-error" role="alert">
          <p>{view.error}</p>
          <button type="button" class="cd-button" onClick={() => props.controller.dismissError()}>
            Dismiss
          </button>
        </div>
      ) : null}
      <RotateOverlay />
    </div>
  );
}
