/**
 * Prints the release budgets as a table and exits 1 when one is exceeded:
 *
 *   bun scripts/check-bundle.ts
 *
 * Same logic as `test/budgets.test.ts` (it builds into `node_modules/.cache/bundle-check`).
 */
import { BUDGETS, kb, measureAssets, measureBundle } from "./bundle-lib";

const bundle = await measureBundle();
const art = measureAssets("art", [".webp", ".png", ".jpg"]);
const fonts = measureAssets("fonts", [".woff2"]);
const audio = measureAssets("audio", [".ogg", ".mp3", ".m4a", ".wav"]);
const largestArt = art.files.reduce((max, entry) => Math.max(max, entry.bytes), 0);

const rows: [string, number, number][] = [
  ["JS bundle (gzip)", bundle.jsGzipBytes, BUDGETS.jsGzipBytes],
  ["Runtime art", art.bytes, BUDGETS.artBytes],
  ["Largest art file", largestArt, BUDGETS.singleArtBytes],
  ["Fonts", fonts.bytes, BUDGETS.fontBytes],
  ["Audio", audio.bytes, BUDGETS.audioBytes],
];

let failed = false;
console.info("Budget".padEnd(20), "Size".padStart(12), "Limit".padStart(12), "Status");
for (const [label, size, limit] of rows) {
  const ok = size <= limit;
  failed ||= !ok;
  console.info(label.padEnd(20), kb(size).padStart(12), kb(limit).padStart(12), ok ? "ok" : "OVER");
}
console.info(`JS files: ${bundle.jsFiles.length}, raw ${kb(bundle.jsRawBytes)}`);
console.info(
  `Art files: ${art.files.length}, font files: ${fonts.files.length}, audio files: ${audio.files.length}`,
);
process.exit(failed ? 1 : 0);
