import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { strings } from "../src/strings";

const SRC = join(import.meta.dirname, "../src");
const COPY_ATTRIBUTES = new Set([
  "aria-label",
  "title",
  "alt",
  "placeholder",
  "label",
  "aria-description",
]);
const HAS_LETTERS = /[A-Za-z]{2,}/;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function literalsOf(code: string, file: string): string[] {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) {
      const value = node.text.trim();
      if (HAS_LETTERS.test(value)) found.push(`text "${value}"`);
    } else if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      const name = node.name.getText(source);
      if (COPY_ATTRIBUTES.has(name) && HAS_LETTERS.test(node.initializer.text)) {
        found.push(`attribute ${name}="${node.initializer.text}"`);
      }
    } else if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isStringLiteral(node.expression) ||
        ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
      !ts.isJsxAttribute(node.parent)
    ) {
      if (HAS_LETTERS.test(node.expression.text))
        found.push(`expression "${node.expression.text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("string table", () => {
  it("has no hard-coded user-facing text in screens, overlays, components or the shell", () => {
    const files = [
      ...tsxFiles(join(SRC, "screens")),
      ...tsxFiles(join(SRC, "overlays")),
      ...tsxFiles(join(SRC, "components")),
      ...tsxFiles(join(SRC, "a11y")),
      join(SRC, "App.tsx"),
    ];
    expect(files.length).toBeGreaterThan(20);
    const offenders = files.flatMap((file) =>
      literalsOf(readFileSync(file, "utf8"), file).map(
        (hit) => `${file.slice(SRC.length)}: ${hit}`,
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("detects literals when they are present (the scanner works)", () => {
    const code =
      'export const A = () => <p aria-label="Hello there" class="x">Plain words{" · "}{"more words"}</p>;';
    expect(literalsOf(code, "sample.tsx")).toEqual([
      'attribute aria-label="Hello there"',
      'text "Plain words"',
      'expression "more words"',
    ]);
    expect(
      literalsOf('export const B = () => <p>{t("home.play")} 12 {"·"}</p>;', "ok.tsx"),
    ).toEqual([]);
  });

  it("keeps every string non-empty", () => {
    const lookup = strings.t as unknown as (key: string) => string;
    const keys = strings.keys();
    expect(keys.length).toBeGreaterThan(150);
    for (const key of keys) expect(lookup(key).trim().length, key).toBeGreaterThan(0);
  });
});
