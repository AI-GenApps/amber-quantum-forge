import { describe, expect, it } from "vitest";
import {
  checkSource,
  renderEntriesModule,
  type SlotRow,
  type SourceInfo,
  targetSize,
  toHex,
} from "../../scripts/art-lib";

const sprite: SlotRow = {
  id: "emblem-fox",
  batch: "B2",
  transparent: true,
  bundled: true,
  display: [144, 144],
  master: [1024, 1024],
};
const scene: SlotRow = {
  ...sprite,
  id: "key-art",
  transparent: false,
  display: [360, 540],
  master: [1024, 1536],
};
const good: SourceInfo = { width: 1024, height: 1024, hasAlpha: true, cornerAlpha: [0, 0, 0, 0] };

describe("checkSource", () => {
  it("passes a correct transparent sprite and an opaque scene", () => {
    expect(checkSource(sprite, good, 2)).toEqual([]);
    expect(
      checkSource(
        scene,
        { width: 1024, height: 1536, hasAlpha: false, cornerAlpha: [255, 255, 255, 255] },
        2,
      ),
    ).toEqual([]);
  });

  it("refuses a wrong aspect class", () => {
    expect(checkSource(sprite, { ...good, height: 1536 }, 2).join()).toContain("aspect");
  });

  it("refuses a transparent slot without alpha or with an opaque corner", () => {
    expect(
      checkSource(
        sprite,
        { ...good, hasAlpha: false, cornerAlpha: [255, 255, 255, 255] },
        2,
      ).join(),
    ).toContain("no alpha");
    expect(checkSource(sprite, { ...good, cornerAlpha: [0, 0, 255, 0] }, 2).join()).toContain(
      "corner",
    );
  });

  it("refuses a source smaller than the 2x target (no upscaling)", () => {
    const small: SourceInfo = { ...good, width: 256, height: 256 };
    expect(checkSource(sprite, small, 2).join()).toContain("smaller than the 288x288");
  });

  it("computes 2x targets, none for master-only slots", () => {
    expect(targetSize(sprite, 2)).toEqual([288, 288]);
    expect(targetSize({ ...sprite, display: null, bundled: false }, 2)).toBeNull();
  });
});

describe("renderEntriesModule", () => {
  it("writes an empty manifest module when nothing is accepted", () => {
    expect(renderEntriesModule([])).toContain("ART_ENTRIES: ArtManifest = {};");
  });

  it("sorts entries by slot id so reruns are identical", () => {
    const a = {
      id: "key-art",
      src: "/art/key-art.webp",
      width: 720,
      height: 1080,
      background: "#112233",
    };
    const b = {
      id: "emblem-lyre",
      src: "/art/emblem-lyre.webp",
      width: 288,
      height: 288,
      background: "transparent",
    };
    const text = renderEntriesModule([a, b]);
    expect(text).toBe(renderEntriesModule([b, a]));
    expect(text.indexOf("emblem-lyre")).toBeLessThan(text.indexOf("key-art"));
  });

  it("formats colours as upper-case hex", () => {
    expect(toHex(31, 42, 64)).toBe("#1F2A40");
    expect(toHex(-5, 300, 0.4)).toBe("#00FF00");
  });
});
