import { describe, expect, it } from "vitest";
import { ART_MANIFEST, CRITICAL_SLOTS, criticalUrls } from "../../src/ui/art-manifest";
import { preloadCriticalArt } from "../../src/ui/art-preload";

describe("critical art preload", () => {
  it("names key-art, sky-far and observatory-building as critical", () => {
    expect([...CRITICAL_SLOTS]).toEqual(["key-art", "sky-far", "observatory-building"]);
  });

  it("preloads the three critical slots that are in the manifest", async () => {
    expect(criticalUrls()).toEqual([
      "/art/key-art.webp",
      "/art/sky-far.webp",
      "/art/observatory-building.webp",
    ]);
    const seen: string[][] = [];
    await preloadCriticalArt(ART_MANIFEST, async (urls) => {
      seen.push([...urls]);
      return { loaded: [...urls], failed: [] };
    });
    expect(seen).toEqual([
      ["/art/key-art.webp", "/art/sky-far.webp", "/art/observatory-building.webp"],
    ]);
  });

  it("skips critical slots that are not in a partial manifest", () => {
    const keyArt = ART_MANIFEST["key-art"];
    const partial = keyArt ? { "key-art": keyArt } : {};
    expect(criticalUrls(partial)).toEqual(["/art/key-art.webp"]);
  });

  it("resolves with nothing to load for an empty manifest", async () => {
    expect(criticalUrls({})).toEqual([]);
    expect(await preloadCriticalArt({})).toEqual({ loaded: [], failed: [] });
  });
});
