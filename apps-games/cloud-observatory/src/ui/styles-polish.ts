/** Onboarding hints, How to Play diagrams and the chart wash. */
export const polishCss = `
.co-coach { display: flex; align-items: center; gap: 8px; margin: 4px 8px; padding: 6px 8px 6px 12px; background: var(--wg-color-surface-raised); border: 2px solid var(--co-gold-light); border-radius: var(--wg-radius-md); pointer-events: none; }
.co-coach .co-icon { color: var(--co-gold-light); }
.co-coach__text { flex: 1; font-size: 1rem; font-weight: 600; }
.co-coach__skip { pointer-events: auto; flex: none; background: transparent; border: 0; padding: 0 8px; color: var(--wg-color-text-muted); font-size: 0.875rem; text-decoration: underline; cursor: pointer; touch-action: manipulation; }
.co-howto__diagram { width: 100%; max-height: 9rem; background: var(--wg-color-surface); border-radius: var(--wg-radius-md); }
.co-howto__n { fill: var(--wg-color-text); font-family: var(--wg-font-body); }
.co-howto__replay { align-self: center; }
.co-board { position: relative; }
.co-wash-gold { position: absolute; inset: 0; opacity: 0; pointer-events: none; border-radius: var(--wg-radius-md); background: radial-gradient(circle at 50% 50%, rgba(235, 203, 133, 0.55), rgba(216, 169, 75, 0.12) 70%, transparent); }
`;
