import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ECLIPSE_SEQUENCE_MS } from "../../src/screens/EclipseSequence";
import { hitRadiusUnits, mapScale } from "../../src/sky/geometry";
import { ANNOUNCE_INTERVAL_MS, createAnnouncer } from "../../src/ui/announcer";
import { contrastRatio } from "../../src/ui/contrast";
import { appCss } from "../../src/ui/styles";
import { PALETTE, textPairs, tokensFor } from "../../src/ui/tokens";
import { declarations, declared } from "./css";
import { cleanup, goTab, openScreen, type Rendered, renderApp } from "./harness";

afterEach(cleanup);

describe("contrast", () => {
  for (const high of [false, true]) {
    const pairs = textPairs(tokensFor(high), high);
    describe(high ? "high contrast tokens" : "default tokens", () => {
      for (const pair of pairs) {
        it(`${pair.name} (${pair.foreground} on ${pair.background}) is at least 4.5:1`, () => {
          expect(contrastRatio(pair.foreground, pair.background)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }

  it("matches the ratios recorded in the art bible", () => {
    const onBackground = (hex: string) => contrastRatio(hex, PALETTE.ink900);
    expect(onBackground(PALETTE.parchment)).toBeGreaterThan(14);
    expect(onBackground(PALETTE.parchmentDim)).toBeGreaterThan(9);
    expect(onBackground(PALETTE.gold)).toBeGreaterThan(7.9);
    expect(contrastRatio(PALETTE.ink950, PALETTE.gold)).toBeGreaterThan(8.5);
  });

  it("high contrast puts parchment on solid navy", () => {
    const tokens = tokensFor(true);
    expect(tokens.colorBackground).toBe(tokens.colorSurface);
    expect(tokens.colorSurface).toBe(tokens.colorSurfaceRaised);
    expect(contrastRatio(tokens.colorText, tokens.colorSurface)).toBeGreaterThan(15);
  });
});

describe("stylesheet", () => {
  it("declares at least 44px on the interactive classes", () => {
    for (const selector of [".co-btn", ".co-tab", ".co-chip"]) {
      expect(declared(appCss, selector, "min-height")).toBeGreaterThanOrEqual(44);
      expect(declared(appCss, selector, "min-width")).toBeGreaterThanOrEqual(44);
    }
  });

  it("sizes every font in rem and never below 0.875rem", () => {
    const sizes = declarations(appCss, "font-size");
    expect(sizes.length).toBeGreaterThan(20);
    for (const size of sizes) {
      expect(size, size).toMatch(/^\d+(\.\d+)?rem$/);
      expect(Number.parseFloat(size)).toBeGreaterThanOrEqual(0.875);
    }
  });

  it("switches animations off for the setting and for the system preference", () => {
    expect(appCss).toContain(".co-reduced *");
    expect(appCss).toContain("prefers-reduced-motion: reduce");
    expect(appCss).toContain("env(safe-area-inset");
  });
});

function accessibleName(element: Element): string {
  const label = element.getAttribute("aria-label");
  if (label?.trim()) return label.trim();
  return (element.textContent ?? "").trim();
}

async function expectNamed(r: Rendered): Promise<void> {
  const controls = r.qa("button, [role='tab'], [role='switch'], [role='button']");
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(accessibleName(control), control.outerHTML.slice(0, 120)).not.toBe("");
  }
}

describe("accessible names", () => {
  it("every control on every tab and screen has a name", async () => {
    const r = await renderApp({ seed: "late" });
    for (const tab of ["observe", "build", "atlas", "eclipse", "journal"] as const) {
      await goTab(r, tab);
      await expectNamed(r);
    }
    for (const screen of ["achievements", "statistics", "settings", "howto", "comet"] as const) {
      await openScreen(r, screen);
      await expectNamed(r);
      r.router.pop();
      await r.flush();
    }
    await r.unmount();
    const title = await renderApp({ seed: "mid", start: "title" });
    await expectNamed(title);
  });

  it("the stars of a chart are named with their position and state", async () => {
    const r = await renderApp({ seed: { game: { starlight: 120000, owned: { orrery: 12 } } } });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='harp'] .co-card-atlas__action"));
    expect(r.qa("[data-star]")).toHaveLength(7);
    expect(r.q("[data-star='0']").getAttribute("aria-label")).toBe("Star 1 of 7, next");
    await r.click(r.q("[data-star='0']"));
    await r.click(r.q("[data-star='1']"));
    expect(r.q("[data-star='0']").getAttribute("aria-label")).toBe("Star 1 of 7, done");
    expect(r.q("[data-star='2']").getAttribute("aria-label")).toBe("Star 3 of 7, next");
    expect(r.q("[data-star='3']").getAttribute("aria-label")).toBe("Star 4 of 7");
    expect(r.q("[data-board] svg.co-sky__map").getAttribute("aria-label")).toBe(
      "Star map for The Harp",
    );
  });

  it("large numbers carry a spoken label", async () => {
    const r = await renderApp({ seed: { game: { starlight: 1.2e6 } } });
    const header = r.q(".co-header .co-num");
    expect(header.textContent).toBe("1.20M");
    expect(header.getAttribute("aria-label")).toBe("1.2 million starlight");
  });
});

describe("live region", () => {
  it("announces the starlight total at most once every 5 seconds", async () => {
    const r = await renderApp({});
    const live = () => r.q("[data-live='starlight']");
    expect(live().getAttribute("aria-live")).toBe("polite");
    expect(live().textContent).toBe("Starlight: 10");
    await r.click(r.q(".co-gather"));
    expect(live().textContent).toBe("Starlight: 10");
    r.harness.clock.advance(ANNOUNCE_INTERVAL_MS - 1);
    await r.click(r.q(".co-gather"));
    expect(live().textContent).toBe("Starlight: 10");
    r.harness.clock.advance(1);
    await r.click(r.q(".co-gather"));
    expect(live().textContent).toBe("Starlight: 13");
    await r.click(r.q(".co-gather"));
    expect(live().textContent).toBe("Starlight: 13");
  });

  it("createAnnouncer throttles and ignores unchanged text", () => {
    let now = 0;
    const announcer = createAnnouncer(() => now, 5000);
    expect(announcer.update("a")).toBe("a");
    now = 4999;
    expect(announcer.update("b")).toBe("a");
    now = 5000;
    expect(announcer.update("b")).toBe("b");
    now = 5001;
    expect(announcer.update("b")).toBe("b");
    now = 10000;
    expect(announcer.update("b")).toBe("b");
    expect(announcer.update("c")).toBe("c");
  });
});

describe("chart targets", () => {
  const seed = { game: { starlight: 100, owned: { telescope: 2 } } };

  async function openLyre(options: { reduced?: boolean } = {}): Promise<Rendered> {
    const r = await renderApp({
      seed,
      props: { systemReducedMotion: () => options.reduced ?? false },
    });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    return r;
  }

  it("the next star has a ring and a number badge; the others have no ring", async () => {
    const r = await openLyre();
    const next = r.q("[data-star='0']");
    expect(next.querySelector(".co-ring")).not.toBeNull();
    expect(next.querySelector(".co-badge")).not.toBeNull();
    expect(next.querySelector(".co-badge__n")?.textContent).toBe("1");
    expect(r.q("[data-star='1']").querySelector(".co-ring")).toBeNull();
    expect(r.q("[data-star='1'] .co-badge__n").textContent).toBe("2");
    await r.click(next);
    expect(r.q("[data-star='0']").querySelector(".co-ring")).toBeNull();
    expect(r.q("[data-star='1']").querySelector(".co-ring")).not.toBeNull();
    expect(r.q("[data-star='0']").getAttribute("data-state")).toBe("done");
  });

  it("is operable from the keyboard", async () => {
    const r = await openLyre();
    const star = r.q("[data-star='0']");
    expect(star.getAttribute("tabindex")).toBe("0");
    star.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await r.flush();
    expect(r.q("[data-star='1']").getAttribute("data-state")).toBe("next");
  });

  it("hit radius is at least 24 CSS px at any rendered width", () => {
    for (const width of [280, 320, 360, 412, 600, 0]) {
      const scale = width === 0 ? 0.36 : width / 1000;
      expect(hitRadiusUnits(width) * scale).toBeGreaterThanOrEqual(24 - 1e-9);
    }
    expect(mapScale({ left: 0, top: 0, width: 360, height: 504 })).toBeCloseTo(0.36);
    expect(mapScale({ left: 0, top: 0, width: 360, height: 300 })).toBeCloseTo(300 / 1400);
  });

  it("a tap within 24 CSS px of the next star hits it and a tap further away does not", async () => {
    const r = await openLyre();
    const svg = r.q<SVGSVGElement>("[data-board] svg.co-sky__map");
    svg.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        width: 360,
        height: 504,
        right: 370,
        bottom: 524,
        x: 10,
        y: 20,
      }) as DOMRect;
    const tap = async (dx: number) => {
      const scale = 0.36;
      const event = new MouseEvent("click", {
        bubbles: true,
        clientX: 10 + 300 * scale + dx,
        clientY: 20 + 400 * scale,
      });
      await act(() => {
        svg.dispatchEvent(event);
      });
    };
    await tap(26);
    expect(r.q("[data-star='0']").getAttribute("data-state")).toBe("next");
    await tap(23);
    expect(r.q("[data-star='0']").getAttribute("data-state")).toBe("done");
    expect(r.q("[data-star='1']").getAttribute("data-state")).toBe("next");
  });

  it("reduced motion removes the twinkle and every animation class", async () => {
    const calm = await openLyre({ reduced: true });
    await calm.click(calm.q('[data-star="3"]'));
    expect(calm.q(".co-app").classList.contains("co-reduced")).toBe(true);
    for (const cls of [".co-twinkle", ".co-pulse", ".co-shake", ".co-line--new", ".co-pop"]) {
      expect(calm.container.querySelector(cls), cls).toBeNull();
    }
    expect(calm.q('[data-star="3"]').classList.contains("co-star--miss")).toBe(true);
    await calm.unmount();

    const lively = await openLyre();
    await lively.click(lively.q('[data-star="3"]'));
    expect(lively.container.querySelector(".co-twinkle")).not.toBeNull();
    expect(lively.container.querySelector(".co-pulse")).not.toBeNull();
    expect(lively.container.querySelector(".co-shake")).not.toBeNull();
  });

  it("the Observe tab twinkles only when motion is allowed", async () => {
    const lively = await renderApp({});
    expect(lively.container.querySelectorAll(".co-twinkle").length).toBeGreaterThan(0);
    await lively.unmount();
    const calm = await renderApp({ props: { systemReducedMotion: () => true } });
    expect(calm.container.querySelectorAll(".co-twinkle")).toHaveLength(0);
    await calm.click(calm.q(".co-gather"));
    expect(calm.container.querySelector(".co-pop")).toBeNull();
  });

  it("the Eclipse sequence is a still card with reduced motion and ends on its own otherwise", async () => {
    const seed = { game: { starlight: 5e9, cycleStarlight: 4e10 } };
    const calm = await renderApp({ seed, props: { systemReducedMotion: () => true } });
    await goTab(calm, "eclipse");
    await calm.click(calm.q(".co-eclipse-btn"));
    await calm.click(calm.q(".co-eclipse-confirm"));
    expect(calm.q("[data-sheet='eclipse-sequence']").getAttribute("data-still")).toBe("true");
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(calm.container.querySelector("[data-sheet='eclipse-sequence']")).not.toBeNull();
    await calm.click(calm.q("[data-sheet='eclipse-sequence'] button"));
    expect(calm.container.querySelector("[data-sheet='eclipse-sequence']")).toBeNull();
    await calm.unmount();

    const lively = await renderApp({ seed, props: { eclipseMs: 20 } });
    await goTab(lively, "eclipse");
    await lively.click(lively.q(".co-eclipse-btn"));
    await lively.click(lively.q(".co-eclipse-confirm"));
    expect(lively.q("[data-sheet='eclipse-sequence']").getAttribute("data-still")).toBe("false");
    await new Promise((resolve) => setTimeout(resolve, 80));
    await lively.flush();
    expect(lively.container.querySelector("[data-sheet='eclipse-sequence']")).toBeNull();
    expect(ECLIPSE_SEQUENCE_MS).toBeGreaterThan(2000);
  });
});
