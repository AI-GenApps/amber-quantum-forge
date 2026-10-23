import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNoPlatformFontFallback, kitCss } from "@web-games/kit";
import { type DECOR, defaultProfile } from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FAMILIES } from "../src/fonts";
import { resultParams, sceneIds } from "./fixtures";
import { click, clickByText, GAME_CSS, mountApp, press, q, type Rig } from "./helpers";
import { selectSeat } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const HIT = 44;
const INTERACTIVE = "button, [role='switch'], [role='tab'], input, select, textarea, a[href]";

interface Rule {
  selectors: string[];
  decls: Map<string, string>;
}

function parseRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const clean = css
    .replace(/@media[^{]*\{([\s\S]*?\})\s*\}/g, "")
    .replace(/@keyframes[^{]*\{([\s\S]*?\})\s*\}/g, "");
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
    expect(size.w, `${label} width`).toBeGreaterThanOrEqual(HIT);
    expect(size.h, `${label} height`).toBeGreaterThanOrEqual(HIT);
  }
  assertNoPlatformFontFallback(root, { families: FONT_FAMILIES });
}

async function mountRoute(options: Parameters<typeof mountApp>[0]): Promise<HTMLElement> {
  rig?.unmount();
  rig = await mountApp(options);
  return rig.container;
}

const SCENE = sceneIds([1, 1]);
const FULL = {
  day: 15,
  coins: 600,
  late: { ...defaultProfile().late },
  owned: ["decor-1", "decor-5"] as (typeof DECOR)[number]["id"][],
};

describe("the audit itself", () => {
  it("measures real rules and rejects what it should", () => {
    const make = (html: string): HTMLElement => {
      const holder = document.createElement("div");
      holder.innerHTML = html;
      document.body.appendChild(holder);
      return holder.firstElementChild as HTMLElement;
    };
    expect(hitSize(make("<button class='tlw-step'>x</button>"))).toEqual({ w: 44, h: 44 });
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
    ["title", { route: ["title"] }],
    ["home", { route: ["home"], profile: FULL }],
    ["home-pending", { route: ["home"], profile: { day: 2, pendingEvening: SCENE } }],
    ["day", { route: ["day", { day: 3 }] }],
    ["prep", { route: ["prep", { kind: "day", day: 5 }], profile: { day: 5, coins: 100 } }],
    ["prep-late", { route: ["prep", { kind: "late" }], profile: FULL }],
    ["shift", { route: ["shift", { kind: "day", day: 1 }] }],
    ["result", { route: ["result", resultParams({ scenes: SCENE })] }],
    [
      "finale",
      {
        route: ["result", { target: { kind: "day", day: 14 }, summary: null, finale: true }],
        profile: FULL,
      },
    ],
    [
      "scene",
      { route: ["scene", { ids: SCENE, index: 0, after: "home", replay: true }], profile: FULL },
    ],
    ["shop", { route: ["shop"], profile: FULL }],
    ["journal", { route: ["journal"], profile: { ...FULL, diary: [1, 2] } }],
    ["recipes", { route: ["recipes"], profile: FULL }],
    ["late", { route: ["late"], profile: FULL }],
    ["settings", { route: ["settings"] }],
    ["howto", { route: ["howto"] }],
    ["credits", { route: ["credits"] }],
  ];

  it.each(routes)("%s: names, 44 px hit areas and bundled fonts", async (name, options) => {
    const container = await mountRoute(options);
    if (name === "scene") await press(q(container, "[data-testid='dialogue']"), "Enter");
    if (name === "title") {
      assertNoPlatformFontFallback(container, { families: FONT_FAMILIES });
      return;
    }
    auditChrome(container, name);
    expect(container.querySelectorAll("img"), `${name}: empty manifest`).toHaveLength(0);
  });

  it("audits the scene choice and done cards too", async () => {
    const choiceScene = sceneIds([1, 3]);
    const container = await mountRoute({
      route: ["scene", { ids: choiceScene, index: 0, after: "home", replay: true }],
      profile: FULL,
    });
    for (let guard = 0; guard < 40 && !container.querySelector("[data-testid='choice']"); guard++) {
      await press(q(container, "[data-testid='dialogue']"), "Enter");
    }
    auditChrome(container, "scene-choice");
    await click(q(container, "[data-testid='choice'] button"));
    for (
      let guard = 0;
      guard < 40 && !container.querySelector("[data-testid='scene-done']");
      guard++
    ) {
      await press(q(container, "[data-testid='dialogue']"), "Enter");
    }
    auditChrome(container, "scene-done");
  });

  it("every button on every audited screen has a visible or aria name", async () => {
    for (const [, options] of routes.slice(1)) {
      const container = await mountRoute(options);
      for (const button of container.querySelectorAll("button")) {
        expect(accessibleName(button).length).toBeGreaterThan(0);
        expect(button.getAttribute("type")).toBe("button");
      }
    }
  });
});

describe("every sheet", () => {
  it("pause, quit and serve-empty keep names, hit areas and fonts", async () => {
    const container = await mountRoute({ route: ["shift", { kind: "day", day: 1 }] });
    const game = rig as Rig;
    await game.advance(1100);
    await clickByText(container, "Pause");
    auditChrome(container, "pause");
    await clickByText(container, "Recipe book");
    auditChrome(container, "pause-recipes");
    await clickByText(container, "Quit shift");
    auditChrome(container, "quit");
    await clickByText(container, "Keep playing");
    await clickByText(container, "Resume");
    await selectSeat(game, "Tobias");
    await press(document, " ");
    auditChrome(container, "serve-empty");
  });

  it("purchase and reset sheets keep names, hit areas and fonts", async () => {
    const container = await mountRoute({ route: ["shop"], profile: { day: 4, coins: 100 } });
    await click(q(container, "button[data-decor='decor-1']"));
    auditChrome(container, "purchase");
    await clickByText(container, "Cancel");
    await mountRoute({ route: ["settings"] });
    await clickByText((rig as Rig).container, "Reset progress");
    auditChrome((rig as Rig).container, "reset");
  });

  it("the exit confirmation keeps names, hit areas and fonts", async () => {
    const container = await mountRoute({ route: ["home"] });
    await (rig as Rig).requestExit();
    expect(q(container, "[role='dialog']").textContent).toContain("Leave The Last Window?");
    auditChrome(container, "exit");
    await clickByText(container, "Close game");
    expect((rig as Rig).exits).toBe(1);
  });
});

describe("hit areas and states in the stylesheet", () => {
  it("sizes every custom control at the hit token", () => {
    expect(GAME_CSS).toContain("--wg-hit-min: 44px");
    for (const selector of [
      ".tlw-pick",
      ".tlw-seat",
      ".tlw-step",
      ".tlw-book",
      ".tlw-seg",
      ".tlw-shop__item",
      ".tlw-dialogue",
      ".tlw-plate__discard",
      ".tlw-tray__discard",
    ]) {
      const rule = RULES.find(
        (entry) => entry.selectors.includes(selector) && entry.decls.has("min-width"),
      );
      expect(rule?.decls.get("min-width"), selector).toBe("var(--wg-hit-min)");
      expect(rule?.decls.get("min-height"), selector).toBe("var(--wg-hit-min)");
    }
    expect(kitCss).toMatch(/\.wg-toggle\s*\{[^}]*min-height:\s*48px/);
    expect(kitCss).toMatch(/\.wg-btn\s*\{[^}]*min-width:\s*48px/);
  });

  it("marks selected, low patience and guide states with more than colour", () => {
    expect(GAME_CSS).toMatch(/\.tlw-seat--active\s*\{[^}]*border-width:\s*4px/);
    expect(GAME_CSS).toMatch(/\.tlw-seat--low\s*\{[^}]*border-style:\s*dashed/);
    expect(GAME_CSS).toMatch(/\.tlw-step--guide\s*\{[^}]*border-style:\s*double/);
    expect(GAME_CSS).toMatch(/\.tlw-pick\[aria-pressed="true"\]\s*\{[^}]*border-width:\s*4px/);
    expect(GAME_CSS).toContain('html[data-contrast="high"]');
    expect(GAME_CSS).toContain('html[data-motion="reduced"]');
    expect(GAME_CSS).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid/);
  });
});

describe("live announcements and mood tags", () => {
  it("announces arrivals in a polite live region", async () => {
    const container = await mountRoute({ route: ["shift", { kind: "day", day: 1 }] });
    const live = q(container, "[data-testid='shift-live']");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.getAttribute("aria-live")).toBe("polite");
    await (rig as Rig).advance(1100);
    expect(live.textContent).toContain("Tobias sits at seat 1 and wants Harbour Black.");
  });

  it("writes a numeric patience warning into the live region", async () => {
    const container = await mountRoute({ route: ["shift", { kind: "day", day: 1 }] });
    const game = rig as Rig;
    await game.advance(26500);
    await game.advance(50 * 1000 + 5000);
    expect(q(container, "[data-testid='shift-live']").textContent).toContain(
      "running out of patience",
    );
  });

  it("shows mood tags as an icon plus a word", async () => {
    const container = await mountRoute({ route: ["recipes"], profile: { day: 15 } });
    const chips = Array.from(container.querySelectorAll(".tlw-chip"));
    expect(chips.length).toBeGreaterThan(10);
    for (const chip of chips) {
      expect(chip.querySelector("svg[aria-hidden='true']")).not.toBeNull();
      expect((chip.textContent ?? "").trim().length).toBeGreaterThan(3);
    }
  });
});

describe("source hygiene", () => {
  const srcDir = join(import.meta.dirname, "../src");
  const files = (readdirSync(srcDir, { recursive: true }) as string[])
    .filter((name) => /\.(ts|tsx|css)$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(srcDir, name), "utf8") }));

  it("makes no network call and holds no URL outside the credits file", () => {
    expect(files.length).toBeGreaterThan(60);
    for (const file of files) {
      expect(file.text, file.name).not.toMatch(/\bfetch\s*\(/);
      expect(file.text, file.name).not.toMatch(/XMLHttpRequest/);
      expect(file.text, file.name).not.toMatch(/sendBeacon/);
      expect(file.text, file.name).not.toMatch(/\bWebSocket\b/);
      expect(file.text, file.name).not.toMatch(/\bEventSource\b/);
      if (file.name !== "data/credits.ts") expect(file.text, file.name).not.toMatch(/https?:\/\//);
    }
  });

  it("allows only font licence links in the credits file", () => {
    const credits = files.find((entry) => entry.name === "data/credits.ts");
    const urls = credits?.text.match(/https?:\/\/[^"'`\s)]+/g) ?? [];
    expect(urls.length).toBeGreaterThan(1);
    for (const url of urls) {
      expect(url.startsWith("https://github.com/google/fonts/tree/main/ofl/")).toBe(true);
    }
  });

  it("keeps every source file under 800 lines and avoids any", () => {
    for (const file of files) {
      expect(file.text.split("\n").length, file.name).toBeLessThanOrEqual(800);
      if (file.name.endsWith(".css")) continue;
      expect(file.text, file.name).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });

  it("only uses characters the bundled font subset covers", () => {
    const allowed = /^[ -~ -ÿ–—‘-”•…\n]*$/;
    for (const file of files) {
      if (file.name.endsWith(".css")) continue;
      expect(file.text, file.name).toMatch(allowed);
    }
  });

  it("has no Math.random or Date.now in the app", () => {
    for (const file of files) {
      expect(file.text, file.name).not.toMatch(/\bMath\.random\b/);
      expect(file.text, file.name).not.toMatch(/\bDate\.now\b/);
    }
  });
});
