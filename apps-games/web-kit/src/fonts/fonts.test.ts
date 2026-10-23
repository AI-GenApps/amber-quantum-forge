import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertNoPlatformFontFallback,
  findFontFallbacks,
  parseFontFamilyStack,
} from "./fallback-check";
import { FONT_STYLE_ID, fontFaceCss, registerFonts } from "./fonts";

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

const faces = [
  { family: "Fraunces", src: "/fonts/Fraunces.woff2", weight: "300 900" },
  { family: "Quicksand", src: "/fonts/Quicksand.woff2", style: "italic", display: "block" },
] as const;

describe("fontFaceCss", () => {
  it("emits one woff2 @font-face per spec with defaults", () => {
    const css = fontFaceCss([faces[0]]);
    expect(css).toContain('font-family: "Fraunces";');
    expect(css).toContain('src: url("/fonts/Fraunces.woff2") format("woff2");');
    expect(css).toContain("font-weight: 300 900;");
    expect(css).toContain("font-style: normal;");
    expect(css).toContain("font-display: swap;");
  });

  it("honours style, display and unicode-range, and strips quotes from names", () => {
    const css = fontFaceCss([{ ...faces[1], family: 'Quick"sand', unicodeRange: "U+0000-00FF" }]);
    expect(css).toContain('font-family: "Quicksand";');
    expect(css).toContain("font-style: italic;");
    expect(css).toContain("font-display: block;");
    expect(css).toContain("unicode-range: U+0000-00FF;");
    expect(css.match(/@font-face/g)).toHaveLength(1);
  });
});

describe("registerFonts", () => {
  it("injects a single style element and updates it on repeat calls", async () => {
    await registerFonts(faces);
    await registerFonts([faces[0]]);
    const styles = document.head.querySelectorAll(`#${FONT_STYLE_ID}`);
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain("Fraunces");
    expect(styles[0]?.textContent).not.toContain("Quicksand");
  });

  it("loads every face through the CSS Font Loading API and reports failures", async () => {
    const load = vi.fn(async (font: string) => {
      if (font.includes("Quicksand")) throw new Error("missing");
    });
    const result = await registerFonts(faces, {
      head: document.head,
      createElement: (tag) => document.createElement(tag),
      fonts: { load },
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ families: ["Fraunces", "Quicksand"], failed: ["Quicksand"] });
  });

  it("works where the Font Loading API is missing", async () => {
    const result = await registerFonts(faces, {
      head: document.head,
      createElement: (tag) => document.createElement(tag),
    });
    expect(result.failed).toEqual([]);
  });
});

describe("parseFontFamilyStack", () => {
  it("handles quotes and commas", () => {
    expect(parseFontFamilyStack(`"Fraunces", 'Open Sans', serif`)).toEqual([
      "Fraunces",
      "Open Sans",
      "serif",
    ]);
    expect(parseFontFamilyStack("")).toEqual([]);
  });
});

describe("findFontFallbacks", () => {
  const options = { families: ["Fraunces", "Quicksand"] };
  const mount = (html: string): HTMLElement => {
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.appendChild(root);
    return root;
  };

  it("accepts text whose first family is bundled, with a generic tail", () => {
    const root = mount(
      `<h1 style="font-family: Fraunces, serif">Title</h1><p style="font-family: 'Quicksand'">Body</p>`,
    );
    expect(findFontFallbacks(root, options)).toEqual([]);
    expect(() => assertNoPlatformFontFallback(root, options)).not.toThrow();
  });

  it("flags generic, unregistered and empty stacks", () => {
    const root = mount(
      `<p style="font-family: sans-serif">One</p>
       <p style="font-family: Arial, Fraunces">Two</p>
       <p style="font-family: system-ui">Three</p>`,
    );
    const reasons = findFontFallbacks(root, options).map((issue) => issue.reason);
    expect(reasons).toEqual([
      "generic-first-family",
      "unregistered-first-family",
      "generic-first-family",
    ]);
  });

  it("ignores elements without their own text and honours ignoreSelector", () => {
    const root = mount(
      `<div style="font-family: sans-serif"><span style="font-family: Fraunces">Hi</span></div>
       <i class="glyph" style="font-family: system-ui">★</i>`,
    );
    expect(findFontFallbacks(root, { ...options, ignoreSelector: ".glyph" })).toEqual([]);
  });

  it("reports an empty stack from an injected computed-style reader", () => {
    const root = mount(`<p>Text</p>`);
    const issues = findFontFallbacks(root, {
      ...options,
      getComputedStyle: () => ({ fontFamily: "" }),
    });
    expect(issues.map((i) => i.reason)).toEqual(["empty-stack"]);
  });

  it("assert lists each offender", () => {
    const root = mount(`<p style="font-family: Arial">Hello world</p>`);
    expect(() => assertNoPlatformFontFallback(root, options)).toThrow(
      /<p> "Hello world" unregistered-first-family/,
    );
  });
});
