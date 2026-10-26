import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ART_SLOT_IDS as CORE_SLOT_IDS,
  DECOR,
  type Face,
  REGULARS,
} from "@web-games/the-last-window-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { Backdrop, DECOR_SPOTS } from "../src/art/Backdrop";
import { ArtContext } from "../src/art/context";
import {
  allFallbackSlots,
  FALLBACK_COLORS,
  FallbackArt,
  fallbackShape,
} from "../src/art/fallbacks";
import { ItemIcon } from "../src/art/ItemIcon";
import { ART_MANIFEST, artUrls, hasArt } from "../src/art/manifest";
import { bustImageSlot, Portrait } from "../src/art/Portrait";
import {
  ART_SLOT_IDS,
  ART_SLOTS,
  bustSlot,
  interiorSlot,
  isSlotId,
  slotKind,
  slotUrl,
  WALKIN_IDS,
  walkinId,
} from "../src/art/slots";
import { mountApp, q, type Rig } from "./helpers";

const FACES: readonly Face[] = ["neutral", "happy", "sad"];
const HEX = /^#[0-9a-fA-F]{6}$/;

let host: HTMLElement | null = null;
let rig: Rig | null = null;

afterEach(() => {
  if (host) render(null, host);
  host?.remove();
  host = null;
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function mountNode(node: preact.ComponentChild): Promise<HTMLElement> {
  host = document.createElement("div");
  document.body.appendChild(host);
  await act(() =>
    render(<ArtContext.Provider value={[]}>{node}</ArtContext.Provider>, host as HTMLElement),
  );
  return host;
}

describe("art slots", () => {
  it("re-exports the 54 slot ids of the core list", () => {
    expect(ART_SLOTS).toHaveLength(54);
    expect(ART_SLOT_IDS.size).toBe(54);
    expect(ART_SLOT_IDS).toBe(CORE_SLOT_IDS);
    expect(isSlotId("interior-rain")).toBe(true);
    expect(isSlotId("walkin-umbrella")).toBe(false);
    expect(slotKind("customer-3-sad")).toBe("bust");
    expect(slotKind("nope")).toBeNull();
    expect(slotUrl("drink-1")).toBe("/art/drink-1.webp");
    expect(interiorSlot("rain")).toBe("interior-rain");
    expect(bustSlot("customer-2", "happy")).toBe("customer-2-happy");
    expect(walkinId(7)).toBe(WALKIN_IDS[1]);
    expect(walkinId(-1)).toBe(WALKIN_IDS[5]);
  });

  it("lists only existing runtime files and keeps the two store assets out of the bundle", () => {
    expect(ART_MANIFEST).toHaveLength(52);
    expect(ART_MANIFEST).not.toContain("icon");
    expect(ART_MANIFEST).not.toContain("feature-graphic");
    expect(artUrls()).toHaveLength(52);
    expect(hasArt("drink-1")).toBe(true);
    expect(hasArt("drink-1", [])).toBe(false);
    const publicArt = join(import.meta.dirname, "../public/art");
    for (const slot of ART_MANIFEST) {
      expect(isSlotId(slot)).toBe(true);
      expect(existsSync(join(publicArt, `${slot}.webp`))).toBe(true);
    }
    expect(artUrls(["drink-1", "icon", "interior-rain"])).toEqual([
      "/art/interior-rain.webp",
      "/art/drink-1.webp",
    ]);
  });
});

describe("code-drawn fallbacks", () => {
  it("draws every one of the 54 slots and the 6 walk-ins", async () => {
    const slots = [...allFallbackSlots(), ...WALKIN_IDS];
    expect(slots).toHaveLength(60);
    for (const slot of slots) {
      const node = await mountNode(<FallbackArt slot={slot} />);
      const svg = node.querySelector("svg");
      expect(svg, slot).not.toBeNull();
      expect(svg?.getAttribute("data-slot")).toBe(slot);
      expect(svg?.getAttribute("data-known")).toBe("true");
      expect(svg?.querySelectorAll("path, rect, circle, ellipse").length, slot).toBeGreaterThan(3);
      expect(svg?.getAttribute("viewBox")).toMatch(/^0 0 \d+ \d+$/);
      render(null, host as HTMLElement);
    }
    expect(fallbackShape("unknown-slot")).toBeNull();
  });

  it("draws 8 regular busts in 3 expressions with the same framing and different looks", async () => {
    const shapes = new Set<string>();
    for (const regular of REGULARS) {
      for (const face of FACES) {
        const node = await mountNode(<Portrait slot={regular.artPrefix} mood={face} />);
        const svg = node.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 300 400");
        expect(svg?.getAttribute("data-slot")).toBe(`${regular.artPrefix}-${face}`);
        expect(svg?.querySelector(`[data-face='${face}']`)).not.toBeNull();
        shapes.add(svg?.innerHTML ?? "");
        render(null, host as HTMLElement);
      }
    }
    expect(shapes.size).toBe(24);
  });

  it("keeps the identity of a regular across expressions: only the face group changes", async () => {
    const strip = (html: string): string => html.replace(/<g data-face="[a-z]+">[\s\S]*?<\/g>/, "");
    for (const regular of REGULARS) {
      const bodies = new Set<string>();
      for (const face of FACES) {
        const node = await mountNode(<Portrait slot={regular.artPrefix} mood={face} />);
        const facial = node.querySelector("[data-face]")?.outerHTML ?? "";
        bodies.add((node.querySelector("svg")?.innerHTML ?? "").replace(facial, ""));
        render(null, host as HTMLElement);
      }
      expect(bodies.size, regular.name).toBe(1);
    }
    expect(strip('<g data-face="happy"><path/></g>x')).toBe("x");
  });

  it("draws 6 walk-in silhouettes in 3 expressions", async () => {
    const seen = new Set<string>();
    for (const id of WALKIN_IDS) {
      for (const face of FACES) {
        const node = await mountNode(<Portrait slot={id} mood={face} />);
        expect(node.querySelector(`[data-walkin='${id}']`)).not.toBeNull();
        expect(node.querySelector(`[data-face='${face}']`)).not.toBeNull();
        seen.add(node.querySelector("svg")?.innerHTML ?? "");
        render(null, host as HTMLElement);
      }
    }
    expect(seen.size).toBe(18);
  });

  it("draws 16 item icons and 8 decor objects, each different", async () => {
    const seen = new Set<string>();
    const ids = [
      ...Array.from({ length: 6 }, (_, i) => `drink-${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `pastry-${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `book-${i + 1}`),
      ...DECOR.map((rule) => rule.id),
    ];
    expect(ids).toHaveLength(24);
    for (const id of ids) {
      const node = await mountNode(<ItemIcon slot={id} label={id} />);
      expect(node.querySelector("svg[role='img']")?.getAttribute("aria-label")).toBe(id);
      seen.add(node.querySelector("svg")?.innerHTML ?? "");
      render(null, host as HTMLElement);
    }
    expect(seen.size).toBe(24);
  });

  it("draws three interiors with the arched window and only the rain one has streaks", async () => {
    for (const weather of ["morning", "evening", "rain"] as const) {
      const node = await mountNode(<FallbackArt slot={interiorSlot(weather)} />);
      const svg = node.querySelector("svg");
      expect(svg?.getAttribute("viewBox")).toBe("0 0 400 600");
      expect(svg?.querySelector(`[data-weather='${weather}']`)).not.toBeNull();
      expect(svg?.innerHTML).toContain("A104 104 0 0 1");
      expect((svg?.querySelectorAll(".tlw-rain").length ?? 0) > 0).toBe(weather === "rain");
      render(null, host as HTMLElement);
    }
  });

  it("stops the rain streaks under reduced motion in the stylesheet", async () => {
    const { GAME_CSS } = await import("./helpers");
    expect(GAME_CSS).toMatch(/\.tlw-rain\s*\{[^}]*animation:\s*tlw-rain/);
    expect(GAME_CSS).toMatch(
      /html\[data-motion="reduced"\]\s*\*[\s\S]*?animation:\s*none\s*!important/,
    );
    expect(GAME_CSS).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.tlw-rain/);
  });

  it("paints only with palette tokens or mixes of them", async () => {
    const allowed = new Set([...FALLBACK_COLORS].map((color) => color.toLowerCase()));
    const slots = [...allFallbackSlots(), ...WALKIN_IDS];
    for (const slot of slots) {
      const node = await mountNode(<FallbackArt slot={slot} />);
      const colors = Array.from(node.querySelectorAll("[fill], [stroke], [stop-color]")).flatMap(
        (el) => ["fill", "stroke", "stop-color"].map((name) => el.getAttribute(name)),
      );
      for (const color of colors) {
        if (!color || color === "none" || color.startsWith("url(")) continue;
        expect(HEX.test(color), `${slot} ${color}`).toBe(true);
        expect(allowed.has(color.toLowerCase()), `${slot} ${color}`).toBe(true);
      }
      render(null, host as HTMLElement);
    }
  });

  it("uses no text in the drawings, so no glyph can fall back to a platform font", async () => {
    for (const slot of allFallbackSlots()) {
      const node = await mountNode(<FallbackArt slot={slot} />);
      expect(node.querySelector("text, tspan"), slot).toBeNull();
      render(null, host as HTMLElement);
    }
  });
});

describe("image slots", () => {
  it("renders an img when the manifest lists the slot, in every component", async () => {
    const manifest = ["customer-1-happy", "drink-2", "interior-rain", "decor-3", "key-art"];
    const node = await mountNode(
      <ArtContext.Provider value={manifest}>
        <Portrait slot="customer-1" mood="happy" label="Odile" />
        <Portrait slot="customer-1" mood="sad" />
        <ItemIcon slot="drink-2" label="Tide Latte" />
        <ItemIcon slot="drink-1" />
        <Backdrop slot="interior-rain" owned={["decor-3", "decor-1"]} />
        <Backdrop slot="key-art" />
      </ArtContext.Provider>,
    );
    const imgs = Array.from(node.querySelectorAll("img"));
    expect(imgs.map((img) => img.getAttribute("src"))).toEqual([
      "/art/customer-1-happy.webp",
      "/art/drink-2.webp",
      "/art/interior-rain.webp",
      "/art/decor-3.webp",
      "/art/key-art.webp",
    ]);
    expect(imgs[0]?.getAttribute("alt")).toBe("Odile");
    expect(node.querySelector("svg[data-slot='customer-1-sad']")).not.toBeNull();
    expect(node.querySelector("svg[data-slot='drink-1']")).not.toBeNull();
    expect(node.querySelector("svg[data-slot='decor-1']")).not.toBeNull();
    expect(node.querySelector("[data-slot='interior-rain']")?.getAttribute("data-art")).toBe(
      "image",
    );
  });

  it("places each decor item at its own fixed spot", () => {
    expect(Object.keys(DECOR_SPOTS).sort()).toEqual(DECOR.map((rule) => rule.id).sort());
    const spots = new Set(Object.values(DECOR_SPOTS).map((spot) => spot.join(",")));
    expect(spots.size).toBe(8);
  });

  it("renders a complete game with an empty manifest: every screen draws only fallbacks", async () => {
    rig = await mountApp({
      route: ["shop"],
      profile: { day: 15, owned: ["decor-1", "decor-8"] },
      artManifest: [],
    });
    const container = rig.container;
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("svg[data-art='fallback']").length).toBeGreaterThan(10);
    expect(q(container, ".tlw-preview [data-art='fallback']")).toBeTruthy();
    expect(container.querySelectorAll(".tlw-preview .tlw-decor")).toHaveLength(2);
  });

  it("renders an img through the app when the app manifest lists the slot", async () => {
    rig = await mountApp({
      route: ["day", { day: 1 }],
      artManifest: ["customer-1-neutral", "interior-morning"],
    });
    const srcs = Array.from(rig.container.querySelectorAll("img")).map((img) =>
      img.getAttribute("src"),
    );
    expect(srcs).toContain("/art/customer-1-neutral.webp");
    expect(srcs).toContain("/art/interior-morning.webp");
  });

  it("renders every screen with the full shipped manifest and the code-drawn fallback gone", async () => {
    rig = await mountApp({ route: ["shop"], profile: { day: 15, owned: ["decor-1", "decor-8"] } });
    const container = rig.container;
    expect(container.querySelectorAll("img").length).toBeGreaterThan(10);
    expect(container.querySelectorAll(".tlw-preview .tlw-decor img")).toHaveLength(2);
    expect(q(container, ".tlw-preview [data-art='image']")).toBeTruthy();
  });

  it("renders a partial manifest: images where listed, fallbacks elsewhere, same layout", async () => {
    const partial = ["interior-evening", "drink-1", "customer-2-neutral"];
    const node = await mountNode(
      <ArtContext.Provider value={partial}>
        <Backdrop slot="interior-evening" owned={["decor-1"]} />
        <Backdrop slot="interior-rain" />
        <ItemIcon slot="drink-1" />
        <ItemIcon slot="drink-2" />
        <Portrait slot="customer-1" />
        <Portrait slot="customer-2" />
      </ArtContext.Provider>,
    );
    const kinds = Array.from(node.querySelectorAll(".tlw-backdrop, .tlw-icon, .tlw-portrait")).map(
      (el) => `${el.getAttribute("data-slot")}:${el.getAttribute("data-art")}`,
    );
    expect(kinds).toEqual([
      "interior-evening:image",
      "decor-1:fallback",
      "interior-rain:fallback",
      "drink-1:image",
      "drink-2:fallback",
      "customer-1-neutral:fallback",
      "customer-2-neutral:image",
    ]);
  });

  it("falls back from a missing happy or sad bust to the neutral image, then to the drawing", async () => {
    const neutralOnly = ["customer-1-neutral", "customer-2-neutral", "customer-2-happy"];
    expect(bustImageSlot("customer-2", "happy", neutralOnly)).toBe("customer-2-happy");
    expect(bustImageSlot("customer-2", "sad", neutralOnly)).toBe("customer-2-neutral");
    expect(bustImageSlot("customer-1", "happy", neutralOnly)).toBe("customer-1-neutral");
    expect(bustImageSlot("customer-3", "sad", neutralOnly)).toBe("customer-3-sad");
    expect(bustImageSlot("customer-3", "neutral", neutralOnly)).toBe("customer-3-neutral");
    expect(bustImageSlot("walkin-umbrella", "happy", neutralOnly)).toBe("walkin-umbrella");
    const node = await mountNode(
      <ArtContext.Provider value={neutralOnly}>
        <Portrait slot="customer-1" mood="sad" />
        <Portrait slot="customer-3" mood="happy" />
      </ArtContext.Provider>,
    );
    expect(node.querySelector("img")?.getAttribute("src")).toBe("/art/customer-1-neutral.webp");
    const drawn = node.querySelector("svg[data-slot]");
    expect(drawn?.getAttribute("data-slot")).toBe("customer-3-happy");
    expect(drawn?.querySelector("[data-face='happy']")).not.toBeNull();
  });

  it("sizes decor images at 256 and item images at 192", async () => {
    const node = await mountNode(
      <ArtContext.Provider value={["decor-2", "book-1"]}>
        <ItemIcon slot="decor-2" />
        <ItemIcon slot="book-1" />
      </ArtContext.Provider>,
    );
    const sizes = Array.from(node.querySelectorAll("img")).map((img) => img.getAttribute("width"));
    expect(sizes).toEqual(["256", "192"]);
  });

  it("keeps the runtime art folder aligned with the manifest", () => {
    const dir = join(import.meta.dirname, "../public");
    const art = existsSync(join(dir, "art")) ? readdirSync(join(dir, "art")) : [];
    expect(art.filter((name) => name.endsWith(".webp")).length).toBe(ART_MANIFEST.length);
    expect(readFileSync(join(import.meta.dirname, "../src/art/manifest.ts"), "utf8")).toContain(
      "ART_MANIFEST",
    );
  });
});
