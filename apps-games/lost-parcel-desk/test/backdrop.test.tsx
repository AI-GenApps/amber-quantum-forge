import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { BACKDROP_SCRIM, Backdrop, backdropFor } from "../src/art/Backdrop";
import { ART_MANIFEST } from "../src/art/manifest";
import { SLOT_IDS } from "../src/art/slots";
import { contrastRatio, parseHex } from "../src/theme/contrast";
import { DESK_THEMES } from "../src/theme/deskThemes";
import { mountApp, q, qa, type Rig, type RouteInit } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function draw(vnode: Parameters<typeof render>[0]): Promise<HTMLElement> {
  const el = document.createElement("div");
  document.body.appendChild(el);
  await act(() => render(vnode, el));
  return el;
}

const hex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

describe("Backdrop", () => {
  it("shows the image under a scrim when the manifest lists the slot", async () => {
    const el = await draw(<Backdrop slot="desk-backdrop" manifest={["desk-backdrop"]} />);
    const node = q(el, ".lp-backdrop");
    expect(node.getAttribute("data-art")).toBe("image");
    expect(node.getAttribute("aria-hidden")).toBe("true");
    expect(node.style.backgroundImage).toContain("/art/desk-backdrop.webp");
    expect(q(el, ".lp-backdrop__scrim").style.opacity).toBe(String(BACKDROP_SCRIM));
  });

  it("covers the image completely in high contrast", async () => {
    const el = await draw(<Backdrop slot="desk-backdrop" manifest={["desk-backdrop"]} plain />);
    expect(q(el, ".lp-backdrop__scrim").style.opacity).toBe("1");
  });

  it("is empty without art so the screen colour shows and nothing moves", async () => {
    const el = await draw(<Backdrop slot="key-art" manifest={[]} />);
    const node = q(el, ".lp-backdrop");
    expect(node.getAttribute("data-art")).toBe("fallback");
    expect(node.style.backgroundImage).toBe("");
    expect(node.children).toHaveLength(0);
  });

  it("uses the shipped manifest by default: desk-backdrop is present, key-art is rejected", async () => {
    const desk = await draw(<Backdrop slot="desk-backdrop" />);
    expect(q(desk, ".lp-backdrop").getAttribute("data-art")).toBe("image");
    const title = await draw(<Backdrop slot="key-art" />);
    expect(q(title, ".lp-backdrop").getAttribute("data-art")).toBe("fallback");
  });

  it("maps the title routes to key-art and the case routes to the desk backdrop", () => {
    expect(backdropFor("home")).toBe("key-art");
    expect(backdropFor("boot")).toBe("key-art");
    for (const route of ["table", "viewer", "board"])
      expect(backdropFor(route)).toBe("desk-backdrop");
    for (const route of ["files", "intro", "reveal", "settings", "credits"]) {
      expect(backdropFor(route), route).toBeNull();
    }
  });
});

const IMAGE_ROUTES: ReadonlyArray<[string, RouteInit, string]> = [
  ["home", ["home"], "key-art"],
  ["table", ["table", { caseId: "01" }], "desk-backdrop"],
  ["board", ["board", { caseId: "01" }], "desk-backdrop"],
];

describe("screens with zero, some and all art", () => {
  it("renders every screen with an empty manifest and never shows an image", async () => {
    for (const [name, route] of [
      ["home", ["home"]],
      ["files", ["files"]],
      ["intro", ["intro", { caseId: "01" }]],
      ["table", ["table", { caseId: "01" }]],
      ["board", ["board", { caseId: "01" }]],
      ["credits", ["credits"]],
    ] as ReadonlyArray<[string, RouteInit]>) {
      rig = await mountApp({ route, artManifest: [] });
      await rig.flush();
      expect(rig.container.querySelector(`[data-screen='${name}']`), name).not.toBeNull();
      expect(rig.container.querySelector("img[data-art='image']"), name).toBeNull();
      expect(rig.container.querySelector(".lp-backdrop__scrim"), name).toBeNull();
      expect(rig.container.querySelector(".lp-app")?.getAttribute("data-backdrop"), name).toBe(
        "none",
      );
      rig.unmount();
      rig = null;
    }
  });

  it("puts the scene art behind the title, the table and the board when the manifest is full", async () => {
    for (const [name, route, slot] of IMAGE_ROUTES) {
      rig = await mountApp({ route, artManifest: [...SLOT_IDS] });
      await rig.flush();
      const backdrop = q(rig.container, ".lp-backdrop");
      expect(backdrop.getAttribute("data-slot"), name).toBe(slot);
      expect(backdrop.getAttribute("data-art"), name).toBe("image");
      expect(rig.container.querySelector(".lp-app")?.getAttribute("data-backdrop"), name).toBe(
        "image",
      );
      rig.unmount();
      rig = null;
    }
  });

  it("keeps the title code-drawn while key-art is missing from the shipped manifest", async () => {
    rig = await mountApp({ route: ["home"] });
    await rig.flush();
    expect(ART_MANIFEST).not.toContain("key-art");
    expect(q(rig.container, ".lp-backdrop").getAttribute("data-art")).toBe("fallback");
    expect(rig.container.querySelector("[data-screen='home']")).not.toBeNull();
  });

  it("uses the evidence images, the open parcel and the portraits on the table and the board", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }], artManifest: [...SLOT_IDS] });
    await rig.flush();
    const slots = qa(rig.container, "img[data-art='image']").map((n) =>
      n.getAttribute("data-slot"),
    );
    expect(slots).toContain("parcel-open");
    for (const id of ["evidence-postcard", "evidence-01-2", "evidence-01-3", "evidence-01-4"]) {
      expect(slots, id).toContain(id);
    }
    rig.unmount();
    rig = await mountApp({ route: ["board", { caseId: "01" }], artManifest: [...SLOT_IDS] });
    await rig.flush();
    const folk = qa(rig.container, "img[data-slot^='townsfolk-']");
    expect(folk.length).toBeGreaterThan(0);
    expect(folk[0]?.getAttribute("src")).toMatch(/^\/art\/townsfolk-\d+\.webp$/);
  });

  it("mixes: the listed slots are images and the others keep their drawings", async () => {
    rig = await mountApp({
      route: ["table", { caseId: "01" }],
      artManifest: ["evidence-01-2", "parcel-open"],
    });
    await rig.flush();
    expect(rig.container.querySelector("img[data-slot='evidence-01-2']")).not.toBeNull();
    expect(rig.container.querySelector("img[data-slot='evidence-postcard']")).toBeNull();
    expect(rig.container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(q(rig.container, ".lp-backdrop").getAttribute("data-art")).toBe("fallback");
  });

  it("plain high contrast covers the art completely", async () => {
    rig = await mountApp({
      route: ["table", { caseId: "01" }],
      artManifest: [...SLOT_IDS],
      settings: { highContrast: true },
    });
    await rig.flush();
    expect(q(rig.container, ".lp-backdrop__scrim").style.opacity).toBe("1");
  });
});

describe("backdrop legibility", () => {
  it("keeps text and muted text readable on every desk theme over the extreme backdrop pixels", async () => {
    const file = join(import.meta.dirname, "../public/art/desk-backdrop.webp");
    const { data } = await sharp(readFileSync(file))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let lightest = hex(0, 0, 0);
    let darkest = hex(255, 255, 255);
    let hi = -1;
    let lo = 256;
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i] as number;
      const g = data[i + 1] as number;
      const b = data[i + 2] as number;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luma > hi) {
        hi = luma;
        lightest = hex(r, g, b);
      }
      if (luma < lo) {
        lo = luma;
        darkest = hex(r, g, b);
      }
    }
    const mix = (art: string, bg: string): string => {
      const a = parseHex(art);
      const b = parseHex(bg);
      const part = (k: number): number =>
        Math.round((a[k] as number) + ((b[k] as number) - (a[k] as number)) * BACKDROP_SCRIM);
      return hex(part(0), part(1), part(2));
    };
    for (const theme of Object.values(DESK_THEMES)) {
      for (const art of [lightest, darkest]) {
        const under = mix(art, theme.background);
        expect(
          contrastRatio(theme.text, under),
          `${theme.id} text over ${art}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(theme.muted, under),
          `${theme.id} muted over ${art}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
