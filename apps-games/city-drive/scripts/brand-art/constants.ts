/** Shared by the brand-art builder and the icon tests, so the two cannot drift apart. */
export const BRAND_COLOR = "#1b2a55";
export const BRAND_COLOR_DARK = "#0b1020";
export const ACCENT_COLOR = "#ffc21a";
export const TEXT_COLOR = "#f5f7ff";

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
/**
 * Android adaptive icons: 108 dp canvas, 66 dp safe circle. @capacitor/assets insets the 1024 px
 * foreground by 16.7% on every side (so it covers 72 dp), which means a car 820 px wide ends up
 * about 58 dp wide on the real canvas, inside the safe circle.
 */
export const ADAPTIVE_SAFE_WIDTH = 820;

export const RESOURCE_FILES = {
  "icon.png": { width: ICON_SIZE, height: ICON_SIZE, alpha: false },
  "icon-foreground.png": { width: ICON_SIZE, height: ICON_SIZE, alpha: true },
  "icon-background.png": { width: ICON_SIZE, height: ICON_SIZE, alpha: false },
  "splash.png": { width: SPLASH_SIZE, height: SPLASH_SIZE, alpha: false },
  "splash-dark.png": { width: SPLASH_SIZE, height: SPLASH_SIZE, alpha: false },
} as const;

export const WEB_ICON_FILES = {
  "favicon.png": 48,
  "apple-touch-icon.png": 180,
  "icons/icon-192.png": 192,
  "icons/icon-512.png": 512,
  "icons/icon-512-maskable.png": 512,
} as const;
