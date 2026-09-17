import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ContentValidationGame, validateContent } from "./content";

const temporaryRoots: string[] = [];
const game: ContentValidationGame = {
  id: "merge_relay",
  publicTitle: "Merge Relay",
  paths: { app: "apps-native/games/merge_relay" },
  source: {
    folderId: "folder",
    indexId: "index",
    prdId: "prd",
    validationId: "validation",
  },
};

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "gaming-content-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, game.paths.app), { recursive: true });
  return root;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const path = join(root, game.paths.app, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

afterEach(() => {
  while (temporaryRoots.length > 0)
    rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
});

test("repository content manifests pass across both source directories", () => {
  expect(validateContent()).toEqual([]);
});

test("valid content requires an app manifest and scans assets content", () => {
  const root = fixture();
  writeJson(root, "content/manifest.json", { app_id: game.id, rule_version: "MR-2D-1" });
  writeJson(root, "assets/content/extra.json", { schema_version: 1, values: ["fixture"] });
  expect(validateContent({ root, games: [game] })).toEqual([]);
});

test("missing expected manifest is rejected", () => {
  const root = fixture();
  writeJson(root, "assets/content/extra.json", { schema_version: 1 });
  expect(validateContent({ root, games: [game] }).join("\n")).toContain(
    "expected content manifest",
  );
});

test("privacy keys are blocked after normalization at nested paths", () => {
  const root = fixture();
  writeJson(root, "content/manifest.json", { app_id: game.id, rule_version: "MR-2D-1" });
  writeJson(root, "assets/content/private.json", {
    nested: [{ "RAW-Photo": "bytes" }, { captionText: "private" }],
  });
  const errors = validateContent({ root, games: [game] });
  expect(errors.some((error) => error.includes("RAW-Photo"))).toBe(true);
  expect(errors.some((error) => error.includes("captionText"))).toBe(true);
});

test("manifest identity, version, source IDs, and JSON syntax are validated", () => {
  const root = fixture();
  writeJson(root, "content/manifest.json", { app_id: "other", rule_version: "" });
  const malformedPath = join(root, game.paths.app, "assets/content/malformed.json");
  mkdirSync(join(malformedPath, ".."), { recursive: true });
  writeFileSync(malformedPath, "{");
  const errors = validateContent({ root, games: [game] });
  expect(errors.some((error) => error.includes("must be merge_relay"))).toBe(true);
  expect(errors.some((error) => error.includes("valid content version"))).toBe(true);
  expect(errors.some((error) => error.includes("invalid JSON"))).toBe(true);
});

test("manifest versions reject null, booleans, objects, and arrays", () => {
  for (const invalidVersion of [null, true, {}, []]) {
    const root = fixture();
    writeJson(root, "content/manifest.json", {
      app_id: game.id,
      rule_version: invalidVersion,
    });
    expect(
      validateContent({ root, games: [game] }).some((error) =>
        error.includes("valid content version"),
      ),
    ).toBe(true);
  }
});

test("asset manifest source IDs must belong to the registered source set", () => {
  const root = fixture();
  const assetGame = { ...game, id: "meme_court" };
  mkdirSync(join(root, assetGame.paths.app), { recursive: true });
  writeJson(root, "assets/content/prompts.json", {
    schema_version: 1,
    content_version: "fixture",
    source_ids: ["unknown"],
  });
  const errors = validateContent({ root, games: [assetGame] });
  expect(errors.some((error) => error.includes("known non-empty source IDs"))).toBe(true);
});
