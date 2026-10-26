import { assertNoPlatformFontFallback, kitCss } from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FAMILIES } from "../src/fonts";
import {
  all,
  buttonByText,
  click,
  GAME_CSS,
  galleryEntry,
  mountApp,
  press,
  q,
  type Rig,
  starsFor,
} from "./helpers";
import { RIV01_LOOK, settle, startBoard, tapPlace } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-contrast");
});

const HIT = 44;
const SLOT_MIN = 88;
const INTERACTIVE =
  "button, [role='switch'], [role='tab'], input, select, textarea, a[href], summary";

interface Rule {
  selectors: string[];
  decls: Map<string, string>;
}

function parseRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const clean = css
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, "")
    .replace(/@media[^{]*\{([\s\S]*?\})\s*\}/g, "");
  for (const match of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map<string, string>();
    for (const part of (match[2] as string).split(";")) {
      const [name, ...value] = part.split(":");
      if (name && value.length) decls.set(name.trim(), value.join(":").trim());
    }
    rules.push({ selectors: (match[1] as string).split(",").map((s) => s.trim()), decls });
  }
  return rules;
}

const RULES = [...parseRules(kitCss), ...parseRules(GAME_CSS)];

function px(value: string | undefined): number | null {
  if (!value) return null;
  if (value.includes("var(--wg-hit-min")) return HIT;
  if (value.endsWith("%")) return 9999;
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  return match ? Number(match[1]) : null;
}

function declared(el: Element, props: string[]): number {
  let best = 0;
  for (const rule of RULES) {
    const applies = rule.selectors.some((selector) => {
      if (selector.includes(":") || selector.includes("[")) return false;
      try {
        return el.matches(selector);
      } catch {
        return false;
      }
    });
    if (!applies) continue;
    for (const prop of props) {
      const value = px(rule.decls.get(prop));
      if (value !== null) best = value;
    }
  }
  const inline = (el as HTMLElement).style;
  for (const prop of props) {
    const value = px(inline.getPropertyValue(prop) || undefined);
    if (value !== null) best = value;
  }
  return best;
}

function hitSize(el: Element): { w: number; h: number } {
  return { w: declared(el, ["min-width", "width"]), h: declared(el, ["min-height", "height"]) };
}

function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label");
  if (label?.trim()) return label.trim();
  const by = el.getAttribute("aria-labelledby");
  if (by) return (document.getElementById(by)?.textContent ?? "").trim();
  return (el.textContent ?? "").trim();
}

function auditChrome(root: HTMLElement, where: string): void {
  const items = Array.from(root.querySelectorAll(INTERACTIVE));
  expect(items.length, `${where}: has controls`).toBeGreaterThan(0);
  for (const el of items) {
    const label = `${where}: <${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}">`;
    expect(accessibleName(el).length, `${label} accessible name`).toBeGreaterThan(0);
    const size = hitSize(el);
    const min = el.classList.contains("dr-slot") ? SLOT_MIN : HIT;
    expect(size.w, `${label} width`).toBeGreaterThanOrEqual(min);
    expect(size.h, `${label} height`).toBeGreaterThanOrEqual(min);
  }
  assertNoPlatformFontFallback(root, { families: FONT_FAMILIES });
}

async function mountRoute(options: Parameters<typeof mountApp>[0]): Promise<HTMLElement> {
  rig?.unmount();
  rig = await mountApp(options);
  return rig.container;
}

const FULL = { stars: starsFor(["riv-01", "riv-02", "riv-03", "riv-04"], 3), coins: 200 };

describe("the audit itself", () => {
  it("measures real rules and rejects what it should", () => {
    const make = (html: string): HTMLElement => {
      const holder = document.createElement("div");
      holder.innerHTML = html;
      document.body.appendChild(holder);
      return holder.firstElementChild as HTMLElement;
    };
    expect(hitSize(make("<button class='dr-piece'>x</button>"))).toEqual({ w: 44, h: 44 });
    expect(hitSize(make("<button class='dr-slot'>x</button>"))).toEqual({ w: 88, h: 88 });
    expect(hitSize(make("<button class='wg-btn'>x</button>"))).toEqual({ w: 48, h: 48 });
    expect(hitSize(make("<button>x</button>"))).toEqual({ w: 0, h: 0 });
    expect(hitSize(make("<button style='min-width:60px;min-height:50px'>x</button>"))).toEqual({
      w: 60,
      h: 50,
    });
    expect(accessibleName(make("<button><svg></svg></button>"))).toBe("");
    expect(accessibleName(make("<button aria-label='Close'><svg></svg></button>"))).toBe("Close");
    const stray = make("<p style='font-family: serif'>plain</p>");
    expect(() => assertNoPlatformFontFallback(stray, { families: FONT_FAMILIES })).toThrow(
      /platform font/,
    );
  });
});

describe("every screen", () => {
  const routes: [string, Parameters<typeof mountApp>[0]][] = [
    ["home", { route: ["home"] }],
    ["chapters", { route: ["chapters"], profile: FULL }],
    ["challenges", { route: ["challenges", { chapter: 0 }], profile: FULL }],
    ["challenges-locked", { route: ["challenges", { chapter: 4 }] }],
    ["styling-locked", { route: ["styling", { challengeId: "riv-05" }] }],
    ["daily", { route: ["daily"], profile: FULL }],
    ["closet", { route: ["closet"], profile: FULL }],
    ["clients", { route: ["clients"], profile: FULL }],
    ["gallery", { route: ["gallery"], profile: { gallery: [galleryEntry(1), galleryEntry(2)] } }],
    ["settings", { route: ["settings"] }],
    ["howto", { route: ["howto"] }],
    ["credits", { route: ["credits"] }],
  ];

  it.each(routes)("%s: names, 44 px hit areas and bundled fonts", async (name, options) => {
    const container = await mountRoute(options);
    auditChrome(container, name);
  });

  it("boot: bundled fonts only", async () => {
    const container = await mountRoute({ route: ["boot"] });
    assertNoPlatformFontFallback(container, { families: FONT_FAMILIES });
  });

  it("styling: board slots at least 88 px, tray cards and tabs at least 44 px", async () => {
    const container = await mountRoute({
      route: ["styling", { challengeId: "riv-01" }],
      profile: FULL,
    });
    auditChrome(container, "styling-brief");
    await startBoard();
    for (const id of RIV01_LOOK.slice(0, 3)) await tapPlace(rig as Rig, id);
    auditChrome(container, "styling");
    const slots = all(container, ".dr-slot");
    expect(slots).toHaveLength(6);
    for (const slot of slots) {
      expect(hitSize(slot)).toEqual({ w: 88, h: 88 });
      expect(slot.getAttribute("aria-label")).toMatch(/slot/);
    }
    expect(all(container, "[role='tab']")).toHaveLength(8);
    expect(
      all(container, ".dr-tray [role='tab']").every((tab) => declared(tab, ["min-width"]) >= HIT),
    ).toBe(true);
  });
});

describe("every sheet", () => {
  it("brief, pause, hint, leave, result and export keep names, hit areas and fonts", async () => {
    const container = await mountRoute({
      route: ["styling", { challengeId: "riv-01" }],
      profile: { coins: 100 },
    });
    const r = rig as Rig;
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    auditChrome(container, "brief");
    await startBoard();

    await click(buttonByText(container, "Pause"));
    auditChrome(container, "pause");
    await click(buttonByText(container, "Resume"));

    await click(buttonByText(container, "Hint"));
    auditChrome(container, "hint");
    await click(buttonByText(container, "Cancel"));

    await tapPlace(r, "item-riviera-7");
    r.app.router.handleBack();
    await r.flush();
    expect(container.textContent).toContain("Leave this look?");
    auditChrome(container, "leave");
    await click(buttonByText(container, "Keep styling"));

    for (const id of RIV01_LOOK.filter((id) => id !== "item-riviera-7")) await tapPlace(r, id);
    await click(buttonByText(container, "Finish look"));
    await settle(r);
    expect(q(container, "[data-testid='result']")).toBeTruthy();
    auditChrome(container, "result");

    await click(buttonByText(container, "Export image"));
    auditChrome(container, "export");
    for (const frame of all(container, ".dr-frame")) {
      expect(frame.getAttribute("aria-pressed")).toMatch(/true|false/);
    }
  });

  it("settings reset confirm and gallery delete confirm keep names and hit areas", async () => {
    const container = await mountRoute({ route: ["settings"] });
    await click(buttonByText(container, "Reset progress"));
    auditChrome(container, "reset-confirm");
    rig?.unmount();
    const gallery = await mountRoute({
      route: ["gallery"],
      profile: { gallery: [galleryEntry(1)] },
    });
    await click(buttonByText(gallery, "Delete"));
    auditChrome(gallery, "delete-confirm");
  });
});

describe("stylesheet rules", () => {
  it("declares the hit token and sizes custom controls with it", () => {
    for (const selector of [".dr-piece", ".dr-frame", ".dr-chapter", ".dr-tile"]) {
      const rule = RULES.find((r) => r.selectors.includes(selector));
      expect(rule?.decls.get("min-width"), selector).toBe("var(--wg-hit-min)");
      expect(
        rule?.decls.get("min-height") === "var(--wg-hit-min)" ||
          px(rule?.decls.get("min-height")) !== null,
        selector,
      ).toBe(true);
    }
    const slot = RULES.find((r) => r.selectors.includes(".dr-slot"));
    expect(slot?.decls.get("min-width")).toBe("88px");
    expect(slot?.decls.get("min-height")).toBe("88px");
    expect(kitCss).toMatch(/\.wg-toggle\s*\{[^}]*min-height:\s*48px/);
    expect(kitCss).toMatch(/\.wg-btn\s*\{[^}]*min-width:\s*48px/);
  });

  it("keeps body text at 16 px and every other text rule at 14 px or more", () => {
    expect(GAME_CSS).toMatch(/body\s*\{[^}]*font-size:\s*16px/);
    const sizes = Array.from(GAME_CSS.matchAll(/font-size:\s*(\d+)px/g)).map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(20);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  });

  it("marks state with more than colour", () => {
    expect(GAME_CSS).toMatch(/\.dr-piece\[data-selected="true"\]\s*\{[^}]*border-width:\s*4px/);
    expect(GAME_CSS).toMatch(/\.dr-slot\[data-selected="true"\]\s*\{[^}]*outline:\s*4px/);
    expect(GAME_CSS).toMatch(/\.dr-frame\[aria-pressed="true"\]\s*\{[^}]*border-width:\s*4px/);
    expect(GAME_CSS).toContain(
      '[data-contrast="high"] .dr-swatch { background-image: repeating-linear-gradient',
    );
    expect(GAME_CSS).toContain(
      '[data-contrast="high"] .dr-glyph [stroke-width] { stroke-width: 4px; }',
    );
    expect(GAME_CSS).toContain('[data-motion="reduced"] *');
  });
});

describe("accessible board", () => {
  it("announces placements through a polite live region", async () => {
    const container = await mountRoute({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    const live = q(container, "[data-testid='live']");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.getAttribute("aria-live")).toBe("polite");
    await tapPlace(rig as Rig, "item-riviera-7");
    expect(live.textContent).toBe(
      "Hat: Wide-Brim Sun Hat placed. Rules met 2 of 2. Harmony 94. Now met: A shade piece.",
    );
  });

  it("gives every rule chip an icon, text and a hidden state word", async () => {
    const container = await mountRoute({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    const words = (): (string | null | undefined)[] =>
      all(container, ".dr-chips .dr-chip").map(
        (chip) => chip.querySelector(".dr-sr-only")?.textContent,
      );
    expect(words()).toEqual(["Not checked yet", "Not checked yet"]);
    await tapPlace(rig as Rig, "item-rainy-city-3");
    const chips = all(container, ".dr-chips .dr-chip");
    expect(chips).toHaveLength(2);
    for (const chip of chips) {
      expect(chip.querySelector("svg[data-icon]")).not.toBeNull();
      expect((chip.querySelector(".dr-chip__text")?.textContent ?? "").length).toBeGreaterThan(3);
      expect(chip.querySelector(".dr-sr-only")?.textContent).toMatch(/^(Met|Not met)$/);
    }
    expect(words()).toEqual(["Met", "Not met"]);
  });

  it("names tray pieces with colour, era, formality, warmth and price", async () => {
    const container = await mountRoute({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    const hat = q(container, ".dr-piece");
    expect(hat.getAttribute("aria-label")).toBe(
      "Breton Stripe Tee, white, now, formality 2, warmth 1, $38",
    );
    await press(hat, "Tab");
  });

  it("swaps to the high contrast palette and thicker outlines", async () => {
    const container = await mountRoute({
      route: ["styling", { challengeId: "riv-01" }],
      settings: { highContrast: true },
    });
    await startBoard();
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.style.getPropertyValue("--wg-color-text-muted")).toBe(
      "#f6efe4",
    );
    expect(container.querySelector(".dr-swatch")).not.toBeNull();
  });
});
