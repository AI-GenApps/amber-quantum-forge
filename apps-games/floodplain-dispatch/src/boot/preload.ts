import { type FontFaceSpec, preloadImages, registerFonts } from "@web-games/kit";
import { artUrls } from "../art/manifest";
import { FONT_FACES } from "../fonts";
import type { AppContextValue } from "../state/app";

export interface PreloadOptions {
  faces?: readonly FontFaceSpec[];
  urls?: readonly string[];
  loader?: (url: string) => Promise<void>;
}

export function createPreload(
  options: PreloadOptions = {},
): NonNullable<AppContextValue["preload"]> {
  const faces = options.faces ?? FONT_FACES;
  return async (onProgress) => {
    onProgress(0);
    await registerFonts(faces);
    onProgress(0.4);
    const urls = options.urls ?? artUrls();
    await preloadImages(urls, {
      ...(options.loader ? { loader: options.loader } : {}),
      onProgress: (p) => onProgress(0.4 + p.fraction * 0.6),
    });
    onProgress(1);
  };
}
