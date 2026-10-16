import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AudioSource } from "./catalog";

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

const CC0 = "Creative Commons Zero 1.0 (CC0), http://creativecommons.org/publicdomain/zero/1.0/";

function basis(source: AudioSource, rawDir: string, date: string): string[] {
  if (source.licenceBasis === "pack-license-file") {
    const path = join(rawDir, source.id, "License.txt");
    const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n").trim();
    if (!/Creative Commons Zero, CC0/.test(text)) {
      throw new Error(`${path} does not state CC0; refusing to use this pack`);
    }
    return ["", "----- License.txt from the pack (verbatim) -----", text];
  }
  return [
    "",
    `Licence statement: the OpenGameArt page ${source.pageUrl} lists "License(s): CC0"`,
    `(read ${date}). OpenGameArt has no licence file inside the download, so the page is the`,
    "record. The page text is not copied here.",
  ];
}

/** The licence record for one source: URL, author, licence, date and the SHA-256 of each download. */
export function renderAudioLicence(
  source: AudioSource,
  rawDir: string,
  zipsDir: string,
  date: string,
  filesUsed: string[],
): string {
  const downloads = source.downloads.flatMap((d) => {
    const path = join(zipsDir, d.file);
    if (!existsSync(path)) throw new Error(`Missing download ${path}`);
    return [`Download URL: ${d.url}`, `Download file: ${d.file}`, `SHA-256: ${sha256(path)}`];
  });
  return [
    `Source: ${source.title}`,
    `Licence id: ${source.id}`,
    `Author: ${source.author}`,
    `Licence: ${CC0}`,
    `Source URL: ${source.pageUrl}`,
    `Download date: ${date}`,
    ...downloads,
    `Sounds used here: ${filesUsed.join(", ")}`,
    ...basis(source, rawDir, date),
    "",
  ].join("\n");
}

export function writeAudioLicence(dir: string, source: AudioSource, content: string): void {
  writeFileSync(join(dir, `${source.id}.txt`), content);
}

/** A committed record must name the source URL, author, licence, a date and every download hash. */
export function verifyAudioLicence(dir: string, source: AudioSource): string[] {
  const path = join(dir, `${source.id}.txt`);
  if (!existsSync(path)) return [`missing licence record ${path}`];
  const text = readFileSync(path, "utf8");
  const problems: string[] = [];
  if (!text.includes(`Source URL: ${source.pageUrl}`)) problems.push(`${path}: no source URL`);
  if (!/^Author: .+/m.test(text)) problems.push(`${path}: no author`);
  if (!/^Licence: Creative Commons Zero 1\.0 \(CC0\)/m.test(text)) problems.push(`${path}: no CC0`);
  if (!/^Download date: \d{4}-\d{2}-\d{2}$/m.test(text)) problems.push(`${path}: no date`);
  const hashes = text.match(/^SHA-256: [0-9a-f]{64}$/gm) ?? [];
  if (hashes.length !== source.downloads.length) {
    problems.push(
      `${path}: expected ${source.downloads.length} SHA-256 line(s), found ${hashes.length}`,
    );
  }
  return problems;
}
