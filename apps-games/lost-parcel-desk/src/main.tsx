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
import { bindGameLifecycle, createServices, loadServices } from "./state/services";
import { createIntervalTick } from "./state/ticker";
import "./styles.css";
import "./screens.css";
import "./motion.css";
import "./onboarding/onboarding.css";
import { PALETTE } from "./theme/tokens";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: PALETTE.night });

const services = createServices(createDefaultAdapter(), { tick: createIntervalTick() });
bindGameLifecycle(services.game, lifecycle);
const feedback = createFeedback({ settings: services.settings });
feedback.audio.start();
bindAudioLifecycle(feedback.audio, lifecycle);
void loadServices(services);

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
        exitApp: () => void CapacitorApp.exitApp(),
        preload: createPreload(),
        outcome: { last: null },
        feedback,
      }}
    />,
    root,
  );
}
