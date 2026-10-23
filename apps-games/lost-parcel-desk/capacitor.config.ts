import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Read by the Capacitor CLI in Node, so it must not import app code. `test/config.test.ts` keeps
 * the name in sync with `src/brand.ts`. Portrait is locked at runtime by the kit lifecycle
 * (`setupDisplay` in `src/main.tsx`); the native manifests declare it when the platforms are added.
 */
const config: CapacitorConfig = {
  appId: "app.w3dev.lostparceldesk",
  appName: "Lost Parcel Desk",
  webDir: "dist",
  // No `server.url`: the committed config always loads the bundled build.
  android: { webContentsDebuggingEnabled: false },
  ios: { contentInset: "never" },
};

export default config;
