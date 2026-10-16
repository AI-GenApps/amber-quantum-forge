/** Whether to show the on-screen buttons: touch-first devices, or `?touch` for testing. */
export function wantsTouchControls(win: Window): boolean {
  if (new URLSearchParams(win.location.search).has("touch")) return true;
  return win.matchMedia?.("(pointer: coarse)").matches ?? false;
}
