import { describe, expect, it } from "vitest";
import { applyTheme, neutralTheme, TOKEN_VARS, themeToCss, themeVar } from "./theme";

describe("theme", () => {
  it("maps every token to a unique --wg- custom property", () => {
    const vars = Object.values(TOKEN_VARS);
    expect(new Set(vars).size).toBe(vars.length);
    expect(vars.every((name) => name.startsWith("--wg-"))).toBe(true);
    expect(Object.keys(neutralTheme).sort()).toEqual(Object.keys(TOKEN_VARS).sort());
  });

  it("applyTheme sets custom properties and returns a remover", () => {
    const root = document.createElement("div");
    const remove = applyTheme({ colorAccent: "#123456", radiusMd: "10px" }, root);
    expect(root.style.getPropertyValue("--wg-color-accent")).toBe("#123456");
    expect(root.style.getPropertyValue("--wg-radius-md")).toBe("10px");
    remove();
    expect(root.style.getPropertyValue("--wg-color-accent")).toBe("");
  });

  it("applyTheme defaults to the document root and applies a full theme", () => {
    const remove = applyTheme(neutralTheme);
    expect(document.documentElement.style.getPropertyValue("--wg-font-body")).toBe(
      neutralTheme.fontBody,
    );
    remove();
    expect(document.documentElement.style.getPropertyValue("--wg-font-body")).toBe("");
  });

  it("themeVar returns a var() reference", () => {
    expect(themeVar("colorText")).toBe("var(--wg-color-text)");
  });

  it("themeToCss renders a rule for the given selector", () => {
    const css = themeToCss({ colorAccent: "red", space: "4px" }, ".dark");
    expect(css).toBe(".dark {\n  --wg-color-accent: red;\n  --wg-space: 4px;\n}");
  });
});
