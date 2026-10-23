import { App as CapacitorApp } from "@capacitor/app";
import {
  createDefaultAdapter,
  createLifecycle,
  injectKitStyles,
  registerFonts,
  shareContent,
} from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { createPreload } from "./boot/preload";
import { defaultExportEnv } from "./export/share";
import { FONT_FACES } from "./fonts";
import { createAppRouter } from "./nav";
import { bootGame } from "./state/boot";
import "./styles.css";
import { installTheme } from "./theme/install";
import { PALETTE } from "./theme/tokens";

injectKitStyles();
installTheme({ highContrast: false, reducedMotion: false });
void registerFonts(FONT_FACES);
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: PALETTE.night });

const { game } = bootGame(lifecycle, createDefaultAdapter());
void game.load();

const images: Record<string, unknown> = {};

const root = document.getElementById("app");
if (root) {
  render(
    <App
      app={{
        router: createAppRouter(),
        game,
        settings: game.settings,
        clock: () => new Date(),
        share: shareContent,
        lifecycle,
        exitApp: () => void CapacitorApp.exitApp(),
        images,
        exportEnv: defaultExportEnv(),
        preload: createPreload({ images }),
      }}
    />,
    root,
  );
}
