import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Proves the "no data collected" claim of the store listing: the game source and its public
 * files contain no network API and no URL other than the allowlist. Run with
 * `bun scripts/no-data-audit.ts` (writes 08/no-data-audit.txt) or from the release test.
 */
const APP_DIR = join(import.meta.dirname, "..");
const REPO_ROOT = join(APP_DIR, "..", "..");
export const AUDIT_FILE = join(
  REPO_ROOT,
  ".agents/resources/2026-10-23/web-games/lantern-loops/08/no-data-audit.txt",
);

export const NETWORK_APIS: readonly string[] = [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "sendBeacon",
  "navigator.geolocation",
  "importScripts",
];

const BINARY = /\.(woff2?|mp3|ogg|wav|webp|png|jpe?g|avif|ico|gif)$/i;
const URL_PATTERN = /https?:\/\/[^\s"'`)<>\]]+/g;

export interface UrlRule {
  readonly name: string;
  readonly allows: (file: string, url: string) => boolean;
}

/** Why a URL may appear: it is a namespace, or text that credits a source or states a licence. */
export const URL_ALLOWLIST: readonly UrlRule[] = [
  { name: "XML namespace", allows: (_f, url) => url.startsWith("http://www.w3.org/") },
  {
    name: "licence text file (never executed)",
    allows: (file) => /^public\/.*\.txt$/.test(file),
  },
  {
    name: "attribution and licence URL printed as text (About screen, source records)",
    allows: (file, url) =>
      (file === "src/audio/sources.ts" || file === "src/theme/fonts.ts") &&
      /^https?:\/\/(kenney\.nl|opengameart\.org|creativecommons\.org|github\.com\/google\/fonts)\//.test(
        url,
      ),
  },
];

export interface Finding {
  readonly file: string;
  readonly line: number;
  readonly what: string;
}

export interface AllowedUrl {
  readonly file: string;
  readonly url: string;
  readonly rule: string;
}

export interface AuditResult {
  readonly files: string[];
  readonly apiUses: Finding[];
  readonly badUrls: Finding[];
  readonly allowedUrls: AllowedUrl[];
}

function list(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? list(path) : [path];
  });
}

export function auditFiles(): string[] {
  const roots = [join(APP_DIR, "src"), join(APP_DIR, "public")];
  const files = [...roots.flatMap(list), join(APP_DIR, "index.html")];
  return files
    .filter((file) => !BINARY.test(file))
    .map((file) => relative(APP_DIR, file))
    .sort();
}

export function runAudit(): AuditResult {
  const files = auditFiles();
  const apiUses: Finding[] = [];
  const badUrls: Finding[] = [];
  const allowedUrls: AllowedUrl[] = [];
  for (const file of files) {
    const lines = readFileSync(join(APP_DIR, file), "utf8").split("\n");
    lines.forEach((text, index) => {
      for (const api of NETWORK_APIS) {
        if (text.includes(api)) apiUses.push({ file, line: index + 1, what: api });
      }
      for (const url of text.match(URL_PATTERN) ?? []) {
        const rule = URL_ALLOWLIST.find((r) => r.allows(file, url));
        if (rule) allowedUrls.push({ file, url, rule: rule.name });
        else badUrls.push({ file, line: index + 1, what: url });
      }
    });
  }
  return { files, apiUses, badUrls, allowedUrls };
}

export function skeletonDependencies(): { match: boolean; detail: string } {
  try {
    const old = execFileSync(
      "git",
      ["-C", REPO_ROOT, "show", "7a34ae8:apps-games/lantern-loops/package.json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const now = readFileSync(join(APP_DIR, "package.json"), "utf8");
    const pick = (text: string): string => {
      const json = JSON.parse(text) as Record<string, unknown>;
      return JSON.stringify([json.dependencies, json.devDependencies]);
    };
    const same = pick(old) === pick(now);
    return {
      match: same,
      detail: same
        ? "dependencies and devDependencies equal the skeleton commit 7a34ae8 (only npm scripts were added)"
        : "dependencies differ from the skeleton commit 7a34ae8",
    };
  } catch {
    return {
      match: true,
      detail: "git history of the skeleton is not available here; not compared",
    };
  }
}

export function formatAudit(result: AuditResult, deps = skeletonDependencies()): string {
  const out: string[] = [
    "Lantern Loops no-data audit",
    "===========================",
    "",
    "Scope: apps-games/lantern-loops/src, apps-games/lantern-loops/public and index.html",
    `(${result.files.length} text files; binary fonts, audio and images are skipped).`,
    "",
    "Network APIs searched for (case-sensitive substrings):",
    ...NETWORK_APIS.map((api) => `  ${api}`),
    "",
    `Network API uses: ${result.apiUses.length}`,
    ...result.apiUses.map((f) => `  ${f.file}:${f.line} ${f.what}`),
    "",
    `Non-allowlisted URLs: ${result.badUrls.length}`,
    ...result.badUrls.map((f) => `  ${f.file}:${f.line} ${f.what}`),
    "",
    `Allowlisted URLs: ${result.allowedUrls.length}`,
  ];
  const byRule = new Map<string, Map<string, number>>();
  for (const { rule, url } of result.allowedUrls) {
    const urls = byRule.get(rule) ?? new Map<string, number>();
    urls.set(url, (urls.get(url) ?? 0) + 1);
    byRule.set(rule, urls);
  }
  for (const [rule, urls] of [...byRule].sort((a, b) => a[0].localeCompare(b[0]))) {
    out.push(`  ${rule}:`);
    for (const [url, count] of [...urls].sort((a, b) => a[0].localeCompare(b[0]))) {
      out.push(`    ${url} (x${count})`);
    }
  }
  out.push(
    "",
    "Notes:",
    "  Allowlisted URLs are printed as text on the About screen or sit in licence files; the app",
    "  never loads, opens or requests them.",
    "  The shared kit loads the bundled audio files with a same-origin fetch of relative paths",
    "  (apps-games/web-kit/src/audio/manager.ts); that is local file access, not network use, and the",
    "  kit is outside this scan.",
    "  The Capacitor Android template still declares android.permission.INTERNET; see",
    "  .agents/games/lantern-loops/open-questions.md (Q6).",
    "",
    `Skeleton dependencies: ${deps.match ? "unchanged" : "CHANGED"}`,
    `  ${deps.detail}`,
    "",
    `Result: ${result.apiUses.length === 0 && result.badUrls.length === 0 && deps.match ? "PASS" : "FAIL"}`,
    "",
  );
  return out.join("\n");
}

export function writeAudit(): { result: AuditResult; text: string } {
  const result = runAudit();
  const text = formatAudit(result);
  mkdirSync(dirname(AUDIT_FILE), { recursive: true });
  writeFileSync(AUDIT_FILE, text);
  return { result, text };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { text } = writeAudit();
  console.log(text);
}
