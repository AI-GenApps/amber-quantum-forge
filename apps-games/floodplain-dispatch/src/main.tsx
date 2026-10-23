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
import { createAppRouter } from "./nav";
import { createServices, loadServices } from "./state/services";
import "./styles.css";
import { PALETTE } from "./theme/tokens";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: PALETTE.night });

const services = createServices(createDefaultAdapter(), { lifecycle });
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
      }}
    />,
    root,
  );
}
