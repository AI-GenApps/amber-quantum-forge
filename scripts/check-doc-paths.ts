#!/usr/bin/env bun

import { execFileSync } from "node:child_process";

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

function isBannedDocsPath(filePath: string): boolean {
  if (filePath.startsWith("docs/")) return true;

  return filePath.includes("/docs/");
}

const stagedFiles = getStagedFiles();
const violations = stagedFiles.filter(isBannedDocsPath);

if (violations.length > 0) {
  console.error("\nCommit blocked: staged files must not use generic `docs/` folders.\n");
  console.error(
    "Allowed folders are: docs-internal/, docs-public/, and any non-docs paths elsewhere.\n",
  );
  for (const file of violations) {
    console.error(`  x ${file}`);
  }
  console.error(
    "\nUse docs-internal/ for private engineering documentation and docs-public/ for public docs.",
  );
  process.exit(1);
}
