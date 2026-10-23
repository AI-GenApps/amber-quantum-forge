const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
  "-apple-system",
  "blinkmacsystemfont",
  "inherit",
  "initial",
  "unset",
]);

export interface FontFallbackOptions {
  /** Families the game bundles; the first family of every text element must be one of them. */
  families: readonly string[];
  /** Skip elements matching this selector (for example icon glyph containers). */
  ignoreSelector?: string;
  getComputedStyle?: (element: Element) => { fontFamily: string };
}

export interface FontFallbackIssue {
  element: Element;
  text: string;
  fontFamily: string;
  reason: "empty-stack" | "unregistered-first-family" | "generic-first-family";
}

/** Splits a CSS `font-family` value into unquoted family names. */
export function parseFontFamilyStack(value: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ",") {
      if (current.trim()) out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const ownText = (element: Element): string =>
  Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? "")
    .join("")
    .trim();

/**
 * Test helper. Finds every element with its own text whose computed font stack would render in a
 * platform default font: an empty stack, a generic first family, or a first family that the game
 * has not bundled. A generic family at the end of the stack is allowed as a last resort.
 */
export function findFontFallbacks(
  root: Element,
  options: FontFallbackOptions,
): FontFallbackIssue[] {
  const known = new Set(options.families.map((family) => family.toLowerCase()));
  const compute = options.getComputedStyle ?? ((el: Element) => getComputedStyle(el));
  const issues: FontFallbackIssue[] = [];
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of elements) {
    if (options.ignoreSelector && element.matches(options.ignoreSelector)) continue;
    const text = ownText(element);
    if (!text) continue;
    const fontFamily = compute(element).fontFamily;
    const stack = parseFontFamilyStack(fontFamily);
    const first = stack[0]?.toLowerCase();
    let reason: FontFallbackIssue["reason"] | null = null;
    if (!first) reason = "empty-stack";
    else if (GENERIC_FAMILIES.has(first)) reason = "generic-first-family";
    else if (!known.has(first)) reason = "unregistered-first-family";
    if (reason) issues.push({ element, text, fontFamily, reason });
  }
  return issues;
}

/** Throws listing every offending element so the failure names what to fix. */
export function assertNoPlatformFontFallback(root: Element, options: FontFallbackOptions): void {
  const issues = findFontFallbacks(root, options);
  if (issues.length === 0) return;
  const lines = issues.map(
    (issue) =>
      `- <${issue.element.tagName.toLowerCase()}> "${issue.text.slice(0, 40)}" ${issue.reason} (font-family: ${issue.fontFamily || "empty"})`,
  );
  throw new Error(`Text would fall back to a platform font:\n${lines.join("\n")}`);
}
