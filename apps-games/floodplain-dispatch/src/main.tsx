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
import { createServices, loadServices } from "./state/services";
import "./styles.css";
import "./onboarding/onboarding.css";
import { PALETTE } from "./theme/tokens";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: PALETTE.night });

const services = createServices(createDefaultAdapter(), { lifecycle });
void loadServices(services);

const images: Record<string, unknown> = {};

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
        exitApp: () => void CapacitorApp.exitApp(),
        images,
        preload: createPreload({ images }),
        feedback,
      }}
    />,
    root,
  );
}
