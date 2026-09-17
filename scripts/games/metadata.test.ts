import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hashFiles,
  hashReleaseSources,
  hashSources,
  parsePubspecRelease,
  validatePubspecRelease,
} from "./metadata";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0)
    rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "gaming-metadata-"));
  temporaryRoots.push(root);
  return root;
}

test("pubspec release metadata parses and matches the registry", () => {
  expect(parsePubspecRelease("name: fixture\nversion: 0.1.0+7\n")).toEqual({
    version: "0.1.0",
    buildNumber: 7,
  });
  expect(validatePubspecRelease("version: 0.1.0+7\n", "0.1.0", 7)).toEqual([]);
});

test("invalid or mismatched pubspec release metadata fails closed", () => {
  expect(() => parsePubspecRelease("version: not-a-version+1\n")).toThrow("semantic version");
  expect(() => parsePubspecRelease("version: 0.1.0\n")).toThrow("build number");
  expect(validatePubspecRelease("version: 0.2.0+1\n", "0.1.0", 7)).toEqual([
    "pubspec version 0.2.0 does not match registry 0.1.0",
    "pubspec build number 1 does not match registry 7",
  ]);
});

test("content hashes include explicit source labels, paths, lengths, and bytes", () => {
  const root = fixture();
  const content = join(root, "content");
  const assetsContent = join(root, "assets/content");
  mkdirSync(content, { recursive: true });
  mkdirSync(assetsContent, { recursive: true });
  writeFileSync(join(content, "a"), "bc");
  writeFileSync(join(assetsContent, "ab"), "c");
  const first = hashSources([
    { directory: content, label: "content" },
    { directory: assetsContent, label: "assets/content" },
  ]);
  expect(first).toBeString();
  writeFileSync(join(assetsContent, "ab"), "changed");
  expect(
    hashSources([
      { directory: content, label: "content" },
      { directory: assetsContent, label: "assets/content" },
    ]),
  ).not.toBe(first);
});

test("missing source directories do not produce a fake empty digest", () => {
  const root = fixture();
  expect(hashFiles(join(root, "missing"))).toBeNull();
});

test("release source hashes change when selected client code changes", () => {
  const root = fixture();
  const app = join(root, "app");
  const shared = join(root, "shared");
  mkdirSync(app, { recursive: true });
  mkdirSync(shared, { recursive: true });
  writeFileSync(join(app, "lib.dart"), "first");
  writeFileSync(join(shared, "core.dart"), "shared");
  const first = hashReleaseSources(app, [shared]);
  writeFileSync(join(app, "lib.dart"), "changed");
  const second = hashReleaseSources(app, [shared]);
  expect(second.appSourceSha256).not.toBe(first.appSourceSha256);
  expect(second.sharedSourceSha256).toBe(first.sharedSourceSha256);
});
