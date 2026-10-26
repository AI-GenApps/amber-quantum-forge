import { App as CapacitorApp } from "@capacitor/app";
import {
  createDefaultAdapter,
  createLifecycle,
  injectKitStyles,
  shareContent,
} from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { createPreload } from "./boot/preload";
import { bindAudioLifecycle, createFeedback } from "./feedback/feedback";
import { createAppRouter } from "./nav";
import { browserScheduler } from "./shift/scheduler";
import { createServices, loadServices } from "./state/services";
import "./styles.css";
import "./screens.css";
import "./shift.css";
import "./onboarding.css";
import { installTheme } from "./theme/install";
import { PALETTE } from "./theme/tokens";

injectKitStyles();
installTheme({ highContrast: false, reducedMotion: false, textSize: "normal" });
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: PALETTE.night });

const services = createServices(createDefaultAdapter(), { lifecycle });
void loadServices(services);
const feedback = createFeedback({ settings: services.settings });
feedback.audio.start();
bindAudioLifecycle(feedback.audio, lifecycle);

const root = document.getElementById("app");
if (root) {
  render(
    <App
      app={{
        router: createAppRouter(),
        game: services.game,
        settings: services.settings,
        clock: () => new Date(),
        share: shareContent,
        lifecycle,
        feedback,
        exitApp: () => void CapacitorApp.exitApp(),
        scheduler: browserScheduler(),
        preload: createPreload(),
      }}
    />,
    root,
  );
}
