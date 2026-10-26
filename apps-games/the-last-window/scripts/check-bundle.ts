import {
  artFiles,
  artLimitFor,
  audioFiles,
  fontFiles,
  kib,
  LIMITS,
  measureBundle,
  mib,
  sum,
} from "./budget-lib";

interface Row {
  group: string;
  used: number;
  limit: number;
  format: (bytes: number) => string;
}

const bundle = await measureBundle();
const art = artFiles();
const overFile = art.filter((file) => file.bytes > artLimitFor(file.name));

const rows: Row[] = [
  { group: "JS bundle (gzip)", used: bundle.gzipBytes, limit: LIMITS.jsGzip, format: kib },
  { group: "Runtime art", used: sum(art), limit: LIMITS.art, format: mib },
  { group: "Fonts (woff2)", used: sum(fontFiles()), limit: LIMITS.fonts, format: kib },
  { group: "Audio (ogg)", used: sum(audioFiles()), limit: LIMITS.audio, format: mib },
];

console.info("Group             Used         Limit        Status");
for (const row of rows) {
  const status = row.used <= row.limit ? "ok" : "OVER";
  console.info(
    `${row.group.padEnd(17)} ${row.format(row.used).padEnd(12)} ${row.format(row.limit).padEnd(12)} ${status}`,
  );
}

console.info(`\nJS files: ${bundle.files.length}, raw ${kib(bundle.rawBytes)}`);
for (const file of bundle.files) {
  console.info(
    `  ${file.name.padEnd(36)} ${kib(file.bytes).padStart(12)} raw ${kib(file.gzipBytes).padStart(12)} gzip`,
  );
}

console.info(`\nArt files over their per-file limit: ${overFile.length}`);
for (const file of overFile) console.info(`  ${file.name}: ${file.bytes} bytes`);

const failed = rows.some((row) => row.used > row.limit) || overFile.length > 0;
process.exit(failed ? 1 : 0);
