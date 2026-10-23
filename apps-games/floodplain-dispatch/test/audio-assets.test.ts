import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUDIO_SLOTS, audioUrl, loadableSlots, SOUND_IDS } from "../src/audio/slots";
import { AUDIO_CREDITS } from "../src/data/credits";

const AUDIO_DIR = join(import.meta.dirname, "../public/audio");
const INDEX = readFileSync(
  join(import.meta.dirname, "../../../.agents/games/floodplain-dispatch/assets-index.md"),
  "utf8",
);

const SFX_LIMIT = 60 * 1024;
const MUSIC_LIMIT = 600 * 1024;
const TOTAL_LIMIT = 2 * 1024 * 1024;

interface LicenseRow {
  slot: string;
  file: string;
  author: string;
  source: string;
  licence: string;
  downloaded: string;
  sha: string;
}

function licenseRows(): LicenseRow[] {
  const text = readFileSync(join(AUDIO_DIR, "LICENSES.md"), "utf8");
  const rows: LicenseRow[] = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("| `")) continue;
    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    const [
      slot = "",
      file = "",
      author = "",
      source = "",
      licence = "",
      downloaded = "",
      sha = "",
    ] = cells;
    rows.push({
      slot: slot.replaceAll("`", ""),
      file: file.replaceAll("`", ""),
      author,
      source,
      licence,
      downloaded,
      sha: sha.replaceAll("`", ""),
    });
  }
  return rows;
}

const audioFiles = readdirSync(AUDIO_DIR).filter((name) => name.endsWith(".ogg"));
const sha256 = (file: string): string =>
  createHash("sha256")
    .update(readFileSync(join(AUDIO_DIR, file)))
    .digest("hex");

describe("audio slot table", () => {
  it("has the 25 sound slots and 2 music loops from the assets index", () => {
    expect(AUDIO_SLOTS.filter((slot) => slot.kind !== "music")).toHaveLength(25);
    expect(AUDIO_SLOTS.filter((slot) => slot.kind === "music")).toHaveLength(2);
    expect(new Set(SOUND_IDS).size).toBe(27);
    for (const id of SOUND_IDS) expect(INDEX, id).toContain(`\`${id}\``);
  });

  it("gives every slot a file or an explicit silent reason", () => {
    for (const slot of AUDIO_SLOTS) {
      const file: string | null = slot.file;
      if (file === null) {
        const silent = (slot as { silent?: string }).silent;
        expect(silent?.length ?? 0, slot.id).toBeGreaterThan(5);
      } else {
        expect(existsSync(join(AUDIO_DIR, file)), slot.id).toBe(true);
      }
      expect(slot.gain).toBeGreaterThan(0);
      expect(slot.gain).toBeLessThanOrEqual(1);
    }
  });

  it("loops only the water loop and the two music tracks", () => {
    const looping = AUDIO_SLOTS.filter((slot) => slot.loop).map((slot) => slot.id);
    expect(looping).toEqual(["water-loop", "music-menu", "music-play"]);
  });

  it("builds urls under /audio", () => {
    expect(audioUrl("ui-tap.ogg")).toBe("/audio/ui-tap.ogg");
    expect(loadableSlots()).toHaveLength(27);
  });
});

describe("audio files", () => {
  it("ships exactly the files the slots name", () => {
    const named = AUDIO_SLOTS.map((slot) => slot.file).filter((file) => file !== null);
    expect([...audioFiles].sort()).toEqual([...named].sort());
  });

  it("are Ogg files within the size budgets and 2 MB in total", () => {
    let total = 0;
    for (const slot of AUDIO_SLOTS) {
      const file: string | null = slot.file;
      if (file === null) continue;
      const bytes = readFileSync(join(AUDIO_DIR, file));
      expect(bytes.subarray(0, 4).toString("latin1"), file).toBe("OggS");
      const limit = slot.kind === "music" ? MUSIC_LIMIT : SFX_LIMIT;
      expect(bytes.length, file).toBeLessThanOrEqual(limit);
      expect(bytes.length, file).toBeGreaterThan(500);
      total += bytes.length;
    }
    expect(total).toBeLessThanOrEqual(TOTAL_LIMIT);
  });
});

describe("audio licences", () => {
  const rows = licenseRows();

  it("has one row per file and no file without a row", () => {
    expect(rows.map((row) => row.file).sort()).toEqual([...audioFiles].sort());
    expect(new Set(rows.map((row) => row.slot)).size).toBe(rows.length);
  });

  it("records source url, CC0 licence, author, date and a matching SHA-256 for every file", () => {
    for (const row of rows) {
      expect(row.source, row.file).toMatch(
        /^https:\/\/(kenney\.nl\/assets\/[a-z-]+|opengameart\.org\/content\/[a-z0-9-]+)$/,
      );
      expect(row.licence, row.file).toContain("CC0");
      expect(row.author.length, row.file).toBeGreaterThan(2);
      expect(row.downloaded, row.file).toBe("2026-10-23");
      expect(row.sha, row.file).toMatch(/^[0-9a-f]{64}$/);
      expect(row.sha, row.file).toBe(sha256(row.file));
    }
  });

  it("copies the pack and page licence records", () => {
    const records = readdirSync(join(AUDIO_DIR, "licenses"));
    const packs = new Set(
      rows
        .map((row) => /kenney\.nl\/assets\/([a-z-]+)/.exec(row.source)?.[1])
        .filter((pack): pack is string => pack !== undefined),
    );
    for (const pack of packs) {
      expect(records).toContain(`kenney-${pack}.txt`);
      const body = readFileSync(join(AUDIO_DIR, "licenses", `kenney-${pack}.txt`), "utf8");
      expect(body).toMatch(/CC0/);
    }
    const pages = rows
      .map((row) => /opengameart\.org\/content\/([a-z0-9-]+)/.exec(row.source)?.[1])
      .filter((page): page is string => page !== undefined);
    expect(pages.length).toBeGreaterThan(0);
    for (const page of new Set(pages)) {
      const body = readFileSync(join(AUDIO_DIR, "licenses", `opengameart-${page}.txt`), "utf8");
      expect(body).toContain("License(s): CC0");
    }
  });

  it("credits screen data matches LICENSES.md row for row", () => {
    expect(AUDIO_CREDITS).toHaveLength(rows.length);
    for (const row of rows) {
      const credit = AUDIO_CREDITS.find((entry) => entry.name === row.file);
      expect(credit, row.file).toBeDefined();
      expect(credit?.source).toBe(row.source);
      expect(credit?.licence).toBe(row.licence);
      expect(credit?.note).toBe(row.author);
    }
  });

  it("sizes in the assets index table are not stale for the total", () => {
    const total = audioFiles.reduce((sum, file) => sum + statSync(join(AUDIO_DIR, file)).size, 0);
    expect(INDEX).toContain(`${total.toLocaleString("en-US")} bytes`);
  });
});
