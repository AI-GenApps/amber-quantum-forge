import { type PreloadResult, preloadImages } from "@web-games/kit";
import { ART_MANIFEST, type ArtManifest, criticalUrls } from "./art-manifest";

/**
 * Warms the decode cache for the slots the first screens need, behind the title screen. The other
 * slots are `loading="lazy"` images. Never rejects; a failed file just keeps its placeholder.
 */
export function preloadCriticalArt(
  manifest: ArtManifest = ART_MANIFEST,
  preload: typeof preloadImages = preloadImages,
): Promise<PreloadResult> {
  return preload(criticalUrls(manifest));
}
