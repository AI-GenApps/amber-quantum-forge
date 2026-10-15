import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { PackSource } from "./catalog";

const TITLES: Record<string, string> = {
  "city-kit-roads": "Kenney City Kit (Roads)",
  "city-kit-commercial": "Kenney City Kit (Commercial)",
  "city-kit-suburban": "Kenney City Kit (Suburban)",
  "car-kit": "Kenney Car Kit",
};

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

export function resolvePackDir(rawDir: string, source: PackSource): string {
  const match = readdirSync(rawDir).find((name) => name.startsWith(source.dirPrefix));
  if (!match) throw new Error(`No extracted pack "${source.dirPrefix}*" in ${rawDir}`);
  return join(rawDir, match);
}

export function readPackLicence(packDir: string): string {
  const path = join(packDir, "License.txt");
  const text = readFileSync(path, "utf8");
  if (!/Creative Commons Zero, CC0/.test(text)) {
    throw new Error(`${path} does not state CC0; refusing to use this pack`);
  }
  return text.replace(/\r\n/g, "\n").trim();
}

/** Finds the zip a pack was extracted from, by the directory name it produced. */
export function findZip(zipsDir: string, source: PackSource): string {
  const wanted = basename(source.downloadUrl);
  const path = join(zipsDir, wanted);
  if (!existsSync(path)) throw new Error(`Missing zip ${path}`);
  return path;
}

export function renderLicenceRecord(
  source: PackSource,
  licenceText: string,
  zipPath: string,
  date: string,
): string {
  return [
    `Pack: ${TITLES[source.pack]}`,
    `Licence id: ${source.pack}`,
    "Licence: Creative Commons Zero 1.0 (CC0), http://creativecommons.org/publicdomain/zero/1.0/",
    `Source URL: ${source.pageUrl}`,
    `Download URL: ${source.downloadUrl}`,
    `Download date: ${date}`,
    `Zip file: ${basename(zipPath)}`,
    `Zip SHA-256: ${sha256(zipPath)}`,
    "",
    "----- License.txt from the pack (verbatim) -----",
    licenceText,
    "",
  ].join("\n");
}

export function writeLicenceRecord(path: string, content: string): void {
  writeFileSync(path, content);
}

/** Checks that a committed record exists, names its hash and embeds the pack's License.txt. */
export function verifyLicenceRecord(path: string, licenceText: string): void {
  if (!existsSync(path))
    throw new Error(`Missing licence record ${path}; run with --zips <dir> once`);
  const text = readFileSync(path, "utf8");
  if (!text.includes(licenceText)) throw new Error(`${path} does not embed the pack's License.txt`);
  if (!/^Zip SHA-256: [0-9a-f]{64}$/m.test(text)) throw new Error(`${path} has no zip SHA-256`);
  if (!/^Source URL: https:\/\/kenney\.nl\//m.test(text))
    throw new Error(`${path} has no source URL`);
}
