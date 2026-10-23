import { type FontFaceSpec, preloadImages, registerFonts } from "@web-games/kit";
import { artUrls } from "../art/manifest";
import { isSlotId } from "../art/slots";
import { FONT_FACES } from "../fonts";
import type { AppContextValue } from "../state/app";

export interface PreloadOptions {
  faces?: readonly FontFaceSpec[];
  urls?: readonly string[];
  loader?: (url: string) => Promise<void>;
  /** Decoded art is stored here by slot id so the export canvas can draw it. */
  images?: Record<string, unknown>;
}

export function slotOfUrl(url: string): string {
  const name = url.split("/").pop() ?? url;
  return name.replace(/\.webp$/, "");
}

/** Loads an image in the browser and keeps the element for canvas drawing. */
export function createImageStore(target: Record<string, unknown>) {
  return (url: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (typeof Image === "undefined") {
        reject(new Error("Image is not available"));
        return;
      }
      const image = new Image();
      image.onload = () => {
        const slot = slotOfUrl(url);
        if (isSlotId(slot)) target[slot] = image;
        resolve();
      };
      image.onerror = () => reject(new Error(`Failed to load ${url}`));
      image.src = url;
    });
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
    const loader =
      options.loader ?? (options.images ? createImageStore(options.images) : undefined);
    await preloadImages(urls, {
      ...(loader ? { loader } : {}),
      onProgress: (p) => onProgress(0.4 + p.fraction * 0.6),
    });
    onProgress(1);
  };
}
