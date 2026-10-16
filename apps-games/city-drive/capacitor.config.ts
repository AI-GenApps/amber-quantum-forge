import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The public name is duplicated from `src/ui/brand.ts` on purpose: this file is read by the
 * Capacitor CLI in Node and must not import app code (which pulls in the DOM and Babylon). A test
 * in `test/native/config.test.ts` keeps the two in sync. `appId` keeps the internal id.
 */
const config: CapacitorConfig = {
  appId: "app.w3dev.citydrive",
  appName: "Street Royale",
  webDir: "dist",
  // No `server.url` and no live reload: the committed config always loads the bundled build.
  android: {
    // WebGL2, WebAssembly and the ES2022 build target need a modern WebView (Chrome 94+ for class
    // static blocks). 105 keeps a margin; older WebViews get Capacitor's update prompt.
    minWebViewVersion: 105,
    // Release builds must not be debuggable over `chrome://inspect`.
    webContentsDebuggingEnabled: false,
  },
  ios: {
    // The app draws edge to edge; the game applies its own safe-area insets.
    contentInset: "never",
  },
};

export default config;
