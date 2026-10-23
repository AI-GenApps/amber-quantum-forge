import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { BACKDROP_SCRIM, Backdrop, backdropSlot } from "../src/art/Backdrop";
import { drawShapes } from "../src/art/drawShapes";
import { FALLBACKS } from "../src/art/fallbacks";
import { ART_MANIFEST, artUrls, hasArt } from "../src/art/manifest";
import { Sprite } from "../src/art/Sprite";
import { SLOT_IDS, SLOTS, slotDef, slotUrl } from "../src/art/slots";
import { BACKDROP_MARGIN_ALPHA, drawBackground } from "../src/board/draw";
import { drawSprite, roleColors } from "../src/board/drawPieces";
import type { Geometry } from "../src/board/geometry";
import { DEFAULT_MAP_THEME } from "../src/theme/mapThemes";
import { mountApp, RecordingContext, type RigOptions } from "./helpers";

afterEach(() => document.body.replaceChildren());

async function mountNode(node: preact.ComponentChild): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(node, container));
  return container;
}

describe("art slots", () => {
  it("lists the 20 designer slots from the assets index", () => {
    expect(SLOT_IDS).toHaveLength(20);
    expect(new Set(SLOT_IDS).size).toBe(20);
    const index = readFileSync(
      join(import.meta.dirname, "../../../.agents/games/floodplain-dispatch/assets-index.md"),
      "utf8",
    );
    for (const id of SLOT_IDS) expect(index).toContain(`\`${id}\``);
  });

  it("has a code-drawn fallback for every slot", () => {
    for (const slot of SLOTS) {
      const fallback = FALLBACKS[slot.id];
      expect(fallback.label.length).toBeGreaterThan(0);
      expect(fallback.shapes.length > 0 || fallback.gradient !== undefined).toBe(true);
    }
  });

  it("lists exactly the bundle slots that have a runtime file", () => {
    const files = readdirSync(join(import.meta.dirname, "../public/art"))
      .map((name) => name.replace(/\.webp$/, ""))
      .sort();
    expect([...ART_MANIFEST].sort()).toEqual(files);
    expect(artUrls()).toEqual(
      SLOTS.filter((slot) => ART_MANIFEST.includes(slot.id)).map((slot) => slotUrl(slot.id)),
    );
    expect(ART_MANIFEST).not.toContain("key-art");
    expect(ART_MANIFEST).not.toContain("icon");
    expect(ART_MANIFEST).not.toContain("feature-graphic");
  });

  it("lists bundle art only for manifest entries that ship in the bundle", () => {
    expect(artUrls(["house-cottage", "icon"])).toEqual([slotUrl("house-cottage")]);
    expect(hasArt("pump", ["pump"])).toBe(true);
    expect(hasArt("pump", [])).toBe(false);
  });
});

describe("Sprite", () => {
  it("falls back to the code-drawn svg when the manifest lacks the slot", async () => {
    const root = await mountNode(<Sprite slot="house-cottage" manifest={[]} />);
    const svg = root.querySelector("svg[data-slot='house-cottage']");
    expect(svg?.getAttribute("data-art")).toBe("fallback");
    expect(svg?.getAttribute("aria-label")).toBe("Cottage");
    expect(root.querySelector("img")).toBeNull();
    expect(svg?.querySelectorAll("rect, polygon, circle, polyline").length).toBeGreaterThan(3);
  });

  it("renders an img when the manifest lists the slot", async () => {
    const root = await mountNode(
      <Sprite slot="house-cottage" manifest={["house-cottage"]} label="Home" />,
    );
    const img = root.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/art/house-cottage.webp");
    expect(img?.getAttribute("alt")).toBe("Home");
    expect(root.querySelector("svg")).toBeNull();
  });

  it("renders every slot without a manifest", async () => {
    for (const id of SLOT_IDS) {
      const root = await mountNode(<Sprite slot={id} />);
      expect(root.querySelector(`[data-slot='${id}']`)).not.toBeNull();
    }
  });

  it("draws shapes onto a canvas-like context with palette colours", () => {
    const ctx = new RecordingContext();
    drawShapes(ctx, FALLBACKS["house-cottage"].shapes, 10, 20, 40, roleColors(DEFAULT_MAP_THEME));
    expect(ctx.count("fill")).toBeGreaterThan(3);
    expect(ctx.count("stroke")).toBeGreaterThan(3);
    expect(ctx.calls("translate")[0]).toEqual([10, 20]);
  });
});

describe("Backdrop", () => {
  it("maps every region to its backdrop slot", () => {
    expect(backdropSlot("valley")).toBe("backdrop-valley");
    expect(backdropSlot("delta")).toBe("backdrop-delta");
    expect(backdropSlot("highland")).toBe("backdrop-highland");
    expect(backdropSlot("estuary")).toBe("backdrop-estuary");
    expect(backdropSlot("daily")).toBe("backdrop-valley");
  });

  it("uses the art when the manifest lists it and the palette gradient otherwise", async () => {
    const withArt = await mountNode(
      <Backdrop region="delta" manifest={["backdrop-delta"]} scrim="#101010" />,
    );
    const art = withArt.querySelector("[data-slot='backdrop-delta']");
    expect(art?.getAttribute("data-art")).toBe("image");
    expect(art?.getAttribute("style")).toContain("/art/backdrop-delta.webp");
    const scrim = withArt.querySelector<HTMLElement>(".fd-backdrop__scrim");
    expect(scrim?.style.opacity).toBe(String(BACKDROP_SCRIM));
    const without = await mountNode(<Backdrop region="delta" manifest={[]} />);
    const fallback = without.querySelector("[data-slot='backdrop-delta']");
    expect(fallback?.getAttribute("data-art")).toBe("fallback");
    expect(fallback?.getAttribute("style")).toContain("linear-gradient");
    expect(fallback?.getAttribute("aria-hidden")).toBe("true");
  });

  it("hides the art behind an opaque scrim in high contrast", async () => {
    const root = await mountNode(<Backdrop region="valley" plain />);
    expect(root.querySelector<HTMLElement>(".fd-backdrop__scrim")?.style.opacity).toBe("1");
  });
});

describe("screens with no art, some art and all art", () => {
  const some = ["house-cottage", "backdrop-valley"] as const;
  const manifests = [
    ["empty", []],
    ["partial", some],
    ["full", SLOT_IDS.filter((id) => slotDef(id).inBundle)],
  ] as const;

  for (const [name, manifest] of manifests) {
    it(`renders home, the board, the tray and credits with a ${name} manifest`, async () => {
      const routes: NonNullable<RigOptions["route"]>[] = [
        ["home"],
        ["board", { mapId: "v01" }],
        ["credits"],
        ["regions"],
      ];
      for (const route of routes) {
        const rig = await mountApp({ route, artManifest: manifest });
        expect(rig.container.querySelector("[data-screen]")).not.toBeNull();
        if (route[0] === "board") {
          const backdrop = rig.container.querySelector(".fd-backdrop");
          expect(backdrop?.getAttribute("data-slot")).toBe("backdrop-valley");
          expect(backdrop?.getAttribute("data-art")).toBe(
            manifest.includes("backdrop-valley" as never) ? "image" : "fallback",
          );
          expect(rig.container.querySelector(".fd-board-canvas")).not.toBeNull();
          expect(rig.container.querySelectorAll("button svg, button img").length).toBeGreaterThan(
            0,
          );
        }
        document.body.replaceChildren();
      }
    });
  }

  it("keeps the title and loading screens on the placeholder while key-art and icon have no runtime art", async () => {
    const home = await mountApp({ route: ["home"] });
    expect(home.container.querySelector("[data-slot='key-art']")?.getAttribute("data-art")).toBe(
      "fallback",
    );
  });
});

describe("board drawing", () => {
  it("lays the margin colour translucently over a backdrop", () => {
    const geom = { viewport: { width: 160, height: 100 } } as Geometry;
    const base = { theme: DEFAULT_MAP_THEME, highContrast: false, reducedMotion: false, time: 0 };
    const plain = new RecordingContext();
    drawBackground(plain, geom, base);
    expect(plain.calls("fillRect")).toHaveLength(1);
    expect(plain.ops.some((op) => op.op === "set:globalAlpha")).toBe(false);
    const over = new RecordingContext();
    drawBackground(over, geom, { ...base, backdrop: true });
    const seen = over.ops.filter((op) => op.op === "set:globalAlpha").map((op) => op.args[0]);
    expect(seen).toEqual([BACKDROP_MARGIN_ALPHA, 1]);
  });

  it("draws a loaded sprite image instead of the code-drawn shapes", () => {
    const image = { tag: "cottage" };
    const ctx = new RecordingContext();
    drawSprite(ctx, "house-cottage", 3, 4, 40, {
      theme: DEFAULT_MAP_THEME,
      highContrast: false,
      reducedMotion: false,
      time: 0,
      images: { "house-cottage": image },
    });
    expect(ctx.calls("drawImage")[0]).toEqual([image, 3, 4, 40, 40]);
    expect(ctx.count("fill")).toBe(0);
  });
});
