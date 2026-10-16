import type { SaveNotice } from "@city-drive/core";

const NOTICE_TOAST_MS = 6000;

/**
 * Show a save notice as a small status line over the game. It never takes focus or blocks input,
 * and removes itself. The `.cd-save-notice` rule in `ui/tokens.css` styles it. Returns the element.
 */
export function showSaveNotice(
  host: HTMLElement,
  notice: SaveNotice,
  durationMs = NOTICE_TOAST_MS,
): HTMLElement {
  const toast = host.ownerDocument.createElement("div");
  toast.className = "cd-save-notice";
  toast.setAttribute("role", "status");
  toast.dataset.kind = notice.kind;
  toast.textContent = notice.message;
  host.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
  return toast;
}
