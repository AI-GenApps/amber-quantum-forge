export type ImageLoader = (url: string) => Promise<void>;

export interface PreloadProgress {
  loaded: number;
  failed: number;
  total: number;
  /** 0 to 1; reaches 1 when every asset has settled, even if some failed. */
  fraction: number;
  url: string;
  ok: boolean;
}

export interface PreloadOptions {
  loader?: ImageLoader;
  onProgress?: (progress: PreloadProgress) => void;
  /** Maximum simultaneous loads. Default 6. */
  concurrency?: number;
}

export interface PreloadResult {
  loaded: string[];
  failed: string[];
}

/** Browser image loader: resolves once the image is decoded, rejects on error. */
export function defaultImageLoader(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new Error("Image is not available"));
      return;
    }
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

/** Preloads images with bounded concurrency and per-asset progress. Never rejects. */
export async function preloadImages(
  urls: readonly string[],
  options: PreloadOptions = {},
): Promise<PreloadResult> {
  const { loader = defaultImageLoader, onProgress, concurrency = 6 } = options;
  const unique = [...new Set(urls)];
  const result: PreloadResult = { loaded: [], failed: [] };
  const total = unique.length;
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < total) {
      const url = unique[next++] as string;
      let ok = true;
      try {
        await loader(url);
        result.loaded.push(url);
      } catch {
        ok = false;
        result.failed.push(url);
      }
      const done = result.loaded.length + result.failed.length;
      onProgress?.({
        loaded: result.loaded.length,
        failed: result.failed.length,
        total,
        fraction: total === 0 ? 1 : done / total,
        url,
        ok,
      });
    }
  };

  const workers = Math.max(1, Math.min(Math.floor(concurrency), total));
  await Promise.all(Array.from({ length: total === 0 ? 0 : workers }, worker));
  return result;
}
