import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  assertAssetBudget,
  assertNoPlatformFontFallback,
  findFontFallbacks,
  fontFaceCss,
  kitCss,
  parseFontFamilyStack,
} from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FACES, registerAppFonts } from "../../src/ui/fonts";
import { appCss } from "../../src/ui/styles";
import { FONT_FAMILIES, FONT_STACKS, themeTokens } from "../../src/ui/tokens";
import { declarations } from "./css";
import { cleanup, goTab, openScreen, renderApp } from "./harness";

afterEach(cleanup);

const PUBLIC = join(import.meta.dirname, "..", "..", "public");
const GENERIC = new Set(["serif", "sans-serif"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("font assets", () => {
  const files = walk(join(PUBLIC, "fonts"));
  const woff2 = files.filter((file) => file.endsWith(".woff2"));

  it("bundles the display and body families with their OFL.txt", () => {
    const names = woff2.map((file) => file.slice(PUBLIC.length + 1)).sort();
    expect(names).toEqual([
      "fonts/cormorant-garamond/CormorantGaramond-Bold.woff2",
      "fonts/cormorant-garamond/CormorantGaramond-Medium.woff2",
      "fonts/cormorant-garamond/CormorantGaramond-MediumItalic.woff2",
      "fonts/manrope/Manrope-Variable.woff2",
    ]);
    for (const family of ["cormorant-garamond", "manrope"]) {
      const licence = join(PUBLIC, "fonts", family, "OFL.txt");
      expect(existsSync(licence), licence).toBe(true);
      expect(readFileSync(licence, "utf8")).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });

  it("keeps all woff2 files under 400,000 bytes together", () => {
    const entries = woff2.map((file) => ({ path: file, bytes: statSync(file).size }));
    const report = assertAssetBudget(entries, {
      totalBytes: 400_000,
      byExtension: { woff2: 400_000 },
    });
    expect(report.fileCount).toBe(4);
    expect(report.totalBytes).toBeGreaterThan(10_000);
  });

  it("serves every registered face from a file that exists", () => {
    expect(FONT_FACES).toHaveLength(4);
    for (const face of FONT_FACES) {
      expect(existsSync(join(PUBLIC, face.src)), face.src).toBe(true);
      expect(FONT_FAMILIES).toContain(face.family);
    }
    const css = fontFaceCss(FONT_FACES);
    expect(css).toContain("font-style: italic");
    expect(css).toContain("font-weight: 400 700");
    expect(css).toContain('format("woff2")');
  });

  it("starts with a woff2 signature", () => {
    for (const file of woff2) {
      expect(readFileSync(file).subarray(0, 4).toString("latin1")).toBe("wOF2");
    }
  });
});

describe("font registration", () => {
  function fakeDocument(load: () => Promise<unknown>) {
    const styles: HTMLStyleElement[] = [];
    return {
      styles,
      doc: {
        head: { appendChild: (node: Node) => void styles.push(node as HTMLStyleElement) },
        createElement: () => document.createElement("style"),
        getElementById: () => null,
        fonts: { load },
      },
    };
  }

  it("injects the faces and waits for them to load", async () => {
    const loaded: string[] = [];
    const { doc, styles } = fakeDocument(
      async (font?: unknown) => void loaded.push(String(font)) as unknown,
    );
    const result = await registerAppFonts(doc as never);
    expect(result.failed).toEqual([]);
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain('"Cormorant Garamond"');
    expect(styles[0]?.textContent).toContain('"Manrope"');
    expect(loaded).toHaveLength(4);
  });

  it("never blocks longer than the timeout", async () => {
    const { doc } = fakeDocument(() => new Promise(() => undefined));
    const started = Date.now();
    const result = await registerAppFonts(doc as never, 30);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result.families).toEqual([...FONT_FAMILIES]);
  });
});

describe("no platform font fallback", () => {
  it("every font-family declaration lists only bundled families, generic keyword last", () => {
    const sources = [appCss, kitCss];
    const vars: Record<string, string> = {
      "--wg-font-body": themeTokens.fontBody,
      "--wg-font-display": themeTokens.fontDisplay,
    };
    const seen = new Set<string>();
    for (const css of sources) {
      for (const raw of declarations(css, "font-family")) {
        const value = raw.replace(/var\((--[\w-]+)\)/g, (_all, name: string) => vars[name] ?? "");
        const stack = parseFontFamilyStack(value);
        expect(stack.length, raw).toBeGreaterThan(0);
        stack.forEach((name, index) => {
          const generic = GENERIC.has(name);
          if (generic) expect(index, raw).toBe(stack.length - 1);
          else expect(FONT_FAMILIES as readonly string[], raw).toContain(name);
        });
        expect(GENERIC.has(stack.at(-1) ?? ""), raw).toBe(true);
        seen.add(value);
      }
    }
    expect([...seen].sort()).toEqual([FONT_STACKS.body, FONT_STACKS.display].sort());
  });

  it("the token stacks are the bundled families", () => {
    expect(FONT_STACKS.display).toBe('"Cormorant Garamond", serif');
    expect(FONT_STACKS.body).toBe('"Manrope", sans-serif');
  });

  const options = { families: FONT_FAMILIES };

  it("every tab, screen and sheet renders in a bundled font", async () => {
    const r = await renderApp({ seed: "late" });
    for (const tab of ["observe", "build", "atlas", "eclipse", "journal"] as const) {
      await goTab(r, tab);
      assertNoPlatformFontFallback(r.container, options);
    }
    for (const screen of ["achievements", "statistics", "settings", "howto", "comet"] as const) {
      await openScreen(r, screen);
      assertNoPlatformFontFallback(r.container, options);
      r.router.pop();
      await r.flush();
    }
    await goTab(r, "journal");
    await r.click(r.q("[data-entry='lore-01']"));
    assertNoPlatformFontFallback(r.container, options);
    expect(findFontFallbacks(document.body, options)).toEqual([]);
  });

  it("the title, the chart table and the dialogs use bundled fonts too", async () => {
    const title = await renderApp({ seed: "mid", start: "title" });
    assertNoPlatformFontFallback(title.container, options);
    await title.unmount();
    const chart = await renderApp({ seed: { game: { starlight: 100, owned: { telescope: 2 } } } });
    await goTab(chart, "atlas");
    await chart.click(chart.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await chart.click(chart.q('[data-star="3"]'));
    assertNoPlatformFontFallback(chart.container, options);
    for (let index = 0; index < 5; index += 1) await chart.click(chart.q(`[data-star="${index}"]`));
    assertNoPlatformFontFallback(chart.container, options);
  });

  it("holds in the high contrast setting", async () => {
    const r = await renderApp({ seed: "mid" });
    await r.harness.session.settings.set({ highContrast: true });
    await r.flush();
    assertNoPlatformFontFallback(r.container, options);
  });
});
