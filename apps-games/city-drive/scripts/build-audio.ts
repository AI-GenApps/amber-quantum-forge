/**
 * Builds the shipped CC0 audio from downloaded sources (MP3 only, via ffmpeg).
 *
 *   bun scripts/build-audio.ts --raw <dir> --zips <dir> [--date YYYY-MM-DD]
 *
 * --raw   directory with one folder per source id (see audio/catalog.ts), each holding the
 *         extracted download. Untrusted data: files are only read and decoded by ffmpeg.
 * --zips  directory with the downloaded archives/files; their SHA-256 goes into the licence
 *         records. Without it, existing records are verified instead.
 *
 * Without --raw (a fresh checkout) only the committed manifest, budget and licence records are
 * verified. Idempotent: a second run over the same inputs rewrites byte-identical files.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type AudioManifest, validateAudioManifest } from "../src/audio/manifest";
import { MISSING, SOUNDS, SOURCES } from "./audio/catalog";
import { encodeSound } from "./audio/encode";
import { renderAudioLicence, verifyAudioLicence, writeAudioLicence } from "./audio/licences";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const licencesDir = join(appDir, "assets-src/LICENSES");
const outDir = join(appDir, "public/assets/audio");

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function licenceIds(): Set<string> {
  return new Set(
    readdirSync(licencesDir)
      .filter((n) => n.startsWith("audio-") && n.endsWith(".txt"))
      .map((n) => n.slice(0, -4)),
  );
}

function verifyCommitted(): void {
  const manifest = JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")) as AudioManifest;
  const problems = [
    ...validateAudioManifest(manifest, licenceIds()),
    ...SOURCES.flatMap((s) => verifyAudioLicence(licencesDir, s)),
  ];
  if (problems.length > 0)
    throw new Error(`Committed audio is invalid:\n- ${problems.join("\n- ")}`);
  console.log(
    `raw audio not found (see assets-src/README.md): verified ${manifest.sounds.length} committed sounds, ${manifest.totalBytes} bytes and licence records`,
  );
}

function main(): void {
  const rawArg = arg("raw");
  if (!rawArg || !existsSync(resolve(rawArg))) {
    verifyCommitted();
    return;
  }
  const rawDir = resolve(rawArg);
  const zipsDir = arg("zips") ? resolve(arg("zips") as string) : undefined;
  const date = arg("date") ?? new Date().toISOString().slice(0, 10);
  mkdirSync(outDir, { recursive: true });
  const sounds = SOUNDS.map((spec) => encodeSound(spec, rawDir, outDir));
  if (zipsDir) {
    for (const source of SOURCES) {
      const used = SOUNDS.filter((s) => s.source === source.id).map((s) => s.input);
      const text = renderAudioLicence(source, rawDir, zipsDir, date, used);
      writeAudioLicence(licencesDir, source, text);
    }
  }
  const manifest: AudioManifest = {
    version: 1,
    totalBytes: sounds.reduce((sum, s) => sum + s.bytes, 0),
    sounds,
    procedural: [],
  };
  const problems = [
    ...validateAudioManifest(manifest, licenceIds()),
    ...SOURCES.flatMap((s) => verifyAudioLicence(licencesDir, s)),
  ];
  if (problems.length > 0) throw new Error(`Audio build is invalid:\n- ${problems.join("\n- ")}`);
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const m of MISSING) console.log(`not shipped: ${m.id} (${m.reason})`);
  console.log(`wrote ${sounds.length} sounds, ${manifest.totalBytes} bytes`);
}

main();
