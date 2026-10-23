import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

export const APP = resolve(import.meta.dirname, "..");
export const BUNDLE_OUT = join(APP, "node_modules/.cache/bundle-check");

export const BUDGETS = {
  jsGzipBytes: 300 * 1024,
  artBytes: 8 * 1024 * 1024,
  fontBytes: 300 * 1024,
  audioBytes: 2 * 1024 * 1024,
  singleArtBytes: 400 * 1024,
} as const;

export interface FileSize {
  file: string;
  bytes: number;
}

export interface BundleReport {
  jsFiles: FileSize[];
  jsGzipBytes: number;
  jsRawBytes: number;
}

export interface AssetReport {
  files: FileSize[];
  bytes: number;
}

export function walk(dir: string, base = dir): FileSize[] {
  const out: FileSize[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path, base));
    else out.push({ file: path.slice(base.length + 1), bytes: statSync(path).size });
  }
  return out;
}

export function measureAssets(folder: string, extensions: readonly string[]): AssetReport {
  const files = walk(join(APP, "public", folder)).filter((entry) =>
    extensions.some((extension) => entry.file.endsWith(extension)),
  );
  return { files, bytes: files.reduce((sum, entry) => sum + entry.bytes, 0) };
}

export async function measureBundle(outDir = BUNDLE_OUT): Promise<BundleReport> {
  rmSync(outDir, { recursive: true, force: true });
  await build({
    root: APP,
    logLevel: "silent",
    configFile: join(APP, "vite.config.ts"),
    publicDir: false,
    build: { outDir, emptyOutDir: true, write: true, reportCompressedSize: false },
  });
  const jsFiles = walk(outDir).filter((entry) => entry.file.endsWith(".js"));
  let jsGzipBytes = 0;
  let jsRawBytes = 0;
  for (const entry of jsFiles) {
    const raw = readFileSync(join(outDir, entry.file));
    jsRawBytes += raw.length;
    jsGzipBytes += gzipSync(raw).length;
  }
  return { jsFiles, jsGzipBytes, jsRawBytes };
}

export function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
