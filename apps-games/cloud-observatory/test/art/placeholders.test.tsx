import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ArtImage } from "../../src/ui/ArtImage";
import { ART_MANIFEST } from "../../src/ui/art-manifest";
import { ART_SLOTS, type ArtSlot, slotSpec } from "../../src/ui/art-slots";
import { cleanup } from "../ui/harness";

afterEach(cleanup);

async function draw(slot: ArtSlot, manifest = ART_MANIFEST): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<ArtImage slot={slot} manifest={manifest} />, container));
  return container;
}

describe("any subset of art", () => {
  it("draws a code-drawn placeholder for every slot when the manifest is empty", async () => {
    for (const slot of ART_SLOTS) {
      const box = await draw(slot, {});
      expect(box.querySelector(`[data-art-slot='${slot}']`)?.getAttribute("data-art"), slot).toBe(
        "placeholder",
      );
      expect(box.querySelector("img"), slot).toBeNull();
    }
  });

  it("mixes images and placeholders when only some slots are accepted", async () => {
    const owl = ART_MANIFEST["emblem-owl"];
    const partial = owl ? { "emblem-owl": owl } : {};
    expect((await draw("emblem-owl", partial)).querySelector("img")).not.toBeNull();
    expect((await draw("emblem-fox", partial)).querySelector("img")).toBeNull();
    expect((await draw("emblem-fox", partial)).querySelector("svg")).not.toBeNull();
  });

  it("ships all 33 slots as accepted except the two master-only ones", () => {
    expect(Object.keys(ART_MANIFEST).sort()).toEqual(
      ART_SLOTS.filter((slot) => slot !== "icon" && slot !== "feature-graphic").sort(),
    );
  });
});

describe("shipped manifest rendering", () => {
  for (const slot of ART_SLOTS) {
    const entry = ART_MANIFEST[slot];
    if (entry) {
      it(`${slot} renders an img with the shipped src and its display size`, async () => {
        const box = await draw(slot);
        const img = box.querySelector("img");
        const spec = slotSpec(slot);
        expect(img?.getAttribute("src")).toBe(entry.src);
        expect(img?.getAttribute("width")).toBe(String(spec.width));
        expect(img?.getAttribute("height")).toBe(String(spec.height));
        expect(entry.width).toBe(spec.width * 2);
        expect(entry.height).toBe(spec.height * 2);
        expect(box.querySelector("svg")).toBeNull();
        expect(img?.getAttribute("data-art")).toBe("image");
      });
    } else {
      it(`${slot} renders its code-drawn placeholder`, async () => {
        const box = await draw(slot);
        expect(box.querySelector(`[data-art-slot='${slot}']`)?.getAttribute("data-art")).toBe(
          "placeholder",
        );
        expect(box.querySelector("img")).toBeNull();
      });
    }
  }

  it("paints opaque images on their mean colour and loads critical slots eagerly", async () => {
    const key = (await draw("key-art")).querySelector("img");
    expect(key?.getAttribute("loading")).toBe("eager");
    expect(key?.getAttribute("style")).toMatch(/background-color:\s*(#1f2a40|rgb\(31, 42, 64\))/i);
    const lyre = (await draw("emblem-lyre")).querySelector("img");
    expect(lyre?.getAttribute("loading")).toBe("lazy");
    expect(lyre?.getAttribute("style")).toBeNull();
  });

  it("keeps meaningful alt text only where the image carries information", async () => {
    expect(
      (await draw("key-art")).querySelector("img")?.getAttribute("alt")?.length,
    ).toBeGreaterThan(5);
    expect(
      (await draw("observatory-building")).querySelector("img")?.getAttribute("alt")?.length,
    ).toBeGreaterThan(5);
    const lyre = (await draw("emblem-lyre")).querySelector("img");
    expect(lyre?.getAttribute("alt")).toBe("");
    expect(lyre?.getAttribute("aria-hidden")).toBe("true");
  });
});
