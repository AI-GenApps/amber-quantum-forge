import { preloadImages, registerFonts } from "@web-games/kit";
import { bundledArtUrls } from "../art/slots";
import type { Services } from "../services";
import { FONT_FACES } from "../theme/fonts";
import type { AppEnv } from "./AppContext";

export interface BootOptions {
  urls?: () => string[];
  register?: typeof registerFonts;
  preload?: typeof preloadImages;
}

/** Fonts first, then the saves, then whatever art files exist. Never throws on missing art. */
export function createBoot(services: Services, options: BootOptions = {}): AppEnv["boot"] {
  const urls = options.urls ?? bundledArtUrls;
  const register = options.register ?? registerFonts;
  const preload = options.preload ?? preloadImages;
  return async (onProgress) => {
    onProgress(0.05);
    await register(FONT_FACES);
    onProgress(0.3);
    await services.start();
    onProgress(0.5);
    const list = urls();
    if (list.length === 0) return;
    await preload(list, { onProgress: (p) => onProgress(0.5 + p.fraction * 0.5) });
  };
}
