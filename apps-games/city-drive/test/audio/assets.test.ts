import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MISSING, SOUNDS, SOURCES } from "../../scripts/audio/catalog";
import {
  type AudioManifest,
  MAX_AUDIO_BYTES,
  SOUND_IDS,
  validateAudioManifest,
} from "../../src/audio/manifest";

const APP = join(import.meta.dirname, "../..");
const AUDIO_DIR = join(APP, "public/assets/audio");
const LICENCES = join(APP, "assets-src/LICENSES");
const manifest = JSON.parse(
  readFileSync(join(AUDIO_DIR, "manifest.json"), "utf8"),
) as AudioManifest;
const licenceIds = new Set(
  readdirSync(LICENCES)
    .filter((n) => n.startsWith("audio-") && n.endsWith(".txt"))
    .map((n) => n.slice(0, -4)),
);

describe("shipped audio", () => {
  it("passes manifest validation: shape, licences, byte total and budget", () => {
    expect(validateAudioManifest(manifest, licenceIds)).toEqual([]);
  });

  it("is at most 3 MB in total, measured on the files themselves", () => {
    const onDisk = readdirSync(AUDIO_DIR)
      .filter((n) => n.endsWith(".mp3"))
      .reduce((sum, n) => sum + statSync(join(AUDIO_DIR, n)).size, 0);
    expect(onDisk).toBe(manifest.totalBytes);
    expect(onDisk).toBeLessThanOrEqual(3 * 1024 * 1024);
    expect(MAX_AUDIO_BYTES).toBeLessThanOrEqual(3 * 1024 * 1024);
  });

  it("has every listed file, byte-exact, with its recorded SHA-256, and no strays", () => {
    for (const sound of manifest.sounds) {
      const path = join(AUDIO_DIR, sound.file);
      expect(existsSync(path), sound.file).toBe(true);
      const bytes = readFileSync(path);
      expect(bytes.length, sound.file).toBe(sound.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), sound.file).toBe(sound.sha256);
    }
    const listed = new Set(manifest.sounds.map((s) => s.file));
    const mp3 = readdirSync(AUDIO_DIR).filter((n) => n !== "manifest.json");
    expect(mp3.filter((n) => !listed.has(n))).toEqual([]);
  });

  it("is MP3 only", () => {
    for (const sound of manifest.sounds) {
      const head = readFileSync(join(AUDIO_DIR, sound.file)).subarray(0, 3).toString("latin1");
      expect(
        head === "ID3" || readFileSync(join(AUDIO_DIR, sound.file))[0] === 0xff,
        sound.file,
      ).toBe(true);
    }
  });

  it("gives every sound a licence record, or marks it procedural; nothing is both or neither", () => {
    const shipped = new Set(manifest.sounds.map((s) => s.id));
    const procedural = new Set(manifest.procedural.map((p) => p.id));
    const missing = new Set(MISSING.map((m) => m.id));
    for (const id of SOUND_IDS) {
      const states = [shipped.has(id), procedural.has(id), missing.has(id)].filter(Boolean);
      expect(states.length, `${id} must be shipped, procedural or recorded as missing`).toBe(1);
    }
    for (const sound of manifest.sounds) expect(licenceIds.has(sound.source), sound.id).toBe(true);
  });

  it("matches the build catalogue (what the script would produce)", () => {
    expect(manifest.sounds.map((s) => [s.id, s.kind, s.source])).toEqual(
      SOUNDS.map((s) => [s.id, s.kind, s.source]),
    );
  });

  it("is the engine loop pair, the three thuds, the stings, music and the UI sounds", () => {
    const ids = manifest.sounds.map((s) => s.id);
    for (const id of [
      "engine_idle",
      "engine_rev",
      "collision_light",
      "collision_medium",
      "collision_heavy",
      "horn",
      "checkpoint",
      "pickup",
      "success",
      "fail",
      "ui_tap",
      "music_menu",
      "music_drive",
    ] as const) {
      expect(ids).toContain(id);
    }
  });
});

describe("audio licence records", () => {
  it("exist for every source with URL, author, CC0, date and SHA-256 per download", () => {
    expect(licenceIds.size).toBe(SOURCES.length);
    for (const source of SOURCES) {
      const text = readFileSync(join(LICENCES, `${source.id}.txt`), "utf8");
      expect(text, source.id).toContain(`Source URL: ${source.pageUrl}`);
      expect(text, source.id).toMatch(/^Author: .+/m);
      expect(text, source.id).toMatch(/^Licence: Creative Commons Zero 1\.0 \(CC0\)/m);
      expect(text, source.id).toMatch(/^Download date: \d{4}-\d{2}-\d{2}$/m);
      const hashes = text.match(/^SHA-256: [0-9a-f]{64}$/gm) ?? [];
      expect(hashes, source.id).toHaveLength(source.downloads.length);
      for (const download of source.downloads)
        expect(text).toContain(`Download URL: ${download.url}`);
    }
  });

  it("only uses CC0 sources, never Quaternius or a non-CC0 licence", () => {
    for (const source of SOURCES) {
      const text = readFileSync(join(LICENCES, `${source.id}.txt`), "utf8");
      expect(text).not.toMatch(/quaternius/i);
      expect(text).not.toMatch(/CC[ -]BY|attribution-/i);
    }
  });

  it("embeds the pack's own License.txt for Kenney packs", () => {
    for (const source of SOURCES.filter((s) => s.licenceBasis === "pack-license-file")) {
      const text = readFileSync(join(LICENCES, `${source.id}.txt`), "utf8");
      expect(text).toContain("Creative Commons Zero, CC0");
      expect(text).toContain("Kenney");
    }
  });
});

describe("validateAudioManifest", () => {
  const ok = manifest;
  const copy = (): AudioManifest => structuredClone(ok);

  it("catches a missing licence, a bad hash, a wrong total and an over-budget total", () => {
    const noLicence = copy();
    (noLicence.sounds[0] as { source: string }).source = "audio-nowhere";
    expect(validateAudioManifest(noLicence, licenceIds).join()).toContain("no licence record");

    const badHash = copy();
    (badHash.sounds[0] as { sha256: string }).sha256 = "xyz";
    expect(validateAudioManifest(badHash, licenceIds).join()).toContain("bad SHA-256");

    const wrongTotal = copy();
    wrongTotal.totalBytes += 1;
    expect(validateAudioManifest(wrongTotal, licenceIds).join()).toContain("does not match");

    const big = copy();
    (big.sounds[0] as { bytes: number }).bytes = MAX_AUDIO_BYTES + 1;
    big.totalBytes = big.sounds.reduce((n, s) => n + s.bytes, 0);
    expect(validateAudioManifest(big, licenceIds).join()).toContain("over the");
  });

  it("rejects non-mp3 files and procedural notes that do not say so", () => {
    const wav = copy();
    (wav.sounds[0] as { file: string }).file = "x.wav";
    expect(validateAudioManifest(wav, licenceIds).join()).toContain("not an .mp3");

    const note = copy();
    note.procedural.push({ id: "skid", note: "generated CC0" });
    expect(validateAudioManifest(note, licenceIds).join()).toContain(
      "procedural (no licence needed)",
    );
  });
});
