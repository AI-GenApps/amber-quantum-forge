#!/usr/bin/env bun

/**
 * Pre-commit hook: block banned dependencies in apps/[*]/package.json.
 *
 * Enforces architectural boundaries between apps and shared packages.
 * `apps/native` must not import server-side or database packages — it talks
 * to the backend over HTTP only.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

interface BannedRule {
  /** Glob-style package name: exact, `prefix-*`, or `@scope/*` */
  pattern: string;
  /** Regex matched against the app's package.json path (e.g. apps/native/package.json) */
  appPattern: RegExp;
  reason: string;
}

const BANNED_RULES: BannedRule[] = [
  {
    pattern: "@repo/db",
    appPattern: /^apps\/native\/package\.json$/,
    reason:
      "apps/native must not depend on @repo/db. The native app talks to the backend over HTTP via the API; it should never reach the database directly.",
  },
  {
    pattern: "@repo/api",
    appPattern: /^apps\/native\/package\.json$/,
    reason:
      "apps/native must not depend on @repo/api. The Hono API is a server package; the native app should call its endpoints over HTTP, not import its code.",
  },
];

function getStagedFiles(): string[] {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  ).trim();
  if (!output) return [];
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

function matchesBannedPattern(pkg: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return pkg === prefix || pkg.startsWith(`${prefix}/`);
  }
  if (pattern.endsWith("-*")) {
    const prefix = pattern.slice(0, -1);
    return pkg.startsWith(prefix);
  }
  return pkg === pattern;
}

interface Violation {
  file: string;
  pkg: string;
  rule: BannedRule;
}

const stagedFiles = getStagedFiles();
const packageJsonFiles = stagedFiles.filter((f) =>
  /^apps\/[^/]+\/package\.json$/.test(f),
);

const violations: Violation[] = [];

for (const file of packageJsonFiles) {
  if (!existsSync(file)) continue;

  let parsed: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }

  const allDeps = {
    ...parsed.dependencies,
    ...parsed.devDependencies,
    ...parsed.peerDependencies,
  };

  for (const pkg of Object.keys(allDeps)) {
    for (const rule of BANNED_RULES) {
      if (!rule.appPattern.test(file)) continue;
      if (matchesBannedPattern(pkg, rule.pattern)) {
        violations.push({ file, pkg, rule });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    "\nCommit blocked: banned dependencies found in apps/*/package.json.\n",
  );

  for (const { file, pkg, rule } of violations) {
    console.error(`  x ${file}`);
    console.error(`    Package: "${pkg}"`);
    console.error(`    Reason:  ${rule.reason}\n`);
  }

  process.exit(1);
}
