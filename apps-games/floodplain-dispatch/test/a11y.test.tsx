import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getMap } from "@web-games/floodplain-dispatch-core";
import { assertNoPlatformFontFallback, kitCss } from "@web-games/kit";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_FAMILIES } from "../src/fonts";
import { GAME_CSS, mountApp, press, q, type Rig, starsFor, VALLEY_IDS } from "./helpers";
import { clickByText, Pilot } from "./pilot";

let rig: Rig | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const HIT = 44;
const INTERACTIVE = "button, [role='switch'], [role='tab'], input, select, textarea, a[href]";

interface Rule {
  selectors: string[];
  decls: Map<string, string>;
}

function parseRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const clean = css.replace(/@media[^{]*\{([\s\S]*?\})\s*\}/g, "");
  for (const match of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map<string, string>();
    for (const part of (match[2] as string).split(";")) {
      const [name, ...value] = part.split(":");
      if (name && value.length) decls.set(name.trim(), value.join(":").trim());
    }
    rules.push({
      selectors: (match[1] as string).split(",").map((s) => s.trim()),
      decls,
    });
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

const FULL = { stars: starsFor(VALLEY_IDS, 3), coins: 200 };

describe("the audit itself", () => {
  it("measures real rules and rejects what it should", () => {
    const make = (html: string): HTMLElement => {
      const holder = document.createElement("div");
      holder.innerHTML = html;
      document.body.appendChild(holder);
      return holder.firstElementChild as HTMLElement;
    };
    expect(hitSize(make("<button class='fd-tool fd-hit'>x</button>"))).toEqual({ w: 44, h: 44 });
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
    ["regions", { route: ["regions"], profile: FULL }],
    ["levels", { route: ["levels", { region: "valley" }], profile: FULL }],
    ["daily", { route: ["daily"], profile: FULL }],
    ["themes", { route: ["themes"], profile: FULL }],
    ["records", { route: ["records"], profile: FULL }],
    ["settings", { route: ["settings"] }],
    ["howto", { route: ["howto"] }],
    ["credits", { route: ["credits"] }],
    ["board", { route: ["board", { mapId: "v01" }] }],
    ["board-locked", { route: ["board", { mapId: "v09" }] }],
  ];

  it.each(routes)("%s: names, 44 px hit areas and bundled fonts", async (name, options) => {
    const container = await mountRoute(options);
    auditChrome(container, name);
  });

  it("boot: bundled fonts only", async () => {
    const container = await mountRoute({ route: ["boot"] });
    assertNoPlatformFontFallback(container, { families: FONT_FAMILIES });
  });
});

describe("every sheet", () => {
  it("pause, hint, exit confirm, inspector and result keep names, hit areas and fonts", async () => {
    const container = await mountRoute({
      route: ["board", { mapId: "v01" }],
      profile: { coins: 100 },
    });
    const pilot = new Pilot(rig as Rig, "v01");
    await clickByText(rig as Rig, "Pause menu");
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    auditChrome(container, "pause");
    await clickByText(rig as Rig, "Resume");

    await clickByText(rig as Rig, "Hint");
    auditChrome(container, "hint");
    await clickByText(rig as Rig, "Cancel");

    await pilot.place({ x: 1, y: 1, kind: "canal" });
    await press(pilot.host, "Enter");
    auditChrome(container, "inspector");
    await clickByText(rig as Rig, "Done");

    rig?.app.router.handleBack();
    await rig?.flush();
    expect(container.textContent).toContain("Leave this map?");
    auditChrome(container, "exit");
    await clickByText(rig as Rig, "Stay");

    await press(pilot.host, " ");
    await clickByText(rig as Rig, "See result");
    expect(q(container, "[data-testid='result']")).toBeTruthy();
    auditChrome(container, "result");
    await clickByText(rig as Rig, "Edit plan");

    await press(pilot.host, " ");
    auditChrome(container, "playback");
  });

  it("settings reset confirm keeps names and hit areas", async () => {
    const container = await mountRoute({ route: ["settings"] });
    await clickByText(rig as Rig, "Reset progress");
    auditChrome(container, "reset-confirm");
  });

  it("gate inspector steppers meet the hit area", async () => {
    const container = await mountRoute({
      route: ["board", { mapId: "d01" }],
      profile: { stars: starsFor(VALLEY_IDS, 3) },
    });
    const pilot = new Pilot(rig as Rig, "d01");
    await pilot.place({ x: 2, y: 6, kind: "gate" });
    await press(pilot.host, "Enter");
    auditChrome(container, "gate-inspector");
  });
});

describe("tray tools and toggles", () => {
  it("sizes tray tools inline and in the stylesheet at the hit token", async () => {
    const container = await mountRoute({
      route: ["board", { mapId: "d01" }],
      profile: { stars: starsFor(VALLEY_IDS, 3) },
    });
    const tools = Array.from(container.querySelectorAll<HTMLElement>(".fd-tool"));
    expect(tools).toHaveLength(6);
    for (const tool of tools) {
      expect(tool.style.minWidth).toBe("var(--wg-hit-min)");
      expect(tool.style.minHeight).toBe("var(--wg-hit-min)");
    }
    expect(GAME_CSS).toMatch(/\.fd-hit\s*\{[^}]*min-width:\s*var\(--wg-hit-min\)/);
    expect(GAME_CSS).toMatch(/\.fd-hit\s*\{[^}]*min-height:\s*var\(--wg-hit-min\)/);
    expect(GAME_CSS).toContain("--wg-hit-min: 44px");
    expect(kitCss).toMatch(/\.wg-toggle\s*\{[^}]*min-height:\s*48px/);
    expect(kitCss).toMatch(/\.wg-btn\s*\{[^}]*min-width:\s*48px/);
  });

  it("keeps body text at 16 px and labels at 14 px or more", () => {
    expect(GAME_CSS).toMatch(/html,\s*body\s*\{[^}]*font-size:\s*16px/);
    const sizes = Array.from(GAME_CSS.matchAll(/font-size:\s*(\d+)px/g)).map((m) => Number(m[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  });

  it("marks the pressed tool and speed with more than colour", () => {
    expect(GAME_CSS).toMatch(/\.fd-tool\[aria-pressed="true"\]\s*\{[^}]*border-width:\s*3px/);
    expect(GAME_CSS).toMatch(/\.fd-speed\[aria-pressed="true"\]\s*\{[^}]*box-shadow:\s*inset/);
    expect(GAME_CSS).toContain('html[data-contrast="high"]');
    expect(GAME_CSS).toContain('html[data-motion="reduced"]');
  });
});

describe("board accessibility", () => {
  it("exposes a focusable board group with a live summary and a hidden canvas", async () => {
    const container = await mountRoute({ route: ["board", { mapId: "v01" }] });
    const host = q(container, "[data-testid='board-host']");
    expect(host.getAttribute("role")).toBe("application");
    expect(host.getAttribute("aria-label")).toBe("Planning board");
    expect(host.getAttribute("tabindex")).toBe("0");
    expect(q(container, "[data-testid='board-canvas']").getAttribute("role")).toBe("presentation");
    const live = q(container, "[data-testid='board-live']");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(getMap("v01").pieces).toEqual(["canal"]);
    await act(() => undefined);
  });
});

describe("source hygiene", () => {
  const srcDir = join(import.meta.dirname, "../src");
  const files = (readdirSync(srcDir, { recursive: true }) as string[])
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(srcDir, name), "utf8") }));

  it("makes no network call", () => {
    expect(files.length).toBeGreaterThan(40);
    for (const file of files) {
      expect(file.text, file.name).not.toMatch(/\bfetch\s*\(/);
      expect(file.text, file.name).not.toMatch(/XMLHttpRequest/);
      expect(file.text, file.name).not.toMatch(/sendBeacon/);
      expect(file.text, file.name).not.toMatch(/\bWebSocket\b/);
      expect(file.text, file.name).not.toMatch(/https?:\/\/(?!github\.com\/google\/fonts)/);
    }
  });

  it("keeps every source file under 800 lines and avoids any", () => {
    for (const file of files) {
      expect(file.text.split("\n").length, file.name).toBeLessThanOrEqual(800);
      expect(file.text, file.name).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });

  it("only uses characters the bundled font subset covers", () => {
    const allowed = /^[ -~ -ÿ–—‘-”•…\n]*$/;
    for (const file of files) {
      expect(file.text, file.name).toMatch(allowed);
    }
  });

  it("keeps public assets small", () => {
    const publicDir = join(import.meta.dirname, "../public");
    let total = 0;
    for (const name of readdirSync(publicDir, { recursive: true }) as string[]) {
      const full = join(publicDir, name);
      if (statSync(full).isFile()) total += statSync(full).size;
    }
    expect(total).toBeLessThan(400 * 1024);
  });
});
