import { afterEach, describe, expect, it, vi } from "vitest";
import { artUrls } from "../src/art/manifest";
import { createImageStore, createPreload, slotOfUrl } from "../src/boot/preload";

afterEach(() => vi.unstubAllGlobals());

class FakeImage {
  static created: FakeImage[] = [];
  static failing = new Set<string>();
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeImage.created.push(this);
  }
  set src(url: string) {
    queueMicrotask(() => (FakeImage.failing.has(url) ? this.onerror?.() : this.onload?.()));
  }
}

describe("art preload", () => {
  it("derives the slot id from a runtime url", () => {
    expect(slotOfUrl("/art/house-cottage.webp")).toBe("house-cottage");
    expect(slotOfUrl("pump.webp")).toBe("pump");
  });

  it("keeps each decoded image by slot id for the canvas", async () => {
    FakeImage.created = [];
    vi.stubGlobal("Image", FakeImage);
    const target: Record<string, unknown> = {};
    await createImageStore(target)("/art/pump.webp");
    await createImageStore(target)("/art/unknown-slot.webp");
    expect(Object.keys(target)).toEqual(["pump"]);
    expect(target.pump).toBe(FakeImage.created[0]);
  });

  it("fills the image map during boot and survives a failed file", async () => {
    FakeImage.created = [];
    const urls = artUrls();
    FakeImage.failing = new Set([urls[0] as string]);
    vi.stubGlobal("Image", FakeImage);
    const images: Record<string, unknown> = {};
    const seen: number[] = [];
    await createPreload({ faces: [], images })((fraction) => seen.push(fraction));
    expect(Object.keys(images)).toHaveLength(urls.length - 1);
    expect(images[slotOfUrl(urls[0] as string)]).toBeUndefined();
    expect(seen.at(-1)).toBe(1);
    FakeImage.failing.clear();
  });
});
