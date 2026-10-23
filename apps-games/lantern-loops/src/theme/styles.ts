export const GAME_STYLE_ID = "ll-game-styles";

/** Game stylesheet. Colours and fonts come from the `--wg-*` and `--ll-*` custom properties. */
export const gameCss = `
:root { --ll-hit: 44px; --ll-board-plate: #1E2050; --ll-board-line: #3A3E80; --ll-ribbon: #F6EAD3; --ll-unlit: #6E76A6; }
html, body { margin: 0; height: 100%; background: var(--wg-color-background); color: var(--wg-color-text); font-family: var(--wg-font-body); }
body { -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
.ll-app { position: relative; height: 100%; overflow: hidden; background: var(--wg-color-background); }
.ll-outlet { height: 100%; overflow-y: auto; overflow-x: hidden; }
.ll-screen { position: relative; font-size: 1rem; line-height: 1.4; }
.ll-screen > :not(.ll-backdrop):not(.wg-overlay):not(.wg-toast) { position: relative; z-index: 1; }
.ll-backdrop { position: absolute; inset: 0; z-index: 0; overflow: hidden; opacity: 0.6; pointer-events: none; }
.ll-backdrop-art, .ll-backdrop img, .ll-backdrop .ll-art-svg { display: block; width: 100%; height: 100%; object-fit: cover; }
.ll-art-svg { width: 100%; height: 100%; display: block; }
.ll-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.ll-title, .ll-brand, .ll-subtitle, .ll-daily-title, .ll-chapter-name, .ll-puzzle-num, .ll-medallion-name { font-family: var(--wg-font-display); }
.ll-title { margin: 0; font-size: 1.35rem; font-weight: 700; flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ll-subtitle { margin: 0 0 var(--wg-space); font-size: 1.1rem; font-weight: 600; }
.ll-brand { margin: 0; font-size: 2.6rem; line-height: 1.05; font-weight: 800; text-align: center; color: var(--wg-color-text); }
.ll-tagline { margin: 0; text-align: center; color: var(--wg-color-text-muted); }
.ll-body { margin: 0 0 var(--wg-space); }
.ll-muted { color: var(--wg-color-text-muted); }
.ll-header { display: flex; align-items: center; gap: var(--wg-space); min-height: var(--ll-hit); }
.ll-header-gap { width: 8px; }
.ll-header-right { display: flex; align-items: center; gap: var(--wg-space); }
.ll-chip, .ll-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--wg-color-surface-raised); border: 1px solid var(--wg-color-border); font-size: 0.85rem; }
.ll-badge[data-state="solved"] { border-color: var(--wg-color-success); }
.ll-chip-btn, .ll-puzzle-btn, .ll-archive-row, .ll-chapter, .ll-daily-card, .ll-brush { min-height: var(--ll-hit); min-width: var(--ll-hit); }
.ll-chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--wg-space); }
.ll-chip-btn { padding: 0 14px; border-radius: 999px; border: 2px solid var(--wg-color-border); background: var(--wg-color-surface-raised); color: var(--wg-color-text); font: inherit; cursor: pointer; }
.ll-chip-btn:focus-visible, .ll-puzzle-btn:focus-visible, .ll-archive-row:focus-visible, .ll-chapter:focus-visible, .ll-daily-card:focus-visible, .ll-brush:focus-visible { outline: 3px solid var(--wg-color-focus); outline-offset: 2px; }
.ll-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: calc(var(--wg-space) * 1.5); }
.ll-stack { display: flex; flex-direction: column; gap: var(--wg-space); }
.ll-actions { display: flex; gap: var(--wg-space); justify-content: flex-end; flex-wrap: wrap; margin-top: calc(var(--wg-space) * 2); }
.ll-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--wg-space); }
.ll-group { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--wg-space); }
.ll-empty { display: flex; flex-direction: column; align-items: center; gap: var(--wg-space); text-align: center; padding: calc(var(--wg-space) * 3) var(--wg-space); }
.ll-tokens, .ll-tokens-line { display: inline-flex; align-items: center; gap: 6px; }
.ll-home { justify-content: space-between; }
.ll-home-top { padding-top: calc(var(--wg-space) * 5); display: flex; flex-direction: column; gap: var(--wg-space); }
.ll-home-main { display: flex; flex-direction: column; gap: calc(var(--wg-space) * 1.5); }
.ll-home-foot { display: flex; align-items: center; justify-content: space-between; }
.ll-daily-card { display: block; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ll-daily-inner { display: flex; flex-direction: column; gap: 6px; }
.ll-daily-head { display: flex; justify-content: space-between; align-items: center; gap: var(--wg-space); }
.ll-daily-title { font-size: 1.15rem; font-weight: 700; }
.ll-daily-meta, .ll-chapter-meta { color: var(--wg-color-text-muted); font-size: 0.9rem; }
.ll-daily-streak, .ll-streak-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ll-chapter { display: block; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ll-chapter:disabled { cursor: not-allowed; opacity: 0.75; }
.ll-chapter-card { display: flex; flex-direction: column; gap: 8px; }
.ll-chapter-head { display: flex; justify-content: space-between; align-items: center; gap: var(--wg-space); }
.ll-chapter-name { font-size: 1.3rem; font-weight: 700; }
.ll-locked { display: inline-flex; align-items: center; gap: 6px; color: var(--wg-color-text-muted); }
.ll-chapter-blurb { color: var(--wg-color-text); }
.ll-chapter-bar, .ll-chapter-bar .wg-progress__fill { display: block; }
.ll-puzzle-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--wg-space); }
.ll-puzzle-btn { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 2px; border-radius: var(--wg-radius-md); border: 2px solid var(--wg-color-border); background: var(--wg-color-surface); color: var(--wg-color-text); font: inherit; cursor: pointer; }
.ll-puzzle-num { font-weight: 700; font-size: 1.05rem; }
.ll-puzzle-stars .wg-star { width: 0.85em; height: 0.85em; }
.ll-archive-row { width: 100%; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 14px; border-radius: var(--wg-radius-md); border: 2px solid var(--wg-color-border); background: var(--wg-color-surface); color: var(--wg-color-text); font: inherit; text-align: left; cursor: pointer; }
.ll-archive-date { font-family: var(--wg-font-display); font-weight: 600; }
.ll-medallion { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ll-medallion-name { font-size: 1.2rem; font-weight: 700; }
.ll-stat-list { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.ll-stat-row { display: flex; justify-content: space-between; gap: var(--wg-space); }
.ll-stat-row dt { color: var(--wg-color-text-muted); }
.ll-stat-row dd { margin: 0; font-family: var(--wg-font-display); font-weight: 700; }
.ll-chart { width: 100%; height: auto; display: block; }
.ll-bar-bg { fill: var(--wg-color-surface-raised); }
.ll-bar { fill: var(--wg-color-accent); }
.ll-chart-label, .ll-chart-value { font-family: var(--wg-font-body); font-size: 11px; fill: var(--wg-color-text); }
.ll-howto { min-height: 8rem; }
.ll-puzzle { gap: 6px; }
.ll-hud { display: flex; align-items: center; gap: var(--wg-space); }
.ll-hud-title { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.ll-hud-sub, .ll-timer { color: var(--wg-color-text-muted); font-size: 0.85rem; }
.ll-timer { font-family: var(--wg-font-display); font-variant-numeric: tabular-nums; }
.ll-hint-btn { width: auto; min-width: 64px; gap: 6px; padding: 0 12px; }
.ll-hint-count { font-family: var(--wg-font-display); font-weight: 700; }
.ll-coach-line { display: flex; align-items: center; gap: var(--wg-space); }
.ll-coach-line .ll-body { flex: 1; margin: 0; }
.ll-board-area { display: flex; justify-content: center; align-items: center; flex: 1; padding: 4px 0; }
.ll-board-wrap { position: relative; max-width: 100%; }
.ll-board { max-width: 100%; height: auto; display: block; touch-action: none; user-select: none; -webkit-user-select: none; border-radius: 10px; box-shadow: var(--wg-shadow-raised); outline: none; }
.ll-board .ll-focus { stroke: var(--wg-color-focus); }
.ll-stone-num { font-family: var(--wg-font-display); font-weight: 700; }
.ll-toolbar { display: flex; flex-direction: column; gap: var(--wg-space); padding-bottom: var(--wg-space); }
.ll-brushes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--wg-space); }
.ll-brush { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 8px; font-family: var(--wg-font-body); font-size: 0.95rem; }
.ll-brush[aria-checked="true"] { background: var(--wg-color-accent); color: var(--wg-color-accent-text); border-color: var(--wg-color-accent); }
.ll-tools { display: flex; justify-content: center; gap: calc(var(--wg-space) * 2); }
.ll-win { display: flex; flex-direction: column; gap: var(--wg-space); align-items: center; }
.ll-win-list { list-style: none; margin: 0; padding: 0; text-align: center; display: flex; flex-direction: column; gap: 4px; }
.ll-win .ll-stack { width: 100%; }
.ll-win .wg-stars { font-size: 1.6rem; }
.ll-celebrate { display: flex; flex-direction: column; align-items: center; gap: var(--wg-space); text-align: center; }
.ll-boot, .ll-onboarding { justify-content: center; }
.ll-boot-center, .ll-onboarding-card { display: flex; flex-direction: column; gap: calc(var(--wg-space) * 2); }
.wg-card .wg-btn, .wg-sheet .wg-btn { min-height: var(--ll-hit); }
[data-contrast="high"] .wg-btn, [data-contrast="high"] .ll-puzzle-btn, [data-contrast="high"] .ll-archive-row, [data-contrast="high"] .ll-chip-btn { border-width: 3px; }
[data-contrast="high"] .wg-card { border-width: 3px; }
[data-reduced-motion="true"] *, [data-reduced-motion="true"] *::before { transition: none !important; animation: none !important; }
`;

export interface StyleHost {
  head: Pick<HTMLElement, "appendChild">;
  createElement(tag: "style"): HTMLStyleElement;
  getElementById?(id: string): HTMLElement | null;
}

/** Adds the game stylesheet once. Returns true when this call added it. */
export function injectGameStyles(doc: StyleHost = document): boolean {
  if (doc.getElementById?.(GAME_STYLE_ID)) return false;
  const style = doc.createElement("style");
  style.id = GAME_STYLE_ID;
  style.textContent = gameCss;
  doc.head.appendChild(style);
  return true;
}
