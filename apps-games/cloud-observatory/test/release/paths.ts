import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const APP = join(import.meta.dirname, "..", "..");
export const REPO = join(APP, "..", "..");
export const CORE = join(REPO, "apps-games", "cloud-observatory-core");
export const PUBLIC = join(APP, "public");
export const KB = join(REPO, ".agents", "games", "cloud-observatory");
export const BUNDLE_DIR = join(APP, "node_modules", ".cache", "bundle-check");

export function walk(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

export const sizeOf = (path: string): number => statSync(path).size;

export const readText = (path: string): string => readFileSync(path, "utf8");

export function entriesIn(dir: string, extension: string): { path: string; bytes: number }[] {
  return walk(dir)
    .filter((file) => file.endsWith(extension))
    .map((file) => ({ path: file, bytes: sizeOf(file) }));
}
