import { baseCss } from "./styles-base";
import { polishCss } from "./styles-polish";
import { screensCss } from "./styles-screens";
import { skyCss } from "./styles-sky";

export const APP_STYLE_ID = "co-app-styles";

export const appCss = `${baseCss}${skyCss}${screensCss}${polishCss}`;

export interface StyleHost {
  head: Pick<HTMLElement, "appendChild">;
  createElement(tag: "style"): HTMLStyleElement;
  getElementById?(id: string): HTMLElement | null;
}

/** Adds the app stylesheet to `<head>` once, after the kit's. Returns true when it was added now. */
export function injectAppStyles(doc: StyleHost = document): boolean {
  if (doc.getElementById?.(APP_STYLE_ID)) return false;
  const style = doc.createElement("style");
  style.id = APP_STYLE_ID;
  style.textContent = appCss;
  doc.head.appendChild(style);
  return true;
}
