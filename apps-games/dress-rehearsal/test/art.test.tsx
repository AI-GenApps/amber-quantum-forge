import { CATEGORIES, PIECE_BY_ID, PIECES } from "@web-games/dress-rehearsal-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ART_ENTRIES, ART_MANIFEST, artUrls, hasArt } from "../src/art/manifest";
import { defaultLabel, Sprite } from "../src/art/Sprite";
import {
  clientSlot,
  isSlotId,
  pieceSlot,
  runtimeSize,
  SLOT_IDS,
  SLOTS,
  type SlotId,
  slotDef,
  slotUrl,
} from "../src/art/slots";
import { Glyph } from "../src/glyphs/Glyph";
import { COLOUR_HEX } from "../src/theme/garment";
import { PALETTE } from "../src/theme/tokens";

afterEach(() => {
  document.body.replaceChildren();
});

async function draw(vnode: preact.ComponentChild): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(vnode, container));
  return container;
}

describe("art slots", () => {
  it("lists exactly 63 slots", () => {
    expect(SLOTS).toHaveLength(63);
    expect(new Set(SLOT_IDS).size).toBe(63);
    const count = (kind: string) => SLOTS.filter((slot) => slot.kind === kind).length;
    expect({
      item: count("item"),
      client: count("client"),
      backdrop: count("backdrop"),
      keyart: count("keyart"),
      icon: count("icon"),
      landscape: count("landscape"),
    }).toEqual({ item: 48, client: 6, backdrop: 6, keyart: 1, icon: 1, landscape: 1 });
  });

  it("has one item slot for every closet piece and none besides", () => {
    const items = SLOTS.filter((slot) => slot.kind === "item").map((slot) => slot.id as string);
    expect(items.sort()).toEqual(PIECES.map((piece) => piece.id).sort());
    for (const piece of PIECES) expect(pieceSlot(piece.id)).toBe(piece.id);
    expect(pieceSlot("item-nope-1")).toBeNull();
  });

  it("keeps the store-only slots out of the bundle and sizes the rest", () => {
    expect(SLOTS.filter((slot) => !slot.inBundle).map((slot) => slot.id)).toEqual([
      "icon",
      "feature-graphic",
    ]);
    expect(runtimeSize("item-riviera-1")).toEqual({ width: 256, height: 256 });
    expect(runtimeSize("client-1")).toEqual({ width: 360, height: 480 });
    expect(runtimeSize("backdrop-gala")).toEqual({ width: 800, height: 1200 });
    expect(runtimeSize("key-art")).toEqual({ width: 800, height: 1200 });
    expect(runtimeSize("icon")).toBeNull();
    expect(runtimeSize("feature-graphic")).toBeNull();
    expect(slotUrl("client-3")).toBe("/art/client-3.webp");
    expect(clientSlot(0)).toBe("client-1");
    expect(clientSlot(5)).toBe("client-6");
    expect(isSlotId("backdrop-studio")).toBe(true);
    expect(isSlotId("backdrop-moon")).toBe(false);
    expect(() => slotDef("nope" as SlotId)).toThrow(/Unknown art slot/);
  });
});

describe("empty manifest", () => {
  it("is empty in this task, so no art URL is preloaded", () => {
    expect(ART_ENTRIES).toHaveLength(0);
    expect(ART_MANIFEST).toEqual([]);
    expect(artUrls()).toEqual([]);
    expect(hasArt("icon")).toBe(false);
  });

  it("renders a code-drawn fallback for every one of the 63 slots", async () => {
    for (const slot of SLOT_IDS) {
      const container = await draw(<Sprite slot={slot} size={64} />);
      const art = container.firstElementChild as HTMLElement;
      expect(art, slot).not.toBeNull();
      expect(art.dataset.art, slot).toBe("fallback");
      expect(art.dataset.artSlot, slot).toBe(slot);
      expect(art.tagName === "IMG", slot).toBe(false);
      expect(art.getAttribute("aria-label"), slot).toBe(defaultLabel(slot));
      expect(container.querySelectorAll("path, circle, rect, span").length, slot).toBeGreaterThan(
        0,
      );
      container.remove();
    }
  });

  it("draws each piece as its category garment in the piece colour", async () => {
    for (const piece of PIECES) {
      const container = await draw(<Sprite slot={piece.id as SlotId} />);
      const svg = container.querySelector("svg.dr-glyph") as SVGElement;
      expect(svg.dataset.category, piece.id).toBe(piece.category);
      expect(svg.dataset.colour, piece.id).toBe(piece.colour);
      expect(svg.getAttribute("aria-label"), piece.id).toBe(piece.name);
      const shapes = Array.from(svg.querySelectorAll("path, circle"));
      expect(
        shapes.some((el) => el.getAttribute("fill") === COLOUR_HEX[piece.colour]),
        piece.id,
      ).toBe(true);
      expect(
        shapes.some((el) => el.getAttribute("stroke") === PALETTE.ink),
        piece.id,
      ).toBe(true);
      container.remove();
    }
  });

  it("draws the client badge with the initial in the chapter accent", async () => {
    const container = await draw(<Sprite slot="client-3" size={60} />);
    const badge = container.querySelector(".dr-badge") as HTMLElement;
    expect(badge.textContent).toBe("O");
    expect(badge.style.getPropertyValue("--dr-accent")).toBe("#a1281f");
    expect(badge.style.height).toBe("80px");
    expect(badge.getAttribute("role")).toBe("img");
  });

  it("hides decorative art from assistive technology", async () => {
    const piece = await draw(<Sprite slot="item-riviera-1" decorative />);
    expect(piece.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(piece.querySelector("svg")?.hasAttribute("aria-label")).toBe(false);
    const client = await draw(<Sprite slot="client-1" decorative />);
    expect(client.querySelector(".dr-badge")?.getAttribute("aria-hidden")).toBe("true");
    const backdrop = await draw(<Sprite slot="backdrop-gala" decorative />);
    expect(backdrop.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("with art listed", () => {
  it("renders an img for a listed slot and a fallback for the rest", async () => {
    const manifest: readonly SlotId[] = ["item-riviera-1", "client-2"];
    const listed = await draw(<Sprite slot="item-riviera-1" size={64} manifest={manifest} />);
    const img = listed.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/art/item-riviera-1.webp");
    expect(img.dataset.art).toBe("image");
    expect(img.getAttribute("alt")).toBe("Breton Stripe Tee");
    expect(img.getAttribute("width")).toBe("64");
    expect(img.getAttribute("height")).toBe("64");
    const portrait = await draw(<Sprite slot="client-2" size={60} manifest={manifest} />);
    expect(portrait.querySelector("img")?.getAttribute("height")).toBe("80");
    const missing = await draw(<Sprite slot="item-riviera-2" manifest={manifest} />);
    expect(missing.querySelector("img")).toBeNull();
    expect(missing.querySelector("svg.dr-glyph")).not.toBeNull();
    const quiet = await draw(<Sprite slot="item-riviera-1" manifest={manifest} decorative />);
    expect(quiet.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(artUrls(manifest)).toEqual(
      ["/art/item-riviera-1.webp", "/art/client-2.webp"].sort(
        (a, b) =>
          SLOT_IDS.indexOf(a.slice(5, -5) as SlotId) - SLOT_IDS.indexOf(b.slice(5, -5) as SlotId),
      ),
    );
    expect(artUrls(["icon", "feature-graphic"])).toEqual([]);
    expect(hasArt("client-2", manifest)).toBe(true);
  });
});

describe("glyph component", () => {
  it("draws every category and labels it only when asked", async () => {
    for (const category of CATEGORIES) {
      const container = await draw(<Glyph category={category} colour="red" label={category} />);
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.querySelectorAll("path, circle").length).toBeGreaterThan(2);
      container.remove();
    }
    const quiet = await draw(<Glyph category="top" colour="red" />);
    expect(quiet.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(PIECE_BY_ID.size).toBe(48);
  });
});
