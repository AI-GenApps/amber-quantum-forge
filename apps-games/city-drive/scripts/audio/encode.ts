import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SoundEntry } from "../../src/audio/manifest";
import type { SoundSpec } from "./catalog";

const FFMPEG = process.env.FFMPEG ?? "/home/linuxbrew/.linuxbrew/bin/ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "/home/linuxbrew/.linuxbrew/bin/ffprobe";

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return result.stdout;
}

/** MP3 only (the dry-run decision): the one format every WebView and browser decodes. */
export function encodeSound(spec: SoundSpec, rawDir: string, outDir: string): SoundEntry {
  const input = join(rawDir, spec.source, spec.input);
  if (!existsSync(input)) throw new Error(`missing source file ${input}`);
  const file = `${spec.id}.mp3`;
  const output = join(outDir, file);
  run(FFMPEG, [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-map_metadata",
    "-1",
    "-ac",
    String(spec.channels),
    "-ar",
    String(spec.rate),
    "-c:a",
    "libmp3lame",
    "-b:a",
    `${spec.kbps}k`,
    "-fflags",
    "+bitexact",
    "-flags:a",
    "+bitexact",
    output,
  ]);
  const durationS = Number(
    run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", output]),
  );
  return {
    id: spec.id,
    file,
    kind: spec.kind,
    bytes: statSync(output).size,
    sha256: createHash("sha256").update(readFileSync(output)).digest("hex"),
    durationS: Math.round(durationS * 1000) / 1000,
    source: spec.source,
  };
}
