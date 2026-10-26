/** Sky map, chart board, art slots and keyframes. */
export const skyCss = `
.co-art { display: block; max-width: 100%; }
.co-art--placeholder { width: 100%; height: 100%; }
.co-gl { fill: none; stroke: var(--wg-color-accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.co-gl--thin { stroke-width: 1.5; opacity: 0.7; }
.co-gl--fig { stroke-width: 4; }
.co-gl-dot { fill: var(--co-gold-light); }
.co-gl-fill { fill: var(--wg-color-surface-raised); stroke: var(--wg-color-accent); stroke-width: 2; }
.co-disc-ring { stroke: var(--wg-color-accent); stroke-width: 2; }
.co-hill { fill: var(--co-ink-950); stroke: var(--wg-color-border); stroke-width: 1.5; }
.co-hill--near { fill: #0b1226; }
.co-wash { fill: var(--co-teal); opacity: 0.18; }
.co-figure { width: 100%; height: 100%; }
.co-figure__line { fill: none; stroke: var(--wg-color-accent); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
.co-figure__star { fill: var(--co-gold-light); }
.co-figure--dim { opacity: 0.55; }
.co-sky { position: relative; width: 100%; height: 100%; overflow: hidden; background: linear-gradient(180deg, var(--co-ink-950) 0%, var(--co-ink-900) 60%, #1b2a55 100%); }
.co-sky__layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.co-sky__nebula { opacity: var(--co-wash-opacity); }
.co-sky__hills { top: auto; bottom: 0; height: 45%; object-position: center bottom; }
.co-sky__map { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: manipulation; }
.co-dot { fill: var(--wg-color-text); opacity: 0.7; }
.co-twinkle { animation: co-twinkle 4.8s ease-in-out infinite; }
.co-board { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 4px; }
.co-board .co-sky { flex: 1; min-height: 16rem; border-radius: var(--wg-radius-md); border: 2px solid var(--wg-color-border); }
.co-board__status { min-height: 1.5rem; text-align: center; color: var(--wg-color-text-muted); font-size: 0.875rem; }
.co-line { fill: none; stroke: var(--wg-color-accent); stroke-width: calc(var(--co-line-width) * 3px); stroke-linecap: round; stroke-linejoin: round; }
.co-line--new { stroke: var(--co-gold-light); stroke-dasharray: 1; stroke-dashoffset: 1; animation: co-draw 480ms ease-out forwards; }
.co-star { cursor: pointer; }
.co-star:focus-visible { outline: none; }
.co-star:focus-visible .co-badge { stroke: var(--wg-color-focus); stroke-width: 8; }
.co-badge { fill: var(--wg-color-surface); stroke: var(--wg-color-accent); stroke-width: 4; }
.co-badge__n { fill: var(--wg-color-text); font-family: var(--wg-font-body); font-weight: 700; pointer-events: none; }
.co-star--done .co-badge { fill: var(--wg-color-accent); }
.co-star--done .co-badge__n { fill: var(--wg-color-accent-text); }
.co-star--next .co-badge { fill: var(--wg-color-surface-raised); stroke: var(--co-gold-light); stroke-width: 6; }
.co-ring { fill: none; stroke: var(--co-gold-light); stroke-width: 6; stroke-dasharray: 14 8; transform-box: fill-box; transform-origin: center; }
.co-pulse { animation: co-pulse 1.8s ease-in-out infinite; }
.co-star__inner { transform-box: fill-box; transform-origin: center; }
.co-star--miss .co-badge { stroke: var(--wg-color-danger); stroke-width: 8; }
.co-shake { animation: co-shake 320ms linear 1; }
.co-glow { fill: none; stroke: var(--co-gold-light); stroke-width: 5; opacity: 0.5; transform-box: fill-box; transform-origin: center; }
.co-flourish--anim .co-glow { animation: co-glow 1.4s ease-out 1 forwards; }
.co-pips { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
.co-pip { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--wg-color-accent); background: transparent; }
.co-pip--on { background: var(--wg-color-accent); }
.co-pop { position: absolute; font-family: var(--wg-font-display); font-weight: 700; font-size: 1.5rem; color: var(--co-gold-light); animation: co-pop 800ms ease-out forwards; pointer-events: none; }
@keyframes co-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.9; } }
@keyframes co-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.75; } }
@keyframes co-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-14px); } 50% { transform: translateX(14px); } 75% { transform: translateX(-8px); } }
@keyframes co-draw { to { stroke-dashoffset: 0; } }
@keyframes co-glow { from { transform: scale(0.6); opacity: 0.9; } to { transform: scale(1.8); opacity: 0; } }
@keyframes co-pop { from { transform: translateY(40px); opacity: 1; } to { transform: translateY(-40px); opacity: 0; } }
`;
