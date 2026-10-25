import { beforeAll, describe, expect, it } from "vitest";
import { BUDGETS, type BundleReport, measureAssets, measureBundle } from "../scripts/bundle-lib";

describe("release budgets", () => {
  let bundle: BundleReport;

  beforeAll(async () => {
    bundle = await measureBundle();
  }, 60000);

  it("emits JavaScript and keeps it at most 300 KB gzip (art, fonts and audio excluded)", () => {
    expect(bundle.jsFiles.length).toBeGreaterThan(0);
    expect(bundle.jsGzipBytes).toBeGreaterThan(10_000);
    expect(bundle.jsGzipBytes).toBeLessThanOrEqual(BUDGETS.jsGzipBytes);
  });

  it("keeps runtime art at most 8 MB and every art file at most 400 KB", () => {
    const art = measureAssets("art", [".webp", ".png", ".jpg"]);
    expect(art.files).toHaveLength(61);
    expect(art.bytes).toBeLessThanOrEqual(BUDGETS.artBytes);
    for (const entry of art.files) {
      expect(entry.bytes, entry.file).toBeLessThanOrEqual(BUDGETS.singleArtBytes);
    }
  });

  it("keeps fonts at most 300 KB", () => {
    const fonts = measureAssets("fonts", [".woff2"]);
    expect(fonts.files).toHaveLength(3);
    expect(fonts.bytes).toBeLessThanOrEqual(BUDGETS.fontBytes);
  });

  it("keeps audio at most 2 MB", () => {
    const audio = measureAssets("audio", [".ogg", ".mp3", ".m4a", ".wav"]);
    expect(audio.files).toHaveLength(29);
    expect(audio.bytes).toBeLessThanOrEqual(BUDGETS.audioBytes);
  });
});
