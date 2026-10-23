import { App as CapacitorApp } from "@capacitor/app";
import {
  createAudioManager,
  createHaptics,
  createLifecycle,
  createMotion,
  createRouter,
  injectKitStyles,
  shareContent,
  systemPrefersReducedMotion,
} from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import type { AppEnv } from "./app/AppContext";
import { createBoot } from "./app/boot";
import type { Routes } from "./app/routes";
import { MUSIC_BUS_VOLUME } from "./audio/sounds";
import { createFeedbackBus } from "./feedback/events";
import { createServices } from "./services";
import { injectGameStyles } from "./theme/styles";
import { applyGameTheme } from "./theme/tokens";

injectKitStyles();
injectGameStyles();
applyGameTheme(false);

const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true, statusBarColor: "#12132E" });

const services = createServices();
const env: AppEnv = {
  services,
  router: createRouter<Routes>("boot"),
  motion: createMotion(() =>
    services.settings.effectiveReducedMotion(systemPrefersReducedMotion()),
  ),
  lifecycle,
  audio: createAudioManager({ volumes: { music: MUSIC_BUS_VOLUME } }),
  haptics: createHaptics(),
  feedback: createFeedbackBus(),
  share: shareContent,
  boot: createBoot(services),
  exitApp: () => void CapacitorApp.exitApp(),
};

const root = document.getElementById("app");
if (root) render(<App env={env} />, root);
