import { afterEach, describe, expect, it } from "vitest";
import { contrastRatio } from "../../src/ui/contrast";
import { appCss } from "../../src/ui/styles";
import { textPairs, tokensFor } from "../../src/ui/tokens";
import { declarations, declared } from "../ui/css";
import {
  cleanup,
  goTab,
  openScreen,
  type Rendered,
  renderApp,
  SEEDS,
  type SeedName,
} from "../ui/harness";

afterEach(cleanup);

const TABS = ["observe", "build", "atlas", "eclipse", "journal"] as const;
const SCREENS = ["achievements", "statistics", "settings", "howto", "comet"] as const;
const PROGRESS: readonly SeedName[] = ["fresh", "mid", "late"];
const BAD_TEXT = /\bNaN\b|\bundefined\b|\bInfinity\b|-Infinity|\[object /;
const CONTROLS = "button, [role='tab'], [role='switch'], [role='button'], a[href], input, select";

function accessibleName(element: Element): string {
  const label = element.getAttribute("aria-label")?.trim();
  if (label) return label;
  return (element.textContent ?? "").trim();
}

function visibleStrings(r: Rendered): string[] {
  const attributes = r
    .qa("[aria-label], [title], [alt]")
    .flatMap((el) => ["aria-label", "title", "alt"].map((name) => el.getAttribute(name) ?? ""));
  return [r.container.textContent ?? "", ...attributes];
}

function audit(r: Rendered, where: string): number {
  const controls = r.qa(CONTROLS);
  for (const control of controls) {
    expect(accessibleName(control), `${where}: ${control.outerHTML.slice(0, 100)}`).not.toBe("");
  }
  for (const text of visibleStrings(r)) expect(text, where).not.toMatch(BAD_TEXT);
  return controls.length;
}

describe("release accessibility gate", () => {
  it("passes the contrast table in both variants (every pair at least 4.5:1)", () => {
    let pairs = 0;
    for (const high of [false, true]) {
      for (const pair of textPairs(tokensFor(high), high)) {
        pairs += 1;
        expect(
          contrastRatio(pair.foreground, pair.background),
          `${high ? "high" : "default"} ${pair.name}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    console.info(`a11y contrast: ${pairs} text pairs checked, all at least 4.5:1`);
    expect(pairs).toBeGreaterThanOrEqual(38);
  });

  it("declares 44 px hit areas, rem font sizes of at least 0.875 and safe-area insets", () => {
    for (const selector of [".co-btn", ".co-tab", ".co-chip"]) {
      expect(declared(appCss, selector, "min-height"), selector).toBeGreaterThanOrEqual(44);
      expect(declared(appCss, selector, "min-width"), selector).toBeGreaterThanOrEqual(44);
    }
    const sizes = declarations(appCss, "font-size");
    for (const size of sizes) expect(Number.parseFloat(size), size).toBeGreaterThanOrEqual(0.875);
    expect(appCss).toContain("env(safe-area-inset");
    expect(appCss).toContain("prefers-reduced-motion: reduce");
  });

  for (const progress of PROGRESS) {
    it(`names every control and renders no NaN, undefined or Infinity on every screen (${progress})`, async () => {
      const r = await renderApp({ seed: progress });
      let controls = 0;
      for (const tab of TABS) {
        await goTab(r, tab);
        controls += audit(r, `${progress}/${tab}`);
      }
      for (const screen of SCREENS) {
        await openScreen(r, screen);
        controls += audit(r, `${progress}/${screen}`);
        r.router.pop();
        await r.flush();
      }
      await r.unmount();
      const title = await renderApp({ seed: progress, start: "title" });
      controls += audit(title, `${progress}/title`);
      console.info(`a11y ${progress}: ${controls} controls named across 11 screens`);
      expect(controls).toBeGreaterThan(30);
    });
  }

  it("renders sane text for a profile at the top of the number range", async () => {
    const late = SEEDS.late;
    const r = await renderApp({
      seed: {
        ...late,
        game: {
          ...late.game,
          starlight: 4.2e280,
          cycleStarlight: 9e290,
          lifetimeStarlight: 1e299,
          shards: 123456,
          shardsEarned: 987654,
        },
      },
    });
    for (const tab of TABS) {
      await goTab(r, tab);
      audit(r, `huge/${tab}`);
    }
    for (const screen of SCREENS) {
      await openScreen(r, screen);
      audit(r, `huge/${screen}`);
      r.router.pop();
      await r.flush();
    }
  });
});
