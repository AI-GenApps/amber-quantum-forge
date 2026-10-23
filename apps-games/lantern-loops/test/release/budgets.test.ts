import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { APP_DIR, BUDGETS, buildChunks, EVIDENCE_DIR, rel, sizeOf, walk } from "./paths";

const ART_EXT = /\.(webp|png|jpe?g|avif|svg)$/i;
const AUDIO_EXT = /\.(mp3|ogg|wav|m4a|opus)$/i;

function total(paths: string[]): number {
  return paths.reduce((sum, path) => sum + sizeOf(path), 0);
}

describe("size budgets", () => {
  it("stays inside the JS, art, audio and font budgets and writes budgets.json", async () => {
    const chunks = await buildChunks();
    const js = chunks
      .map((chunk) => ({
        file: chunk.fileName,
        raw: Buffer.byteLength(chunk.code),
        gzip: gzipSync(chunk.code).length,
      }))
      .sort((a, b) => a.file.localeCompare(b.file));
    const jsGzip = js.reduce((sum, chunk) => sum + chunk.gzip, 0);

    const art = [
      ...walk(join(APP_DIR, "src", "art", "files")),
      ...walk(join(APP_DIR, "public")),
    ].filter((path) => ART_EXT.test(path));
    const audio = walk(join(APP_DIR, "public", "audio")).filter((p) => AUDIO_EXT.test(p));
    const fonts = walk(join(APP_DIR, "public", "fonts")).filter((p) => p.endsWith(".woff2"));

    const report = {
      budgets: BUDGETS,
      js: { chunks: js, gzipBytes: jsGzip, rawBytes: js.reduce((s, c) => s + c.raw, 0) },
      art: { files: art.map((p) => ({ file: rel(p), bytes: sizeOf(p) })), bytes: total(art) },
      audio: {
        files: audio.length,
        largest: Math.max(0, ...audio.map(sizeOf)),
        bytes: total(audio),
      },
      fonts: fonts.map((p) => ({ file: rel(p), bytes: sizeOf(p) })),
    };
    mkdirSync(join(EVIDENCE_DIR, "08"), { recursive: true });
    writeFileSync(join(EVIDENCE_DIR, "08", "budgets.json"), `${JSON.stringify(report, null, 2)}\n`);

    const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;
    const rows: string[][] = [
      ["Budget", "Actual", "Limit"],
      ["JS gzip", kb(jsGzip), kb(BUDGETS.jsGzipBytes)],
      ["Art", kb(report.art.bytes), kb(BUDGETS.artBytes)],
      ["Audio", kb(report.audio.bytes), kb(BUDGETS.audioBytes)],
      ...fonts.map((p) => [basename(p), kb(sizeOf(p)), kb(BUDGETS.fontBytes)]),
    ];
    console.log(rows.map((r) => r.map((c, k) => c.padEnd(k === 0 ? 28 : 14)).join("")).join("\n"));

    expect(js.length).toBeGreaterThan(0);
    expect(jsGzip).toBeLessThanOrEqual(BUDGETS.jsGzipBytes);
    expect(report.art.bytes).toBeLessThanOrEqual(BUDGETS.artBytes);
    expect(report.audio.bytes).toBeLessThanOrEqual(BUDGETS.audioBytes);
    expect(fonts.length).toBe(2);
    for (const font of fonts)
      expect(sizeOf(font), rel(font)).toBeLessThanOrEqual(BUDGETS.fontBytes);
  }, 120000);

  it("ships the audio and font files the budgets cover", () => {
    expect(walk(join(APP_DIR, "public", "audio")).filter((p) => AUDIO_EXT.test(p))).toHaveLength(
      18,
    );
    expect(walk(join(APP_DIR, "src", "art", "files")).filter((p) => ART_EXT.test(p))).toHaveLength(
      1,
    );
  });
});
