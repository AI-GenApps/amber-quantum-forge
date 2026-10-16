import type { GraphicsQuality } from "@city-drive/core";

/**
 * One rung of the quality ladder. `scaling` is the hardware scaling level on top of the device
 * pixel ratio, `view` multiplies the fog and far plane of the chosen quality, and `traffic`
 * multiplies the district's AI car count.
 */
export interface QualityTier {
  scaling: number;
  view: number;
  traffic: number;
}

/**
 * Best to worst. The governor first lowers the resolution (1.0 to 2.0), then shortens the view,
 * then thins the traffic.
 */
export const QUALITY_TIERS: readonly QualityTier[] = [
  { scaling: 1, view: 1, traffic: 1 },
  { scaling: 1.25, view: 1, traffic: 1 },
  { scaling: 1.5, view: 1, traffic: 1 },
  { scaling: 2, view: 1, traffic: 1 },
  { scaling: 2, view: 0.8, traffic: 1 },
  { scaling: 2, view: 0.6, traffic: 1 },
  { scaling: 2, view: 0.6, traffic: 0.6 },
  { scaling: 2, view: 0.6, traffic: 0.3 },
];

export interface TierRange {
  /** The tier the governor starts in. */
  start: number;
  /** The best tier the governor may ever climb back to. */
  ceiling: number;
}

/**
 * Low, Medium and High pick the starting tier and are also the ceiling, so a player who chose Low
 * never gets more than Low. Auto starts at the top and lets the governor find the level.
 */
export function tierRange(quality: GraphicsQuality): TierRange {
  switch (quality) {
    case "low":
      return { start: 2, ceiling: 2 };
    case "medium":
      return { start: 1, ceiling: 1 };
    default:
      return { start: 0, ceiling: 0 };
  }
}

/** Largest device pixel ratio the game renders at; 3x screens are not overdrawn. */
const MAX_RENDER_DPR = 2;

/**
 * Engine hardware scaling level for a tier: 1 / min(dpr, 2) times the tier scaling. A 3x phone at
 * tier 0 renders at 2x; at tier 3 it renders at 1x (CSS pixels).
 */
export function hardwareScalingLevel(tierScaling: number, devicePixelRatio: number): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return tierScaling / Math.min(dpr, MAX_RENDER_DPR);
}
