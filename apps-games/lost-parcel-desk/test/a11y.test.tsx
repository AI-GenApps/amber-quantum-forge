import { assertNoPlatformFontFallback, kitCss } from "@web-games/kit";
import { CARDS, CASES } from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FAMILIES } from "../src/fonts";
import {
  buttonByText,
  click,
  GAME_CSS,
  mountApp,
  progress,
  q,
  qa,
  type Rig,
  type RouteInit,
  tap,
  tapStarting,
} from "./helpers";

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
    for (const part of (match[2] as string).replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
      const [name, ...value] = part.split(":");
      if (name && value.length) decls.set(name.trim(), value.join(":").trim());
    }
    rules.push({
      selectors: (match[1] as string)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split(",")
        .map((s) => s.trim()),
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

function audit(root: HTMLElement, where: string): number {
  const items = qa(root, INTERACTIVE);
  for (const el of items) {
    const label = `${where}: <${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}">`;
    expect(accessibleName(el).length, `${label} accessible name`).toBeGreaterThan(0);
    const size = hitSize(el);
    const need = el.matches(".lp-hotspot") ? 48 : HIT;
    expect(size.w, `${label} width`).toBeGreaterThanOrEqual(need);
    expect(size.h, `${label} height`).toBeGreaterThanOrEqual(need);
  }
  assertNoPlatformFontFallback(root, { families: FONT_FAMILIES });
  return items.length;
}

async function mountRoute(options: Parameters<typeof mountApp>[0]): Promise<HTMLElement> {
  rig?.unmount();
  rig = await mountApp(options);
  await rig.flush();
  return rig.container;
}

const MID = progress(["01", "02", "03", "04"], 2);

describe("the audit itself", () => {
  it("measures real rules and rejects what it should", () => {
    const make = (html: string): HTMLElement => {
      const holder = document.createElement("div");
      holder.innerHTML = html;
      document.body.appendChild(holder);
      return holder.firstElementChild as HTMLElement;
    };
    expect(hitSize(make("<button class='lp-chip'>x</button>"))).toEqual({ w: 44, h: 44 });
    expect(hitSize(make("<button class='wg-btn'>x</button>"))).toEqual({ w: 48, h: 48 });
    expect(hitSize(make("<button class='lp-hotspot'>x</button>"))).toEqual({ w: 48, h: 48 });
    expect(hitSize(make("<button>x</button>"))).toEqual({ w: 0, h: 0 });
    expect(accessibleName(make("<button><svg></svg></button>"))).toBe("");
    expect(accessibleName(make("<button aria-label='Close'><svg></svg></button>"))).toBe("Close");
    const stray = make("<p style='font-family: serif'>plain</p>");
    expect(() => assertNoPlatformFontFallback(stray, { families: FONT_FAMILIES })).toThrow(
      /platform font/,
    );
  });
});

describe("every screen", () => {
  const routes: [string, RouteInit, Parameters<typeof mountApp>[0]?][] = [
    ["home", ["home"], { profile: MID }],
    ["boot", ["boot"]],
    ["files", ["files"], { profile: MID }],
    ["intro", ["intro", { caseId: "01" }]],
    ["table", ["table", { caseId: "01" }]],
    ["board", ["board", { caseId: "01" }]],
    ["map", ["map"], { profile: MID }],
    ["almanac clues", ["almanac", { tab: "clues" }]],
    ["almanac townsfolk", ["almanac", { tab: "townsfolk" }], { profile: MID }],
    ["ledger", ["ledger"], { profile: MID }],
    ["daily", ["daily"]],
    ["achievements", ["achievements"]],
    ["records", ["records"], { profile: MID }],
    ["themes", ["themes"], { profile: MID }],
    ["settings", ["settings"]],
    ["howto", ["howto"]],
    ["credits", ["credits"]],
  ];

  for (const [name, route, extra] of routes) {
    it(`${name}: names, hit areas and fonts`, async () => {
      const c = await mountRoute({ route, ...(extra ?? {}) });
      const count = audit(c, name);
      if (name !== "boot") expect(count).toBeGreaterThan(0);
    });
  }

  it("viewer with hotspots, pin buttons and the back face", async () => {
    const c = await mountRoute({ route: ["viewer", { caseId: "01", objectId: "01-2" }] });
    await tap(rig as Rig, "Magnifier on");
    await click(q(c, "[data-hotspot='01-c1']"));
    await rig?.flush();
    expect(audit(c, "viewer front")).toBeGreaterThan(5);
    await tapStarting(rig as Rig, "Turn over");
    audit(c, "viewer back");
  });

  it("table with a full tray and board with links and a returned card", async () => {
    const c = await mountRoute({ route: ["board", { caseId: "01" }] });
    const game = (rig as Rig).app.game;
    for (const id of ["01-1", "01-2", "01-3", "01-4"]) {
      await game.inspect(id);
      await game.flip(id);
    }
    await game.zoom("01-c1");
    for (const clue of ["01-c1", "01-c2", "01-c3"]) await game.pin(clue);
    await game.link("01-c1", "p01", "fits");
    await game.link("01-c2", "p12", "fits");
    await game.link("01-c3", "p12", "fits");
    await game.accuse("p12");
    await rig?.flush();
    audit(c, "board full");
    (rig as Rig).app.router.replace("table", { caseId: "01" });
    await rig?.flush();
    expect(qa(c, ".lp-chip").length).toBeGreaterThan(3);
    audit(c, "table full");
  });

  it("reveal", async () => {
    const c = await mountRoute({ route: ["board", { caseId: "01" }] });
    const game = (rig as Rig).app.game;
    await game.inspect("01-3");
    await game.inspect("01-2");
    await game.zoom("01-c1");
    await game.pin("01-c1");
    await game.pin("01-c2");
    await game.link("01-c1", "p01", "fits");
    await game.link("01-c2", "p01", "fits");
    await game.accuse("p01");
    (rig as Rig).app.router.push("reveal", { caseId: "01" });
    await rig?.flush();
    audit(c, "reveal");
  });
});

describe("sheets", () => {
  it("every sheet passes the same audit", async () => {
    const c = await mountRoute({ route: ["board", { caseId: "01" }] });
    const r = rig as Rig;
    await tap(r, "Hint");
    audit(c, "hint sheet");
    await tap(r, "Cancel");
    await tap(r, "Accuse");
    expect(q(c, "[data-testid='board-notice']")).not.toBeNull();
    audit(c, "board notice");
    r.app.router.replace("table", { caseId: "01" });
    await r.flush();
    await tap(r, "Pause");
    audit(c, "pause sheet");
    await tap(r, "Leave the case");
    audit(c, "confirm sheet");
  });

  it("chapter sheet, card sheet, wrong note and link menu", async () => {
    const { ChapterSheet } = await import("../src/sheets/ChapterSheet");
    const { CardSheet } = await import("../src/sheets/CardSheet");
    const { WrongNote } = await import("../src/sheets/WrongNote");
    const { LinkMenu } = await import("../src/ui/LinkMenu");
    const { AppContext } = await import("../src/state/app");
    const { GameContext } = await import("../src/state/useGame");
    const { render } = await import("preact");
    const { act } = await import("preact/test-utils");
    rig = await mountApp();
    const app = rig.app;
    const view = (
      <AppContext.Provider value={app}>
        <GameContext.Provider value={app.game}>
          <ChapterSheet open chapter={2} part="outro" onClose={() => undefined} />
          <CardSheet open cardId={CARDS[0]?.id ?? ""} onClose={() => undefined} />
          <WrongNote
            open
            name="Ambrose Quill"
            note="The clue does not fit."
            stampsLeft={2}
            onClose={() => undefined}
          />
          <LinkMenu
            open
            clueTag="a clue"
            personName="Odalie Fenn"
            current="fits"
            onChoose={() => undefined}
            onClose={() => undefined}
          />
        </GameContext.Provider>
      </AppContext.Provider>
    );
    const holder = document.createElement("div");
    document.body.appendChild(holder);
    await act(() => render(view, holder));
    audit(holder, "sheets");
    expect(qa(holder, "[role='dialog']")).toHaveLength(4);
    render(null, holder);
  });
});

describe("text equivalents", () => {
  it("every object of every case has a caption and every clue has text", () => {
    for (const item of CASES) {
      for (const object of item.objects) {
        expect(object.caption.length, `${object.id} caption`).toBeGreaterThan(0);
        expect(object.name.length).toBeGreaterThan(0);
      }
      for (const clue of item.clues) expect(clue.text.length, `${clue.id} text`).toBeGreaterThan(0);
    }
  });

  it("the board keeps a live region that summarises each candidate", async () => {
    const c = await mountRoute({ route: ["board", { caseId: "01" }] });
    const live = q(c, "[data-testid='board-live']");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect((live.textContent ?? "").match(/clues? fits?/g)).toHaveLength(3);
    expect(buttonByText(c, "Back")).toBeTruthy();
  });

  it("link states are written as words, never colour alone", async () => {
    const c = await mountRoute({ route: ["board", { caseId: "01" }] });
    const game = (rig as Rig).app.game;
    await game.inspect("01-3");
    await game.pin("01-c2");
    await game.link("01-c2", "p01", "fits");
    await game.link("01-c2", "p10", "rules-out");
    await rig?.flush();
    for (const el of qa(c, "[data-link]")) {
      expect(el.querySelector("svg")).not.toBeNull();
      expect(/Fits|Rules out/.test(el.textContent ?? "")).toBe(true);
    }
    expect(q(c, "[data-clue='01-c2']").textContent).toContain("Linked");
  });
});
