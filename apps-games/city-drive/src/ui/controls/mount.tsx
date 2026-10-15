import { render } from "preact";
import type { TouchInput } from "../../input";
import { RotateOverlay } from "./RotateOverlay";
import { TouchControls } from "./TouchControls";
import "./controls.css";

/** Whether to show the on-screen buttons: touch-first devices, or `?touch` for testing. */
export function wantsTouchControls(win: Window): boolean {
  if (new URLSearchParams(win.location.search).has("touch")) return true;
  return win.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/** Mounts the touch buttons (when wanted) and the portrait guard into `host`. */
export function mountControls(host: HTMLElement, touch: TouchInput, showTouch: boolean): void {
  render(
    <>
      {showTouch ? <TouchControls input={touch} /> : null}
      <RotateOverlay />
    </>,
    host,
  );
}
