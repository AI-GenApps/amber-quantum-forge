import { describe, expect, it, vi } from "vitest";
import { assertAssetBudget, checkAssetBudget, extensionOf } from "./budget";
import { defaultImageLoader, type PreloadProgress, preloadImages } from "./preload";

describe("preloadImages", () => {
  it("loads every url and reports monotonic progress", async () => {
    const seen: PreloadProgress[] = [];
    const result = await preloadImages(["a.png", "b.png", "c.png"], {
      loader: async () => undefined,
      onProgress: (p) => seen.push(p),
      concurrency: 1,
    });
    expect(result).toEqual({ loaded: ["a.png", "b.png", "c.png"], failed: [] });
    expect(seen.map((p) => p.fraction)).toEqual([1 / 3, 2 / 3, 1]);
    expect(seen.map((p) => p.url)).toEqual(["a.png", "b.png", "c.png"]);
  });

  it("records failures without rejecting and still reaches fraction 1", async () => {
    const seen: PreloadProgress[] = [];
    const result = await preloadImages(["ok.png", "bad.png"], {
      loader: async (url) => {
        if (url === "bad.png") throw new Error("404");
      },
      onProgress: (p) => seen.push(p),
      concurrency: 1,
    });
    expect(result).toEqual({ loaded: ["ok.png"], failed: ["bad.png"] });
    expect(seen.at(-1)).toMatchObject({ loaded: 1, failed: 1, total: 2, fraction: 1, ok: false });
  });

  it("de-duplicates urls", async () => {
    const loader = vi.fn(async () => undefined);
    await preloadImages(["a.png", "a.png"], { loader });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("handles an empty list", async () => {
    const onProgress = vi.fn();
    expect(await preloadImages([], { onProgress })).toEqual({ loaded: [], failed: [] });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("never runs more loads at once than the concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    await preloadImages(["1", "2", "3", "4", "5", "6"], {
      concurrency: 2,
      loader: async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active--;
      },
    });
    expect(peak).toBe(2);
  });

  it("the default loader rejects when Image is unavailable", async () => {
    vi.stubGlobal("Image", undefined);
    await expect(defaultImageLoader("x.png")).rejects.toThrow("Image is not available");
    vi.unstubAllGlobals();
  });

  it("the default loader resolves on load and rejects on error", async () => {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        queueMicrotask(() => (value.includes("bad") ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal("Image", FakeImage);
    await expect(defaultImageLoader("good.png")).resolves.toBeUndefined();
    await expect(defaultImageLoader("bad.png")).rejects.toThrow("Failed to load bad.png");
    vi.unstubAllGlobals();
  });
});

describe("asset budget", () => {
  const entries = [
    { path: "art/hero.png", bytes: 300 },
    { path: "art/bg.PNG", bytes: 500 },
    { path: "fonts/body.woff2", bytes: 90 },
  ];

  it("passes within budget and totals by extension", () => {
    const report = checkAssetBudget(entries, { totalBytes: 1000, perFileBytes: 600, maxFiles: 3 });
    expect(report.ok).toBe(true);
    expect(report.totalBytes).toBe(890);
    expect(report.fileCount).toBe(3);
    expect(report.byExtension).toEqual({ png: 800, woff2: 90 });
  });

  it("flags total, per-file, count and extension violations", () => {
    const report = checkAssetBudget(entries, {
      totalBytes: 800,
      perFileBytes: 400,
      maxFiles: 2,
      byExtension: { png: 700, woff2: 100 },
    });
    expect(report.ok).toBe(false);
    expect(report.violations.map((v) => v.kind).sort()).toEqual([
      "count",
      "extension",
      "file",
      "total",
    ]);
    expect(report.violations.find((v) => v.kind === "file")?.path).toBe("art/bg.PNG");
  });

  it("assertAssetBudget throws with every violation listed", () => {
    expect(() => assertAssetBudget(entries, { totalBytes: 10, maxFiles: 1 })).toThrow(
      /total 890 bytes[\s\S]*3 files/,
    );
    expect(assertAssetBudget(entries, {}).ok).toBe(true);
  });

  it("extracts extensions", () => {
    expect(extensionOf("a/b/c.WebP")).toBe("webp");
    expect(extensionOf("a.b/c")).toBe("");
    expect(extensionOf(".hidden")).toBe("");
  });
});
