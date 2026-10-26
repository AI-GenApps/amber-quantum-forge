/** Per-screen layout. */
export const screensCss = `
.co-title { position: relative; padding: 0; overflow: hidden; }
.co-title__art { position: absolute; inset: 0; }
.co-title__art .co-art { width: 100%; height: 100%; object-fit: cover; }
.co-title__shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(11, 18, 38, 0.97) 48%, rgba(11, 18, 38, 0) 85%); }
.co-title__body { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; gap: var(--wg-space); padding: 16px; padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); max-height: 100%; overflow-y: auto; }
.co-title__name { font-size: 3rem; color: var(--co-gold-light); text-align: center; }
.co-title__tag { text-align: center; color: var(--wg-color-text); font-size: 1rem; }
.co-shell { overflow: hidden; padding: 0; gap: 0; }
.co-header { display: flex; align-items: center; justify-content: space-between; gap: var(--wg-space); padding: 8px 12px; padding-top: calc(env(safe-area-inset-top, 0px) + 8px); background: var(--wg-color-surface); border-bottom: 2px solid var(--wg-color-border); }
.co-header__stat { display: flex; flex-direction: column; }
.co-header .co-big { font-size: 2.25rem; }
.co-rate { color: var(--wg-color-text-muted); font-size: 0.875rem; }
.co-observe { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 28rem; overflow: hidden; }
.co-observe__sky { position: absolute; inset: 0; }
.co-observe__top { position: relative; z-index: 2; display: flex; justify-content: flex-end; min-height: 8px; padding: 8px 8px 0; }
.co-comet-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; }
.co-comet-btn__state { color: var(--wg-color-accent); font-weight: 700; }
.co-observe__center { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; z-index: 1; }
.co-gather { width: min(58vw, 15rem, 36vh); height: min(58vw, 15rem, 36vh); min-width: 7rem; min-height: 7rem; border-radius: 50%; border: 3px solid var(--co-gold-light); background: radial-gradient(circle at 35% 30%, #f6dda0, var(--wg-color-accent) 70%); color: var(--wg-color-accent-text); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; box-shadow: 0 0 36px rgba(235, 203, 133, 0.35); touch-action: manipulation; }
.co-gather:active { transform: scale(0.97); }
.co-gather__word { font-size: 2rem; color: var(--wg-color-accent-text); }
.co-gather__value { font-size: 1.125rem; font-weight: 700; color: var(--wg-color-accent-text); }
.co-observe__center .co-pop { top: 4%; }
.co-observe__foot { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; z-index: 2; }
.co-observe__building { width: min(8.5rem, 18vh); height: min(8.5rem, 18vh); }
@media (max-height: 640px) { .co-observe__building { display: none; } }
.co-goal { width: 100%; padding: 10px 14px; }
.co-goal__text { font-size: 1rem; text-align: center; }
.co-row { display: grid; grid-template-columns: 4.5rem 1fr auto; align-items: center; gap: 8px 12px; padding: 10px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); }
.co-row--locked { border-style: dashed; color: var(--wg-color-text-muted); }
.co-row__art { width: 4.5rem; height: 4.5rem; }
.co-row__name { font-size: 1.25rem; }
.co-row__meta { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; }
.co-chips .co-chip { flex: 1 1 28%; }
.co-buy { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 5.5rem; padding: 4px 10px; line-height: 1.2; }
.co-buy__cost { font-size: 0.875rem; font-weight: 700; }
.co-atlas-head { padding: 4px 4px 0; }
.co-atlas-head__count { color: var(--wg-color-text-muted); font-size: 0.875rem; }
.co-atlas-head__bonus { font-family: var(--wg-font-display); font-weight: 700; font-size: 1.5rem; color: var(--wg-color-accent); }
.co-card-atlas { display: grid; grid-template-columns: 4.5rem 1fr 3.5rem; gap: 8px 12px; align-items: center; padding: 10px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); }
.co-card-atlas--charted { border-color: var(--wg-color-success); }
.co-card-atlas--ready { border-color: var(--wg-color-accent); }
.co-card-atlas--locked { border-style: dashed; }
.co-emblem { width: 4.5rem; height: 4.5rem; }
.co-emblem__art { width: 100%; height: 100%; }
.co-card-atlas__name { font-size: 1.25rem; }
.co-card-atlas__meta, .co-card-atlas__need { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-card-atlas__fig { width: 3.5rem; height: 3.5rem; }
.co-card-atlas__action { grid-column: 1 / -1; }
.co-state { display: inline-flex; align-items: center; gap: 4px; font-size: 0.875rem; font-weight: 700; color: var(--wg-color-text-muted); }
.co-card-atlas--ready .co-state { color: var(--wg-color-accent); }
.co-card-atlas--charted .co-state { color: var(--wg-color-success); }
.co-chart { gap: 6px; }
.co-chart__info { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.co-chart__count, .co-chart__mistakes { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-comet { gap: 8px; }
.co-comet__streak { display: inline-flex; gap: 6px; align-items: center; color: var(--wg-color-accent); font-weight: 700; }
.co-comet__help { color: var(--wg-color-text-muted); }
.co-eclipse-head { display: flex; flex-direction: column; gap: 6px; padding: 12px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); }
.co-eclipse-head__bank { display: inline-flex; align-items: center; gap: 6px; color: var(--wg-color-text-muted); }
.co-boon { display: grid; grid-template-columns: 2.75rem 1fr auto; gap: 8px 12px; align-items: center; padding: 10px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); }
.co-boon--owned { border-color: var(--wg-color-success); }
.co-boon--affordable { border-color: var(--wg-color-accent); }
.co-boon__ring { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 50%; border: 2px solid var(--wg-color-accent); color: var(--wg-color-accent); }
.co-boon__effect { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-boon__cost { display: inline-flex; align-items: center; gap: 4px; font-size: 0.875rem; }
.co-boon__name { font-size: 1.25rem; }
.co-journal-count { color: var(--wg-color-text-muted); font-size: 0.875rem; padding: 0 4px; }
.co-chapter { display: flex; flex-direction: column; gap: 6px; }
.co-chapter__head { display: flex; gap: 12px; align-items: center; }
.co-chapter__art { width: 3.75rem; height: 5.625rem; flex: none; border-radius: var(--wg-radius-sm); overflow: hidden; border: 2px solid var(--wg-color-border); }
.co-chapter__art .co-art { width: 100%; height: 100%; object-fit: cover; }
.co-chapter__title { font-size: 1.5rem; }
.co-chapter__progress { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-entries { display: flex; flex-direction: column; gap: 6px; }
.co-entry { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); text-align: left; cursor: pointer; }
.co-entry--locked { border-style: dashed; color: var(--wg-color-text-muted); cursor: default; }
.co-entry--new { border-color: var(--wg-color-accent); }
.co-entry__text { display: flex; flex-direction: column; }
.co-entry__title { font-weight: 700; }
.co-entry__sub { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-reader { max-height: 92%; }
.co-reader__body { display: flex; flex-direction: column; gap: 12px; }
.co-reader__art { width: 100%; height: 11rem; object-fit: cover; border-radius: var(--wg-radius-md); }
.co-reader__text { font-family: var(--wg-font-display); font-size: 1.375rem; line-height: 1.55; }
.co-chapter-card__art { width: 100%; height: 14rem; object-fit: cover; border-radius: var(--wg-radius-md); }
.co-chapter-card__title { font-size: 2rem; text-align: center; color: var(--co-gold-light); }
.co-ach { display: grid; grid-template-columns: 2.75rem 1fr; gap: 12px; padding: 10px; background: var(--wg-color-surface); border: 2px solid var(--wg-color-border); border-radius: var(--wg-radius-md); }
.co-ach--done { border-color: var(--wg-color-success); }
.co-ach__icon { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 50%; border: 2px solid var(--wg-color-border); }
.co-ach__name { font-size: 1.25rem; }
.co-ach__desc, .co-ach__progress { font-size: 0.875rem; color: var(--wg-color-text-muted); }
.co-ach .wg-progress { margin: 6px 0 2px; }
.co-stats { display: flex; flex-direction: column; gap: 4px; }
.co-stats__row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; background: var(--wg-color-surface); border-radius: var(--wg-radius-sm); }
.co-stats__row dt { color: var(--wg-color-text-muted); }
.co-stats__row dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.co-howto { display: flex; flex-direction: column; gap: 12px; }
.co-howto__body { font-size: 1.0625rem; line-height: 1.6; }
.co-eclipse-seq { position: fixed; inset: 0; z-index: 250; display: flex; align-items: center; justify-content: center; background: var(--co-ink-950); padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
.co-eclipse-seq__disc { position: absolute; width: 60vmin; height: 60vmin; border-radius: 50%; background: #050813; box-shadow: 0 0 0 6px var(--co-gold-light), 0 0 80px 20px rgba(235, 203, 133, 0.35); }
.co-eclipse-seq__text { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 16px; }
.co-eclipse-seq__title { font-size: 2.5rem; color: var(--co-gold-light); }
.co-eclipse-seq--still .co-eclipse-seq__disc { transform: none; }
[data-contrast="high"] .co-title__shade { background: rgba(11, 18, 38, 0.97); }
[data-contrast="high"] .co-sky__layer { opacity: 0.35; }
[data-contrast="high"] .co-card-atlas, [data-contrast="high"] .co-row, [data-contrast="high"] .co-boon, [data-contrast="high"] .co-entry, [data-contrast="high"] .co-ach { border-width: 3px; }
`;
