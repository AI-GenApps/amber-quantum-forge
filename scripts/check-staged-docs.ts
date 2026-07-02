#!/usr/bin/env bun

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

function getStagedFiles(): string[] {
  const output = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
    encoding: "utf8",
  }).trim();

  if (!output) return [];

  return output
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

function getStagedDocsFolders(stagedFiles: string[]): Set<"internal" | "public"> {
  const touched = new Set<"internal" | "public">();

  for (const file of stagedFiles) {
    if (file.startsWith("docs-internal/")) touched.add("internal");
    if (file.startsWith("docs-public/")) touched.add("public");
  }

  return touched;
}

function runValidation(folderName: "docs-internal" | "docs-public"): void {
  execFileSync("bunx", ["mintlify", "validate"], {
    cwd: resolve(process.cwd(), folderName),
    stdio: "inherit",
  });
}

const stagedFiles = getStagedFiles();
const touchedDocFolders = getStagedDocsFolders(stagedFiles);

if (touchedDocFolders.has("internal")) {
  runValidation("docs-internal");
}

if (touchedDocFolders.has("public")) {
  runValidation("docs-public");
}
