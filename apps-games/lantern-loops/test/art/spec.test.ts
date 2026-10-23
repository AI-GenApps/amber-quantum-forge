import { describe, expect, it } from "vitest";
import { ART_SPECS, centreEdgeDensity, specOf } from "../../scripts/art-spec";
import { ART_SLOTS, bundledArtUrls, resolveSlot, SLOT_IDS } from "../../src/art/slots";

describe("art specs", () => {
  it("cover exactly the 15 slots, in the same order", () => {
    expect(ART_SPECS.map((spec) => spec.id)).toEqual([...SLOT_IDS]);
  });

  it("ship at 2x the display size, and bundle exactly the in-app slots", () => {
    for (const slot of ART_SLOTS) {
      const spec = specOf(slot.id);
      expect(spec, slot.id).toBeDefined();
      if (spec === undefined) continue;
      expect(spec.shipped !== null, `${slot.id} bundled`).toBe(slot.inApp);
      if (spec.shipped === null) continue;
      const expected =
        slot.width > 0
          ? { width: slot.width * 2, height: slot.height * 2 }
          : { width: 800, height: 1200 };
      expect(spec.shipped, slot.id).toEqual(expected);
    }
  });

  it("marks lanterns, the medallion and the empty-archive spot as transparent", () => {
    for (const spec of ART_SPECS) {
      const expected =
        spec.id.startsWith("lantern-") ||
        spec.id === "daily-medallion" ||
        spec.id === "empty-archive";
      expect(spec.transparent, spec.id).toBe(expected);
    }
  });
});

describe("slot resolution with any subset of files", () => {
  const bundled = ART_SLOTS.filter((slot) => slot.inApp);
  const subsets = [
    ...bundled.map((_, count) => bundled.slice(0, count)),
    bundled,
    ...bundled.map((slot) => [slot]),
  ];

  it("resolves every slot to its file URL or to its fallback", () => {
    for (const present of subsets) {
      const files = new Map(present.map((slot) => [slot.file, `/assets/${slot.id}-h.webp`]));
      for (const id of SLOT_IDS) {
        const source = resolveSlot(id, files);
        const entry = ART_SLOTS.find((slot) => slot.id === id);
        if (entry !== undefined && files.has(entry.file)) {
          expect(source, id).toMatchObject({ kind: "file", url: `/assets/${id}-h.webp` });
        } else {
          expect(source.kind, id).toBe("fallback");
        }
      }
      expect([...bundledArtUrls(files)].sort()).toEqual(
        present.map((slot) => `/assets/${slot.id}-h.webp`).sort(),
      );
    }
  });

  it("never loads the launcher icon or the store graphic in the app", () => {
    const files = new Map(SLOT_IDS.map((id) => [`${id}.webp`, `/assets/${id}.webp`]));
    const urls = bundledArtUrls(files);
    expect(urls).not.toContain("/assets/icon.webp");
    expect(urls).not.toContain("/assets/feature-graphic.webp");
    expect(urls).toHaveLength(13);
  });
});

describe("bundled files", () => {
  it("resolve every accepted in-app slot to a file and keep the placeholder for the rest", () => {
    const placeholders = SLOT_IDS.filter((id) => resolveSlot(id).kind === "fallback");
    expect(placeholders.sort()).toEqual(["empty-archive", "feature-graphic", "icon"]);
    expect(bundledArtUrls()).toHaveLength(12);
  });
});

describe("centre edge density", () => {
  const size = 100;

  it("is zero for a flat image and high for stripes", () => {
    expect(centreEdgeDensity(new Uint8Array(size * size).fill(40), size, size)).toBe(0);
    const stripes = new Uint8Array(size * size).map((_, i) =>
      Math.floor((i % size) / 2) % 2 ? 255 : 0,
    );
    expect(centreEdgeDensity(stripes, size, size)).toBeGreaterThan(0.2);
  });

  it("ignores detail outside the central 60%", () => {
    const grey = new Uint8Array(size * size).fill(20);
    for (let y = 0; y < size; y++) for (let x = 0; x < 10; x++) grey[y * size + x] = 255;
    expect(centreEdgeDensity(grey, size, size)).toBe(0);
  });
});
