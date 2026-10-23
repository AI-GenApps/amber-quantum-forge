import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { drawShapes } from "../src/art/drawShapes";
import { FALLBACKS } from "../src/art/fallbacks";
import { ART_MANIFEST, artUrls, hasArt } from "../src/art/manifest";
import { Sprite } from "../src/art/Sprite";
import { SLOT_IDS, SLOTS, slotUrl } from "../src/art/slots";
import { roleColors } from "../src/board/drawPieces";
import { DEFAULT_MAP_THEME } from "../src/theme/mapThemes";
import { RecordingContext } from "./helpers";

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

  it("ships with an empty manifest, so no art file is expected yet", () => {
    expect(ART_MANIFEST).toEqual([]);
    expect(artUrls()).toEqual([]);
    expect(readdirSync(join(import.meta.dirname, "../public")).includes("art")).toBe(false);
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
