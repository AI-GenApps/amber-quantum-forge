import { type ImageLoader, preloadImages, registerFonts } from "@web-games/kit";
import { artUrls } from "../art/manifest";
import { FONT_FACES } from "../fonts";

export interface PreloadOptions {
  manifest?: readonly string[];
  loader?: ImageLoader;
}

const FONT_SHARE = 0.25;

/** Registers the bundled fonts, then loads every listed image, reporting a 0 to 1 fraction. */
export function createPreload(
  options: PreloadOptions = {},
): (onProgress: (fraction: number) => void) => Promise<void> {
  return async (onProgress) => {
    onProgress(0);
    await registerFonts(FONT_FACES);
    onProgress(FONT_SHARE);
    const urls = artUrls(options.manifest);
    if (urls.length > 0) {
      await preloadImages(urls, {
        ...(options.loader ? { loader: options.loader } : {}),
        onProgress: (progress) => onProgress(FONT_SHARE + (1 - FONT_SHARE) * progress.fraction),
      });
    }
    onProgress(1);
  };
}
