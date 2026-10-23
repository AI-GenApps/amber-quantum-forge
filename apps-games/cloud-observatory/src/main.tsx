import { App as CapacitorApp } from "@capacitor/app";
import {
  createDefaultAdapter,
  createLifecycle,
  createSettingsStore,
  injectKitStyles,
} from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { parseDevSpeed } from "./app/devspeed";
import { createProfileStore } from "./save/profile-store";
import { createClock } from "./session/clock";
import { createGameSession, GAME_ID } from "./session/game-session";
import { registerAppFonts } from "./ui/fonts";
import { injectAppStyles } from "./ui/styles";
import { applyAppTheme, PALETTE } from "./ui/tokens";

async function boot(): Promise<void> {
  injectKitStyles();
  injectAppStyles();
  applyAppTheme(false);
  await registerAppFonts();

  const lifecycle = createLifecycle();
  void lifecycle.setupDisplay({
    lockPortrait: true,
    statusBarStyle: "light-text",
    statusBarColor: PALETTE.ink900,
  });

  const adapter = createDefaultAdapter();
  const clock = createClock();
  const session = createGameSession({
    store: createProfileStore(adapter, { now: clock.now }),
    settings: createSettingsStore(adapter, GAME_ID),
    clock,
    onPause: lifecycle.onPause,
  });

  const root = document.getElementById("app");
  if (!root) return;
  render(
    <App
      session={session}
      lifecycle={lifecycle}
      devSpeed={parseDevSpeed(window.location.search, import.meta.env.DEV)}
      onExit={() => void CapacitorApp.exitApp().catch(() => undefined)}
    />,
    root,
  );
}

void boot();
