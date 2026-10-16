import type { SaveNotice } from "@city-drive/core";

const NOTICE_TOAST_MS = 6000;

/**
 * Show a save notice as a small status line over the game. It never takes focus or blocks input,
 * and removes itself. Returns the element so a screen can restyle it.
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
  toast.style.cssText =
    "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);max-width:min(90vw,480px);" +
    "padding:8px 14px;border-radius:8px;background:rgba(20,20,30,.9);color:#fff;" +
    "font:14px system-ui,sans-serif;text-align:center;pointer-events:none;z-index:50;";
  host.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
  return toast;
}
