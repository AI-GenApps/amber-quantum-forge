import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const APP = join(import.meta.dirname, "..");
export const APP_SRC = join(APP, "src");
export const CORE_SRC = join(APP, "../dress-rehearsal-core/src");

export interface Source {
  file: string;
  text: string;
}

export function sources(dir: string, base = dir): Source[] {
  const out: Source[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path, base));
    else if (/\.(ts|tsx|css)$/.test(name)) {
      out.push({ file: path.slice(base.length + 1), text: readFileSync(path, "utf8") });
    }
  }
  return out;
}

export const APP_FILES = sources(APP_SRC);
export const CORE_FILES = sources(CORE_SRC);

export function offenders(files: Source[], pattern: RegExp): string[] {
  return files.filter((entry) => pattern.test(entry.text)).map((entry) => entry.file);
}
