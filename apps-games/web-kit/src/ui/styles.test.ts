import { afterEach, describe, expect, it } from "vitest";
import { injectKitStyles, KIT_STYLE_ID, kitCss } from "./styles";
import { TOKEN_VARS } from "./theme";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("kit stylesheet", () => {
  it("never hard-codes colours; it is themed only by custom properties", () => {
    expect(kitCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(kitCss).not.toMatch(/\brgba?\(/);
    expect(kitCss).toContain("var(--wg-color-accent)");
    expect(kitCss).toContain("var(--wg-font-body)");
  });

  it("only references defined theme tokens", () => {
    const defined = new Set(Object.values(TOKEN_VARS));
    const used = [...kitCss.matchAll(/var\((--wg-[a-z-]+)\)/g)].map((m) => m[1] as string);
    expect(used.length).toBeGreaterThan(20);
    expect(used.filter((name) => !defined.has(name))).toEqual([]);
  });

  it("keeps touch targets at least 48px and honours safe-area insets and reduced motion", () => {
    expect(kitCss).toContain("min-height: 48px");
    expect(kitCss).toContain("env(safe-area-inset-top");
    expect(kitCss).toContain("env(safe-area-inset-bottom");
    expect(kitCss).toContain("prefers-reduced-motion: reduce");
  });

  it("injects once", () => {
    expect(injectKitStyles()).toBe(true);
    expect(injectKitStyles()).toBe(false);
    const styles = document.head.querySelectorAll(`#${KIT_STYLE_ID}`);
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe(kitCss);
  });
});
