import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const KIB = 1024;
const MIB = 1024 * KIB;

export const APP_DIR = join(import.meta.dirname, "..");
export const BUNDLE_OUT_DIR = join(APP_DIR, "node_modules/.cache/bundle-check");

export const LIMITS = {
  jsGzip: 300 * KIB,
  art: 8 * MIB,
  fonts: 300 * KIB,
  audio: 2 * MIB,
  hero: 400 * KIB,
  bust: 120 * KIB,
  object: 60 * KIB,
} as const;

export interface FileSize {
  name: string;
  bytes: number;
}

export interface BundleSize {
  files: Array<FileSize & { gzipBytes: number }>;
  rawBytes: number;
  gzipBytes: number;
}

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path));
    else found.push(path);
  }
  return found.sort();
}

function sizes(dir: string, keep: (path: string) => boolean): FileSize[] {
  return walk(dir)
    .filter(keep)
    .map((path) => ({ name: relative(dir, path), bytes: statSync(path).size }));
}

export function sum(files: readonly FileSize[]): number {
  return files.reduce((total, file) => total + file.bytes, 0);
}

export async function measureBundle(): Promise<BundleSize> {
  await build({
    root: APP_DIR,
    configFile: join(APP_DIR, "vite.config.ts"),
    logLevel: "silent",
    build: {
      outDir: BUNDLE_OUT_DIR,
      emptyOutDir: true,
      copyPublicDir: false,
      reportCompressedSize: false,
    },
  });
  const files = walk(BUNDLE_OUT_DIR)
    .filter((path) => path.endsWith(".js"))
    .map((path) => {
      const raw = readFileSync(path);
      return {
        name: relative(BUNDLE_OUT_DIR, path),
        bytes: raw.length,
        gzipBytes: gzipSync(raw, { level: 9 }).length,
      };
    });
  return {
    files,
    rawBytes: files.reduce((total, file) => total + file.bytes, 0),
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
  };
}

export function artFiles(): FileSize[] {
  return sizes(join(APP_DIR, "public/art"), (path) => path.endsWith(".webp"));
}

export function fontFiles(): FileSize[] {
  return sizes(join(APP_DIR, "public/fonts"), (path) => path.endsWith(".woff2"));
}

export function audioFiles(): FileSize[] {
  return sizes(join(APP_DIR, "public/audio"), (path) => path.endsWith(".ogg"));
}

export function artLimitFor(name: string): number {
  if (name.startsWith("key-art") || name.startsWith("interior-")) return LIMITS.hero;
  if (name.startsWith("customer-")) return LIMITS.bust;
  return LIMITS.object;
}

export function kib(bytes: number): string {
  return `${(bytes / KIB).toFixed(1)} KiB`;
}

export function mib(bytes: number): string {
  return `${(bytes / MIB).toFixed(2)} MiB`;
}
