import { CASES, GLYPH_KINDS, PEOPLE } from "@web-games/lost-parcel-desk-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { fallbackFor, GLYPH_BY_SLOT, initialsOf } from "../src/art/fallbacks";
import { ART_MANIFEST, artUrls, hasArt } from "../src/art/manifest";
import { Sprite } from "../src/art/Sprite";
import { isSlotId, SLOT_IDS, SLOTS, slotUrl } from "../src/art/slots";
import { Glyph } from "../src/ui/Glyph";

const holder = (): HTMLElement => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
};

afterEach(() => {
  document.body.replaceChildren();
});

async function draw(vnode: Parameters<typeof render>[0]): Promise<HTMLElement> {
  const el = holder();
  await act(() => render(vnode, el));
  return el;
}

describe("art slots", () => {
  it("lists the 67 slots of the assets index exactly once", () => {
    expect(SLOTS).toHaveLength(67);
    expect(new Set(SLOT_IDS).size).toBe(67);
    expect(SLOT_IDS.filter((id) => id.startsWith("evidence-"))).toHaveLength(49);
    expect(SLOT_IDS.filter((id) => id.startsWith("townsfolk-"))).toHaveLength(12);
    expect(SLOT_IDS).toEqual(
      expect.arrayContaining([
        "icon",
        "key-art",
        "desk-backdrop",
        "evidence-postcard",
        "parcel-closed",
        "parcel-open",
        "feature-graphic",
      ]),
    );
    expect(SLOT_IDS).toContain("evidence-12-5");
    expect(SLOT_IDS).not.toContain("evidence-01-1");
  });

  it("matches the art slot of every object and portrait in the content", () => {
    for (const item of CASES)
      for (const object of item.objects)
        expect(isSlotId(object.artSlot), object.artSlot).toBe(true);
    for (const person of PEOPLE)
      expect(isSlotId(person.portraitSlot), person.portraitSlot).toBe(true);
    expect(slotUrl("evidence-postcard")).toBe("/art/evidence-postcard.webp");
    expect(isSlotId("nope")).toBe(false);
  });

  it("lists the 61 accepted bundle slots and preloads exactly their files", () => {
    expect(ART_MANIFEST).toHaveLength(61);
    expect(artUrls()).toHaveLength(61);
    expect(artUrls()).toContain("/art/desk-backdrop.webp");
    for (const slot of ["icon", "feature-graphic", "key-art", "townsfolk-9"]) {
      expect(hasArt(slot), slot).toBe(false);
    }
    expect(hasArt("desk-backdrop")).toBe(true);
    expect(artUrls(["key-art", "icon", "feature-graphic"])).toEqual(["/art/key-art.webp"]);
    expect(artUrls([])).toEqual([]);
  });
});

describe("fallbacks and Sprite", () => {
  it("draws a code fallback for each of the 67 slots", async () => {
    for (const slot of SLOT_IDS) {
      const el = await draw(<Sprite slot={slot} size={80} manifest={[]} />);
      const svg = el.querySelector(`svg[data-slot='${slot}']`);
      expect(svg, slot).not.toBeNull();
      expect(svg?.getAttribute("data-art")).toBe("fallback");
      expect(svg?.getAttribute("aria-label")?.length, slot).toBeGreaterThan(0);
      if (slot !== "feature-graphic") expect(svg?.children.length, slot).toBeGreaterThan(1);
    }
  });

  it("renders an img when the manifest lists the slot and the fallback when it does not", async () => {
    const withArt = await draw(
      <Sprite
        slot="evidence-02-3"
        size={120}
        manifest={["evidence-02-3"]}
        label="Tin of lozenges"
      />,
    );
    const img = withArt.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/art/evidence-02-3.webp");
    expect(img?.getAttribute("alt")).toBe("Tin of lozenges");
    expect(img?.getAttribute("data-art")).toBe("image");
    const without = await draw(
      <Sprite slot="evidence-02-3" size={120} manifest={["evidence-02-4"]} />,
    );
    expect(without.querySelector("img")).toBeNull();
    expect(without.querySelector("svg")?.getAttribute("data-art")).toBe("fallback");
  });

  it("renders every slot as an image with a full manifest and a mix with a partial one", async () => {
    for (const slot of SLOT_IDS) {
      const el = await draw(<Sprite slot={slot} size={60} manifest={SLOT_IDS} />);
      const img = el.querySelector(`img[data-slot='${slot}']`);
      expect(img?.getAttribute("src"), slot).toBe(`/art/${slot}.webp`);
      expect(el.querySelector("svg"), slot).toBeNull();
    }
    const partial = SLOT_IDS.filter((_, i) => i % 2 === 0);
    for (const slot of SLOT_IDS) {
      const el = await draw(<Sprite slot={slot} size={60} manifest={partial} />);
      const kind = partial.includes(slot) ? "image" : "fallback";
      expect(el.querySelector(`[data-slot='${slot}']`)?.getAttribute("data-art"), slot).toBe(kind);
    }
  });

  it("draws the shipped manifest as images and the four rejected slots as drawings", async () => {
    for (const slot of ["evidence-02-3", "townsfolk-1", "parcel-open", "desk-backdrop"]) {
      const el = await draw(<Sprite slot={slot} size={60} />);
      expect(el.querySelector("img")?.getAttribute("data-art"), slot).toBe("image");
    }
    for (const slot of ["key-art", "evidence-04-3", "evidence-08-1", "townsfolk-9"]) {
      const el = await draw(<Sprite slot={slot} size={60} />);
      expect(el.querySelector("svg")?.getAttribute("data-art"), slot).toBe("fallback");
    }
  });

  it("keeps the portrait and card aspect ratios", async () => {
    const portrait = await draw(<Sprite slot="townsfolk-1" size={60} manifest={[]} />);
    expect(portrait.querySelector("svg")?.getAttribute("height")).toBe("80");
    const art = await draw(<Sprite slot="key-art" size={100} manifest={[]} />);
    expect(art.querySelector("svg")?.getAttribute("height")).toBe("150");
    const image = await draw(<Sprite slot="townsfolk-1" size={60} manifest={["townsfolk-1"]} />);
    expect(image.querySelector("img")?.getAttribute("height")).toBe("80");
  });

  it("draws portraits as initials badges and parcels as parcels", () => {
    const odalie = fallbackFor("townsfolk-1");
    expect(odalie.label).toBe("Portrait of Odalie Fenn");
    expect(initialsOf("Odalie Fenn")).toBe("OF");
    expect(fallbackFor("parcel-open").label).toBe("Open parcel with tissue");
    expect(fallbackFor("parcel-closed").label).toBe("Tied brown-paper parcel");
    expect(fallbackFor("unknown-slot").nodes).toEqual([]);
  });

  it("maps every evidence slot to the glyph of its object", () => {
    for (const item of CASES)
      for (const object of item.objects) expect(GLYPH_BY_SLOT[object.artSlot]).toBe(object.glyph);
  });
});

describe("object glyphs", () => {
  it("has the 14 kinds and every one renders distinct SVG output", async () => {
    expect(GLYPH_KINDS).toHaveLength(14);
    const seen = new Map<string, string>();
    for (const kind of GLYPH_KINDS) {
      const el = await draw(<Glyph kind={kind} size={64} label={kind} />);
      const svg = el.querySelector("svg");
      expect(svg?.getAttribute("data-glyph")).toBe(kind);
      expect(svg?.querySelector("[data-layer='offset']"), kind).not.toBeNull();
      expect(svg?.querySelector("[data-layer='fill']"), kind).not.toBeNull();
      expect(svg?.querySelector("[data-layer='grain']"), kind).not.toBeNull();
      expect(svg?.querySelector("pattern"), kind).not.toBeNull();
      const markup = svg?.innerHTML ?? "";
      for (const [other, otherMarkup] of seen)
        expect(markup, `${kind} vs ${other}`).not.toBe(otherMarkup);
      seen.set(kind, markup);
    }
    expect(seen.size).toBe(14);
  });

  it("offsets the second colour layer by a pixel or two for misregistration", async () => {
    const el = await draw(<Glyph kind="tin" />);
    expect(el.querySelector("[data-layer='offset']")?.getAttribute("transform")).toBe(
      "translate(2 2)",
    );
  });

  it("uses only palette colours", async () => {
    const { PALETTE } = await import("../src/theme/tokens");
    const allowed = new Set<string>([...Object.values(PALETTE), "none"]);
    for (const kind of GLYPH_KINDS) {
      const el = await draw(<Glyph kind={kind} />);
      for (const node of Array.from(el.querySelectorAll("[fill], [stroke]"))) {
        for (const attr of ["fill", "stroke"]) {
          const value = node.getAttribute(attr);
          if (value && !value.startsWith("url("))
            expect(allowed.has(value), `${kind} ${attr}=${value}`).toBe(true);
        }
      }
    }
  });
});
