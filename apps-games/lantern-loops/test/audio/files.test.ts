import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget, checkAssetBudget } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { audioCredits } from "../../src/audio/credits";
import { MUSIC_FILE, MUSIC_ID, SOUND_IDS, SOUNDS } from "../../src/audio/sounds";
import { AUDIO_RECORDS, type AudioRecord } from "../../src/audio/sources";

const APP = join(import.meta.dirname, "../..");
const AUDIO_DIR = join(APP, "public/audio");
const REPO = join(APP, "../..");
const KB = 1024;

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/** Problems between the files on disk and the records; empty when they match. */
function verifyAudio(
  files: ReadonlyMap<string, Uint8Array>,
  records: readonly AudioRecord[],
): string[] {
  const problems: string[] = [];
  const recorded = new Map(records.map((record) => [record.file, record]));
  for (const name of files.keys()) {
    if (!recorded.has(name)) problems.push(`${name} has no record`);
  }
  for (const record of records) {
    const bytes = files.get(record.file);
    if (bytes === undefined) problems.push(`${record.file} is recorded but missing`);
    else if (sha256(bytes) !== record.sha256) problems.push(`${record.file} hash mismatch`);
    else if (bytes.byteLength !== record.bytes) problems.push(`${record.file} size mismatch`);
  }
  return problems;
}

function readAudio(): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const entry of readdirSync(AUDIO_DIR, { withFileTypes: true })) {
    if (entry.isFile()) out.set(entry.name, readFileSync(join(AUDIO_DIR, entry.name)));
  }
  return out;
}

describe("audio provenance", () => {
  it("matches every file on disk to a record and recomputes the SHA-256", () => {
    expect(verifyAudio(readAudio(), AUDIO_RECORDS)).toEqual([]);
  });

  it("fails on an unrecorded, missing or altered file (the checker works)", () => {
    const real = readAudio();
    const extra = new Map(real).set("stray.mp3", new Uint8Array([1, 2, 3]));
    expect(verifyAudio(extra, AUDIO_RECORDS)).toEqual(["stray.mp3 has no record"]);
    const missing = new Map(real);
    missing.delete("ui-tap.mp3");
    expect(verifyAudio(missing, AUDIO_RECORDS)).toEqual(["ui-tap.mp3 is recorded but missing"]);
    const altered = new Map(real).set("ui-tap.mp3", new Uint8Array([0, 1]));
    expect(verifyAudio(altered, AUDIO_RECORDS)).toEqual(["ui-tap.mp3 hash mismatch"]);
  });

  it("records the pack page, the licence and both hashes for every file", () => {
    expect(AUDIO_RECORDS).toHaveLength(SOUND_IDS.length + 1);
    for (const record of AUDIO_RECORDS) {
      expect(record.licence, record.file).toBe("CC0 1.0");
      expect(record.licenceUrl, record.file).toMatch(
        /creativecommons\.org\/publicdomain\/zero\/1\.0\/$/,
      );
      expect(record.packUrl, record.file).toMatch(
        /^https:\/\/(kenney\.nl\/assets\/[a-z-]+|opengameart\.org\/content\/[a-z-]+)$/,
      );
      expect(record.sourceSha256, record.file).toMatch(/^[0-9a-f]{64}$/);
      expect(record.sha256, record.file).toMatch(/^[0-9a-f]{64}$/);
      expect(record.date, record.file).toBe("2026-10-23");
      expect(record.original.length, record.file).toBeGreaterThan(3);
      const licence = join(AUDIO_DIR, record.licenceFile);
      expect(existsSync(licence), licence).toBe(true);
      expect(readFileSync(licence, "utf8")).toMatch(/CC0|Creative Commons Zero/);
    }
  });

  it("states the CC0 licence of every pack in its licence text", () => {
    const names = readdirSync(join(AUDIO_DIR, "LICENSES")).sort();
    expect(names).toEqual([
      "kenney-impact-sounds.txt",
      "kenney-interface-sounds.txt",
      "kenney-music-jingles.txt",
      "kenney-ui-audio.txt",
      "opengameart-calm-loop.txt",
    ]);
    for (const name of names) {
      const text = readFileSync(join(AUDIO_DIR, "LICENSES", name), "utf8");
      expect(text, name).toMatch(/CC0/);
      expect(text, name).toMatch(/Source page: https:\/\//);
    }
  });

  it("repeats every hash in the assets index", () => {
    const index = readFileSync(join(REPO, ".agents/games/lantern-loops/assets-index.md"), "utf8");
    for (const record of AUDIO_RECORDS) {
      expect(index, record.file).toContain(record.sha256);
      expect(index, record.file).toContain(record.packUrl);
    }
  });

  it("never synthesizes sound in code", () => {
    const hits: string[] = [];
    const scan = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) scan(path);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const text = readFileSync(path, "utf8");
          if (/createOscillator|OscillatorNode|createBuffer\(|AudioWorklet/.test(text)) {
            hits.push(path);
          }
        }
      }
    };
    scan(join(APP, "src"));
    expect(hits).toEqual([]);
  });
});

describe("audio manifest and budgets", () => {
  it("maps all 17 event ids, plus the music, to existing recorded files", () => {
    expect(SOUND_IDS).toHaveLength(17);
    const recordFor = new Map(AUDIO_RECORDS.map((record) => [record.id, record]));
    for (const id of SOUND_IDS) {
      const file = SOUNDS[id].file;
      expect(file).toBe(`${id}.mp3`);
      expect(existsSync(join(AUDIO_DIR, file)), file).toBe(true);
      expect(recordFor.get(id)?.file).toBe(file);
      expect(SOUNDS[id].volume).toBeGreaterThan(0);
      expect(SOUNDS[id].volume).toBeLessThanOrEqual(1);
    }
    expect(recordFor.get(MUSIC_ID)?.file).toBe(MUSIC_FILE);
    expect(existsSync(join(AUDIO_DIR, MUSIC_FILE))).toBe(true);
  });

  it("lists the same ids as the content plan", () => {
    const plan = readFileSync(join(REPO, ".agents/games/lantern-loops/content-plan.md"), "utf8");
    const section = plan.slice(plan.indexOf("## 10. Audio events"), plan.indexOf("## 11."));
    const ids = [...section.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
    for (const id of SOUND_IDS) expect(ids).toContain(id);
    expect(ids).toContain(MUSIC_ID);
  });

  it("keeps effects at 60 KB, the music at 1 MB and all audio at 1.5 MB", () => {
    const entries = [...readAudio()].map(([name, bytes]) => ({
      path: name,
      bytes: bytes.byteLength,
    }));
    const effects = entries.filter((entry) => entry.path !== MUSIC_FILE);
    const music = entries.filter((entry) => entry.path === MUSIC_FILE);
    expect(effects).toHaveLength(17);
    assertAssetBudget(effects, { perFileBytes: 60 * KB });
    assertAssetBudget(music, { perFileBytes: 1024 * KB });
    assertAssetBudget(entries, { totalBytes: 1.5 * 1024 * KB });
    expect(checkAssetBudget(entries, { totalBytes: 1 }).ok).toBe(false);
  });

  it("ships MP3, which Chromium, Android WebView and WKWebView all decode", () => {
    for (const [name, bytes] of readAudio()) {
      const id3 = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0) === "ID3";
      const frame = (bytes[0] ?? 0) === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0;
      expect(id3 || frame, name).toBe(true);
      expect(statSync(join(AUDIO_DIR, name)).size).toBeGreaterThan(500);
    }
  });

  it("groups the credits by pack for the About screen", () => {
    const credits = audioCredits();
    expect(credits.map((credit) => credit.packUrl).sort()).toEqual([
      "https://kenney.nl/assets/impact-sounds",
      "https://kenney.nl/assets/interface-sounds",
      "https://kenney.nl/assets/music-jingles",
      "https://kenney.nl/assets/ui-audio",
      "https://opengameart.org/content/calm-loop",
    ]);
    expect(credits.flatMap((credit) => credit.ids).sort()).toEqual([...SOUND_IDS, MUSIC_ID].sort());
  });
});
