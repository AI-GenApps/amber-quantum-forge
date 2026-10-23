import { appVars } from "../../src/ui/tokens";

export interface Rule {
  readonly selectors: string[];
  readonly body: string;
}

export function rules(css: string): Rule[] {
  const out: Rule[] = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").trim();
    if (selector.startsWith("@") || /^(from|to|\d+%)/.test(selector)) continue;
    out.push({
      selectors: selector.split(",").map((part) => part.trim()),
      body: match[2] ?? "",
    });
  }
  return out;
}

export function declarations(css: string, property: string): string[] {
  const pattern = new RegExp(`(?:^|[;{\\s])${property}\\s*:\\s*([^;}]+)`, "g");
  return Array.from(css.matchAll(pattern), (match) => (match[1] ?? "").trim());
}

/** Resolves `var(--co-...)` against the app's custom properties and returns pixels, or null. */
export function px(value: string): number | null {
  const resolved = value.replace(/var\((--[\w-]+)\)/g, (_all, name: string) => {
    return appVars(false)[name] ?? "";
  });
  const match = /^(\d+(?:\.\d+)?)px$/.exec(resolved.trim());
  return match ? Number(match[1]) : null;
}

export function declared(css: string, selector: string, property: string): number | null {
  for (const rule of rules(css)) {
    if (!rule.selectors.includes(selector)) continue;
    const found = declarations(rule.body, property).at(-1);
    if (found !== undefined) return px(found);
  }
  return null;
}
