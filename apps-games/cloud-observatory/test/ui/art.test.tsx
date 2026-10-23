import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ArtImage } from "../../src/ui/ArtImage";
import { ART_MANIFEST, type ArtManifest } from "../../src/ui/art-manifest";
import { ART_SLOTS, type ArtSlot, slotSpec } from "../../src/ui/art-slots";
import { cleanup } from "./harness";

afterEach(cleanup);

async function draw(slot: ArtSlot, manifest?: ArtManifest, alt?: string): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() =>
    render(
      <ArtImage slot={slot} {...(manifest ? { manifest } : {})} {...(alt ? { alt } : {})} />,
      container,
    ),
  );
  return container;
}

describe("art slots", () => {
  it("lists the 33 slots of the assets index, once each", () => {
    expect(ART_SLOTS).toHaveLength(33);
    expect(new Set(ART_SLOTS).size).toBe(33);
    const index = readFileSync(
      join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "..",
        ".agents/games/cloud-observatory/assets-index.md",
      ),
      "utf8",
    );
    const documented = Array.from(
      index.matchAll(/^\| B\d \| ([a-z0-9-]+) \|/gm),
      (m) => m[1],
    ).sort();
    expect(documented).toHaveLength(33);
    expect([...ART_SLOTS].sort()).toEqual(documented);
  });

  it("ships an empty manifest until the art task fills it", () => {
    expect(Object.keys(ART_MANIFEST)).toHaveLength(0);
  });
});

describe("placeholders", () => {
  for (const slot of ART_SLOTS) {
    it(`${slot} draws a code placeholder when the manifest is empty`, async () => {
      const box = await draw(slot);
      const art = box.querySelector(`[data-art-slot='${slot}']`);
      expect(art?.getAttribute("data-art")).toBe("placeholder");
      expect(art?.tagName.toLowerCase()).toBe("svg");
      expect(box.querySelector("img")).toBeNull();
      expect(art?.getAttribute("viewBox")).toMatch(/^0 0 \d+ \d+$/);
      expect(art?.querySelectorAll("path, circle, rect, ellipse").length).toBeGreaterThan(1);
      if (slotSpec(slot).decorative) {
        expect(art?.getAttribute("aria-hidden")).toBe("true");
      } else {
        expect(art?.getAttribute("role")).toBe("img");
        expect(art?.getAttribute("aria-label")?.length).toBeGreaterThan(5);
      }
    });
  }
});

describe("manifest images", () => {
  const manifest: ArtManifest = {
    "key-art": { src: "/art/key-art.webp", width: 360, height: 540 },
    "emblem-lyre": { src: "/art/emblem-lyre.webp", width: 144, height: 144 },
  };

  it("uses an img with size, async decoding and alt when the slot is in the manifest", async () => {
    const box = await draw("key-art", manifest);
    const img = box.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/art/key-art.webp");
    expect(img?.getAttribute("width")).toBe("360");
    expect(img?.getAttribute("height")).toBe("540");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(img?.getAttribute("alt")?.length).toBeGreaterThan(5);
    expect(img?.getAttribute("data-art")).toBe("image");
    expect(box.querySelector("svg")).toBeNull();
  });

  it("decorative images have an empty alt and are hidden from assistive tech", async () => {
    const box = await draw("emblem-lyre", manifest);
    const img = box.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("aria-hidden")).toBe("true");
  });

  it("slots missing from a manifest still draw placeholders", async () => {
    const box = await draw("emblem-owl", manifest);
    expect(box.querySelector("[data-art='placeholder']")).not.toBeNull();
  });

  it("falls back to the placeholder when the file fails to load", async () => {
    const box = await draw("key-art", manifest);
    const img = box.querySelector("img");
    await act(() => {
      img?.dispatchEvent(new Event("error"));
    });
    expect(box.querySelector("img")).toBeNull();
    expect(box.querySelector("[data-art='placeholder']")).not.toBeNull();
  });
});
