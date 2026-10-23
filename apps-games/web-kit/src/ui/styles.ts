export const KIT_STYLE_ID = "wg-kit-styles";

/** Stylesheet for the primitives. Colours, fonts, radii and timings come only from `--wg-*` properties. */
export const kitCss = `
.wg-screen { box-sizing: border-box; min-height: 100%; display: flex; flex-direction: column; gap: var(--wg-space); background: var(--wg-color-background); color: var(--wg-color-text); font-family: var(--wg-font-body); padding: calc(var(--wg-space) * 2); padding-top: calc(env(safe-area-inset-top, 0px) + var(--wg-space) * 2); padding-right: calc(env(safe-area-inset-right, 0px) + var(--wg-space) * 2); padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--wg-space) * 2); padding-left: calc(env(safe-area-inset-left, 0px) + var(--wg-space) * 2); }
.wg-btn { box-sizing: border-box; min-height: 48px; min-width: 48px; padding: 0 calc(var(--wg-space) * 2.5); border: 2px solid transparent; border-radius: var(--wg-radius-md); font: inherit; font-family: var(--wg-font-display); cursor: pointer; transition: transform var(--wg-duration-fast), opacity var(--wg-duration-fast); touch-action: manipulation; }
.wg-btn:active:not(:disabled) { transform: scale(0.97); }
.wg-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.wg-btn:focus-visible, .wg-toggle:focus-visible, .wg-tab:focus-visible, .wg-sheet:focus-visible { outline: 3px solid var(--wg-color-focus); outline-offset: 2px; }
.wg-btn--primary { background: var(--wg-color-accent); color: var(--wg-color-accent-text); }
.wg-btn--secondary { background: var(--wg-color-surface-raised); color: var(--wg-color-text); border-color: var(--wg-color-border); }
.wg-btn--danger { background: var(--wg-color-danger); color: var(--wg-color-accent-text); }
.wg-btn--ghost { background: transparent; color: var(--wg-color-text); }
.wg-btn--large { min-height: 56px; }
.wg-btn--small { min-height: 48px; padding: 0 calc(var(--wg-space) * 1.5); }
.wg-btn--full { width: 100%; }
.wg-btn--icon { padding: 0; width: 48px; display: inline-flex; align-items: center; justify-content: center; }
.wg-overlay { position: fixed; inset: 0; z-index: 100; display: flex; background: var(--wg-color-overlay); }
.wg-overlay--sheet { align-items: flex-end; }
.wg-overlay--modal { align-items: center; justify-content: center; padding: calc(var(--wg-space) * 2); }
.wg-sheet { box-sizing: border-box; width: 100%; max-height: 90%; overflow: auto; background: var(--wg-color-surface); color: var(--wg-color-text); font-family: var(--wg-font-body); padding: calc(var(--wg-space) * 2); padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--wg-space) * 2); box-shadow: var(--wg-shadow-raised); }
.wg-overlay--sheet .wg-sheet { border-radius: var(--wg-radius-lg) var(--wg-radius-lg) 0 0; }
.wg-overlay--modal .wg-sheet { max-width: 420px; border-radius: var(--wg-radius-lg); }
.wg-sheet__title { margin: 0 0 var(--wg-space); font-family: var(--wg-font-display); }
.wg-toggle { box-sizing: border-box; min-height: 48px; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: var(--wg-space); padding: 0 calc(var(--wg-space) * 1.5); background: transparent; color: var(--wg-color-text); border: 0; font: inherit; cursor: pointer; }
.wg-toggle__track { width: 52px; height: 30px; border-radius: 15px; background: var(--wg-color-border); position: relative; transition: background var(--wg-duration-fast); flex: none; }
.wg-toggle__thumb { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: var(--wg-color-text); transition: transform var(--wg-duration-fast); }
.wg-toggle[aria-checked="true"] .wg-toggle__track { background: var(--wg-color-accent); }
.wg-toggle[aria-checked="true"] .wg-toggle__thumb { transform: translateX(22px); }
.wg-toggle:disabled { opacity: 0.45; cursor: not-allowed; }
.wg-tabs__list { display: flex; gap: calc(var(--wg-space) / 2); border-bottom: 2px solid var(--wg-color-border); }
.wg-tab { flex: 1; min-height: 48px; background: transparent; color: var(--wg-color-text-muted); border: 0; border-bottom: 3px solid transparent; font: inherit; font-family: var(--wg-font-display); cursor: pointer; }
.wg-tab[aria-selected="true"] { color: var(--wg-color-text); border-bottom-color: var(--wg-color-accent); }
.wg-tab:disabled { opacity: 0.45; cursor: not-allowed; }
.wg-toast { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + var(--wg-space) * 3); transform: translateX(-50%); max-width: 90%; padding: var(--wg-space) calc(var(--wg-space) * 2); border-radius: var(--wg-radius-md); background: var(--wg-color-surface-raised); color: var(--wg-color-text); border: 2px solid var(--wg-color-border); box-shadow: var(--wg-shadow-raised); font-family: var(--wg-font-body); z-index: 200; }
.wg-toast--success { border-color: var(--wg-color-success); }
.wg-toast--danger { border-color: var(--wg-color-danger); }
.wg-stars { display: inline-flex; gap: calc(var(--wg-space) / 2); }
.wg-star { width: 1.5em; height: 1.5em; }
.wg-star--on { fill: var(--wg-color-star-on); }
.wg-star--off { fill: var(--wg-color-star-off); }
.wg-progress { height: calc(var(--wg-space) * 1.5); border-radius: var(--wg-radius-sm); background: var(--wg-color-surface-raised); overflow: hidden; }
.wg-progress__fill { height: 100%; width: 100%; background: var(--wg-color-accent); transform-origin: left center; transition: transform var(--wg-duration-base); }
.wg-card { box-sizing: border-box; padding: calc(var(--wg-space) * 2); border-radius: var(--wg-radius-md); background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); color: var(--wg-color-text); font-family: var(--wg-font-body); }
.wg-card--raised { background: var(--wg-color-surface-raised); box-shadow: var(--wg-shadow-raised); }
.wg-card__title { margin: 0 0 var(--wg-space); font-family: var(--wg-font-display); }
@media (prefers-reduced-motion: reduce) { .wg-btn, .wg-toggle__track, .wg-toggle__thumb, .wg-progress__fill { transition: none; } }
`;

export interface StyleDocument {
  head: Pick<HTMLElement, "appendChild">;
  createElement(tag: "style"): HTMLStyleElement;
  getElementById?(id: string): HTMLElement | null;
}

/** Adds the kit stylesheet to `<head>` once. Returns true when it was added by this call. */
export function injectKitStyles(doc: StyleDocument = document): boolean {
  if (doc.getElementById?.(KIT_STYLE_ID)) return false;
  const style = doc.createElement("style");
  style.id = KIT_STYLE_ID;
  style.textContent = kitCss;
  doc.head.appendChild(style);
  return true;
}
