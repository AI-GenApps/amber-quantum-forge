import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { CUE_IDS, CUES, MUSIC_FILE } from "../../src/audio/cues";

const DIR = join(import.meta.dirname, "..", "..", "public", "audio");
const at = (...parts: string[]) => join(DIR, ...parts);
const mp3Files = readdirSync(DIR).filter((name) => name.endsWith(".mp3"));

function isMp3(bytes: Buffer): boolean {
  if (bytes.subarray(0, 3).toString("latin1") === "ID3") return true;
  return bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0;
}

describe("audio files", () => {
  it("every cue and the music loop has a non-empty MP3 file", () => {
    const wanted = [...CUE_IDS.map((id) => CUES[id].file), MUSIC_FILE];
    expect(mp3Files.slice().sort()).toEqual(wanted.slice().sort());
    for (const name of wanted) {
      const bytes = readFileSync(at(name));
      expect(bytes.length, name).toBeGreaterThan(200);
      expect(isMp3(bytes), `${name} header`).toBe(true);
    }
  });

  it("total audio is at most 2,500,000 bytes", () => {
    const entries = mp3Files.map((name) => ({
      path: name,
      bytes: statSync(at(name)).size,
    }));
    const report = assertAssetBudget(entries, { totalBytes: 2_500_000, perFileBytes: 2_000_000 });
    expect(report.fileCount).toBe(14);
  });

  it("the licence sheet has a CC0 row with a source URL for every file and none extra", () => {
    const text = readFileSync(at("LICENSES.md"), "utf8");
    const rows = text
      .split("\n")
      .filter((line) => /^\|\s*`[^`]+\.mp3`/.test(line))
      .map((line) => line.split("|").map((cell) => cell.trim()));
    const listed = rows.map((cells) => (cells[1] ?? "").replaceAll("`", ""));
    expect(listed.slice().sort()).toEqual(mp3Files.slice().sort());
    for (const cells of rows) {
      expect(cells[2], cells[1]).toMatch(/^https:\/\/(kenney\.nl|opengameart\.org)\//);
      expect(cells[3], cells[1]).toBe("CC0");
      const copy = (cells[5] ?? "").replaceAll("`", "");
      expect(statSync(at(copy)).size, copy).toBeGreaterThan(0);
    }
  });

  it("each kept licence text states CC0", () => {
    const folder = at("licenses");
    const files = readdirSync(folder);
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const name of files) {
      expect(readFileSync(join(folder, name), "utf8"), name).toMatch(/CC0|Creative Commons Zero/);
    }
  });
});
