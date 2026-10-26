import { join } from "node:path";

export const APP_DIR = join(import.meta.dirname, "../..");
export const ANDROID_DIR = join(APP_DIR, "android");
export const IOS_DIR = join(APP_DIR, "ios");
export const RESOURCES_DIR = join(APP_DIR, "resources");
export const ANDROID_RES = join(ANDROID_DIR, "app/src/main/res");
export const IOS_APP_DIR = join(IOS_DIR, "App/App");

export const APP_ID = "app.w3dev.cloudobservatory";

export const EXPECTED_PLUGINS = [
  "app",
  "haptics",
  "preferences",
  "screen-orientation",
  "share",
  "status-bar",
] as const;
