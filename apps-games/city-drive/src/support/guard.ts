import { GAME_TITLE } from "../ui/brand";
import { showUnsupported } from "./unsupported";
import { detectWebGl2 } from "./webgl";

/** True when the game can start. Otherwise shows the fallback screen in `ui` and returns false. */
export function ensureWebGl2(doc: Document, ui: HTMLElement): boolean {
  const result = detectWebGl2(() => doc.createElement("canvas"));
  if (result.supported) return true;
  showUnsupported(ui, GAME_TITLE, result.reason);
  doc.getElementById("game")?.remove();
  return false;
}
