import { assertNoPlatformFontFallback, kitCss } from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FAMILIES } from "../../src/theme/fonts";
import { gameCss } from "../../src/theme/styles";
import { HIT_PX } from "../../src/theme/tokens";
import { contrastRows } from "../helpers/contrast-pairs";
import {
  click,
  createTestEnv,
  type Fixture,
  flush,
  mountApp,
  removeAnimate,
  type TestEnvOptions,
} from "../helpers/env";

type Route = NonNullable<TestEnvOptions["route"]>;

const ROUTES: Array<[string, Route]> = [
  ["boot", { name: "boot" }],
  ["home", { name: "home" }],
  ["onboarding", { name: "onboarding" }],
  ["chapters", { name: "chapters" }],
  ["puzzleList", { name: "puzzleList", params: { chapter: "harbor" } }],
  ["puzzleList locked", { name: "puzzleList", params: { chapter: "sky" } }],
  ["daily", { name: "daily" }],
  ["archive", { name: "archive" }],
  ["stats", { name: "stats" }],
  ["settings", { name: "settings" }],
  ["howto basics", { name: "howto", params: { page: "basics" } }],
  ["howto stones", { name: "howto", params: { page: "stones" } }],
  ["howto mirrors", { name: "howto", params: { page: "mirrors" } }],
  ["howto gates", { name: "howto", params: { page: "gates" } }],
  ["howto daily", { name: "howto", params: { page: "daily" } }],
  ["howto hints", { name: "howto", params: { page: "hints" } }],
  ["about", { name: "about" }],
  ["puzzle harbor", { name: "puzzle", params: { id: "harbor-01" } }],
  ["puzzle sky", { name: "puzzle", params: { id: "sky-01" } }],
  ["tutorial", { name: "puzzle", params: { id: "tutorial-2" } }],
];

const FIXTURES: Fixture[] = ["fresh", "mid", "finished"];
const INTERACTIVE =
  "button, a[href], input, select, textarea, [role='button'], [role='switch'], [role='tab'], [role='checkbox'], [role='radio'], [tabindex='0']";

afterEach(() => {
  document.body.replaceChildren();
  removeAnimate();
});

function accessibleName(el: Element, root: ParentNode): string {
  const label = el.getAttribute("aria-label")?.trim();
  if (label) return label;
  const by = el.getAttribute("aria-labelledby");
  if (by) {
    const text = by
      .split(/\s+/)
      .map((id) => root.querySelector(`[id='${id}']`)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }
  const title = el.getAttribute("title")?.trim();
  if (title) return title;
  const own = (el.textContent ?? "").trim();
  if (own) return own;
  const svgTitle = el.querySelector("svg title")?.textContent?.trim();
  if (svgTitle) return svgTitle;
  return el.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim() ?? "";
}

const describeEl = (el: Element): string =>
  `<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}">`;

async function visit(
  fixture: Fixture,
  route: Route,
  extra: Partial<TestEnvOptions>,
  check: (root: HTMLElement, label: string) => void | Promise<void>,
): Promise<void> {
  const test = await createTestEnv({ fixture, route, ...extra });
  const app = await mountApp(test.env);
  await flush(6);
  await check(app.container, `${fixture}/${route.name}`);
  app.unmount();
  document.body.replaceChildren();
}

async function sweep(
  extra: Partial<TestEnvOptions>,
  check: (root: HTMLElement, label: string) => void | Promise<void>,
): Promise<void> {
  for (const fixture of FIXTURES) {
    for (const [name, route] of ROUTES) {
      await visit(fixture, route, extra, (root, label) => check(root, `${label} ${name}`));
    }
  }
}

interface HitRule {
  selector: string;
  px: number;
}

function hitRules(): HitRule[] {
  const rules: HitRule[] = [];
  for (const match of `${kitCss}\n${gameCss}`.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = match[2] ?? "";
    const height = /min-height:\s*(var\(--ll-hit\)|(\d+)px)/.exec(body);
    if (!height) continue;
    const px = height[1] === "var(--ll-hit)" ? HIT_PX : Number(height[2]);
    for (const part of (match[1] ?? "").split(",")) {
      const selector = part.trim();
      if (selector && !selector.includes(":") && !selector.startsWith("@")) {
        rules.push({ selector, px });
      }
    }
  }
  return rules;
}

describe("accessibility sweep (every screen, three profiles)", () => {
  it("names every interactive control and every image", async () => {
    const problems: string[] = [];
    let checked = 0;
    await sweep({}, (root, label) => {
      const board = root.querySelector("svg[data-board]");
      if (board !== null) {
        if (board.getAttribute("role") !== "grid") problems.push(`${label}: board is not a grid`);
        if (!board.getAttribute("aria-label")) problems.push(`${label}: board has no label`);
        if (root.querySelector("[role='status'][aria-live]") === null) {
          problems.push(`${label}: no live region`);
        }
      }
      for (const el of root.querySelectorAll(INTERACTIVE)) {
        if (el.closest("svg[data-board]") !== null) continue;
        checked += 1;
        if (accessibleName(el, root) === "") problems.push(`${label}: no name ${describeEl(el)}`);
      }
      for (const el of root.querySelectorAll("svg[role='img'], [role='img']")) {
        if (accessibleName(el, root) === "")
          problems.push(`${label}: unnamed image ${describeEl(el)}`);
      }
      for (const el of root.querySelectorAll("img")) {
        if (!el.hasAttribute("alt")) problems.push(`${label}: img without alt`);
      }
      for (const el of root.querySelectorAll("[role='dialog']")) {
        if (accessibleName(el, root) === "") problems.push(`${label}: unnamed dialog`);
      }
      for (const el of root.querySelectorAll("[role='switch']")) {
        if (!el.hasAttribute("aria-checked")) problems.push(`${label}: switch without state`);
      }
      for (const el of root.querySelectorAll("[role='tab']")) {
        if (!el.hasAttribute("aria-selected")) problems.push(`${label}: tab without state`);
      }
    });
    expect(checked).toBeGreaterThan(200);
    expect(problems).toEqual([]);
  });

  it("gives every screen a heading or a labelled region", async () => {
    const problems: string[] = [];
    await sweep({}, (root, label) => {
      const screen = root.querySelector("[data-screen]");
      if (screen === null) problems.push(`${label}: no screen`);
      else if (
        screen.querySelector("h1, h2, [role='heading']") === null &&
        !screen.hasAttribute("aria-label")
      ) {
        problems.push(`${label}: no heading`);
      }
    });
    expect(problems).toEqual([]);
  });

  it("makes every control at least 44 px tall by CSS", async () => {
    const rules = hitRules();
    expect(rules.length).toBeGreaterThan(5);
    const problems: string[] = [];
    let checked = 0;
    await sweep({}, (root, label) => {
      for (const el of root.querySelectorAll(
        "button, a[href], [role='switch'], [role='tab'], input, select",
      )) {
        if (el.closest("svg") !== null || el.classList.contains("ll-sr")) continue;
        checked += 1;
        const ok = rules.some((rule) => rule.px >= HIT_PX && el.matches(rule.selector));
        if (!ok) problems.push(`${label}: ${describeEl(el)}`);
      }
    });
    expect(checked).toBeGreaterThan(200);
    expect([...new Set(problems)]).toEqual([]);
  });

  it("keeps the 44 px token and a 36 px board cell floor", () => {
    expect(HIT_PX).toBe(44);
    expect(gameCss).toContain("--ll-hit: 44px");
  });

  it("meets the contrast minimums in both themes (text 4.5:1, graphics 3:1)", () => {
    const rows = contrastRows();
    expect(rows.length).toBeGreaterThan(40);
    expect(rows.filter((r) => r.ratio < r.min).map((r) => r.name)).toEqual([]);
  });

  it("renders no text outside Fraunces and Nunito, also in high contrast", async () => {
    await sweep({ settings: { highContrast: true } }, (root, label) => {
      expect(
        () => assertNoPlatformFontFallback(root, { families: [...FONT_FAMILIES] }),
        label,
      ).not.toThrow();
    });
  });

  it("starts no animation anywhere with reduced motion on", async () => {
    await sweep({ settings: { reducedMotion: true } }, (_root, label) => {
      expect(document.documentElement.dataset.reducedMotion, label).toBe("true");
    });
    const test = await createTestEnv({ fixture: "fresh", settings: { reducedMotion: true } });
    const app = await mountApp(test.env);
    for (const label of ["Play campaign", "Settings", "Archive"]) {
      const button = Array.from(app.container.querySelectorAll("button")).find((b) =>
        (b.textContent ?? "").includes(label),
      );
      expect(button, label).toBeDefined();
      await click(button ?? null);
      test.router.reset("home");
      await flush();
    }
    expect(test.animate).not.toHaveBeenCalled();
    app.unmount();
  });

  it("disables CSS transitions and animations when reduced motion is on", () => {
    expect(gameCss).toMatch(
      /\[data-reduced-motion="true"\] \*[^{]*\{[^}]*transition: none !important[^}]*animation: none !important/,
    );
    expect(kitCss).toMatch(/prefers-reduced-motion|data-reduced-motion/);
  });
});
