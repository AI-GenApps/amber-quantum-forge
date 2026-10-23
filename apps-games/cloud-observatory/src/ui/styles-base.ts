/** Base layout, controls and typography. Sizes are rem only; nothing is smaller than 0.875rem. */
export const baseCss = `
html, body { margin: 0; height: 100%; background: var(--wg-color-background); color: var(--wg-color-text); font-family: "Manrope", sans-serif;  -webkit-text-size-adjust: 100%; }
body { overscroll-behavior: none; }
*, *::before, *::after { box-sizing: border-box; }
#app { height: 100%; }
.co-app { position: relative; height: 100%; overflow: hidden; background: var(--wg-color-background); color: var(--wg-color-text); font-family: var(--wg-font-body); font-size: 1rem; line-height: 1.45; }
.co-screen { height: 100%; min-height: 0; overflow-y: auto; overflow-x: hidden; }
.co-scroll { overflow-y: auto; min-height: 0; flex: 1; }
.co-sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
h1, h2, h3, .co-big, .co-gather__word, .co-title__name { font-family: var(--wg-font-display); font-weight: 700; margin: 0; line-height: 1.15; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
p { margin: 0; }
ul, ol, dl { margin: 0; padding: 0; list-style: none; }
button { font-family: var(--wg-font-body); font-size: 1rem; color: var(--wg-color-text); -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid var(--wg-color-focus); outline-offset: 2px; }
.co-btn, .co-chip, .co-tab, .wg-tab, .co-gather, .co-entry, [role="tab"], button { min-height: var(--co-hit); min-width: var(--co-hit); }
.co-btn { font-family: var(--wg-font-body); font-weight: 700; font-size: 1rem; touch-action: manipulation; }
.co-btn--icon, .wg-btn--icon { min-width: var(--co-hit); }
.co-chip { display: inline-flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; padding: 4px 10px; background: var(--wg-color-surface-raised); color: var(--wg-color-text); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-sm); font-size: 0.875rem; text-align: left; cursor: pointer; touch-action: manipulation; }
.co-chip[aria-pressed="true"] { background: var(--wg-color-accent); color: var(--wg-color-accent-text); border-color: var(--wg-color-accent); font-weight: 700; }
.co-chip[aria-disabled="true"] { cursor: default; border-style: dashed; }
.co-chip--available { border-color: var(--wg-color-accent); }
.co-chip--bought { border-color: var(--wg-color-success); }
.co-chip--locked { color: var(--wg-color-text-muted); }
.co-chip__name { font-weight: 700; line-height: 1.2; }
.co-chip__meta { display: inline-flex; align-items: center; gap: 4px; }
.co-modes { display: flex; gap: 8px; border: 0; padding: 0; margin: 0; min-width: 0; }
.co-mode { align-items: center; flex: 1; font-size: 1rem; }
.co-icon { width: 1.25rem; height: 1.25rem; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vertical-align: -0.25em; }
.co-stack { display: flex; flex-direction: column; gap: var(--wg-space); }
.co-row-actions { display: flex; gap: var(--wg-space); justify-content: space-between; }
.co-label { font-size: 0.875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--wg-color-text-muted); }
.co-big { font-size: 2rem; color: var(--wg-color-text); }
.co-num { font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1; }
.co-section { margin: var(--wg-space) 0 0; color: var(--wg-color-accent); }
.co-bullets li { padding-left: 1.25rem; position: relative; }
.co-bullets li::before { content: "\\2022"; position: absolute; left: 0.25rem; color: var(--wg-color-accent); }
.co-summary li { padding: 4px 0; }
.co-notice { display: flex; align-items: center; justify-content: space-between; gap: var(--wg-space); margin: 4px 8px; padding: 8px 12px; background: var(--wg-color-surface-raised); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); font-size: 0.875rem; }
.co-notice--danger { border-color: var(--wg-color-danger); color: var(--wg-color-danger); }
.co-bar { display: flex; align-items: center; gap: var(--wg-space); }
.co-bar__title { font-size: 1.75rem; }
.co-dev { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 2px); left: 50%; transform: translateX(-50%); z-index: 300; padding: 2px 8px; border-radius: var(--wg-radius-sm); background: var(--wg-color-accent); color: var(--wg-color-accent-text); font-size: 0.875rem; font-weight: 700; pointer-events: none; }
.co-toggle { background: var(--wg-color-surface); border-radius: var(--wg-radius-md); margin-bottom: 4px; font-family: var(--wg-font-body); font-size: 1rem; }
.co-settings { display: flex; flex-direction: column; gap: 4px; padding-bottom: 16px; }
.co-settings__note { color: var(--wg-color-text-muted); font-size: 0.875rem; padding: 4px 12px; }
.co-list { display: flex; flex-direction: column; gap: var(--wg-space); }
.co-panel { display: flex; flex-direction: column; gap: var(--wg-space); padding: var(--wg-space); }
.wg-sheet .wg-sheet__title { font-size: 1.5rem; }
.wg-toast { font-size: 1rem; bottom: calc(env(safe-area-inset-bottom, 0px) + 5rem); }
.wg-tabs { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.wg-tabs__panel { order: 1; flex: 1; min-height: 0; overflow-y: auto; }
.wg-tabs__list { order: 2; padding-bottom: env(safe-area-inset-bottom, 0px); border-bottom: 0; border-top: 2px solid var(--wg-color-border); background: var(--wg-color-surface); }
.co-tabs .wg-tab { min-height: 52px; padding: 0 2px; border-bottom: 0; border-top: 3px solid transparent; font-family: var(--wg-font-body); font-size: 0.875rem; font-weight: 600; }
.co-tabs .wg-tab[aria-selected="true"] { border-top-color: var(--wg-color-accent); color: var(--wg-color-text); }
.co-tabs .wg-tab { color: var(--wg-color-text-muted); }
.co-tabs .wg-tab[aria-selected="true"] { color: var(--wg-color-text); }
.co-reduced *, .co-reduced *::before, .co-reduced *::after { animation: none !important; transition: none !important; }
@media (prefers-reduced-motion: reduce) { .co-app *, .co-app *::before, .co-app *::after { animation: none !important; transition: none !important; } }
`;
