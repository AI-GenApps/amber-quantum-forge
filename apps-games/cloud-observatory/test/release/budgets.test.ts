import { dirname, join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { entriesIn, PUBLIC, readText, sizeOf, walk } from "./paths";

const FONTS = join(PUBLIC, "fonts");
const AUDIO = join(PUBLIC, "audio");
const ART = join(PUBLIC, "art");

describe("asset budgets", () => {
  it("woff2 fonts total at most 400,000 bytes", () => {
    const entries = entriesIn(FONTS, ".woff2");
    const report = assertAssetBudget(entries, { totalBytes: 400_000 });
    console.info(
      `fonts: ${entries.length} woff2 files, ${report.totalBytes} bytes (budget 400000)`,
    );
    expect(entries).toHaveLength(4);
  });

  it("audio totals at most 2,500,000 bytes", () => {
    const entries = entriesIn(AUDIO, ".mp3");
    const report = assertAssetBudget(entries, { totalBytes: 2_500_000 });
    console.info(`audio: ${entries.length} mp3 files, ${report.totalBytes} bytes (budget 2500000)`);
    expect(entries).toHaveLength(14);
  });

  it("art totals at most 8,000,000 bytes and no file exceeds 600,000", () => {
    const entries = entriesIn(ART, ".webp");
    const report = assertAssetBudget(entries, { totalBytes: 8_000_000, perFileBytes: 600_000 });
    console.info(`art: ${entries.length} webp files, ${report.totalBytes} bytes (budget 8000000)`);
    expect(walk(ART)).toHaveLength(entries.length);
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe("licences", () => {
  it("every font family folder holds an OFL.txt that states the SIL Open Font License", () => {
    const families = new Set(entriesIn(FONTS, ".woff2").map((entry) => dirname(entry.path)));
    expect(families.size).toBe(2);
    for (const folder of families) {
      const licence = join(folder, "OFL.txt");
      expect(sizeOf(licence), licence).toBeGreaterThan(1000);
      expect(readText(licence)).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });

  it("every audio file has a LICENSES.md row with a source URL and CC0", () => {
    const sheet = readText(join(AUDIO, "LICENSES.md"));
    const rows = new Map(
      sheet
        .split("\n")
        .filter((line) => /^\|\s*`[^`]+\.mp3`/.test(line))
        .map((line) => line.split("|").map((cell) => cell.trim()))
        .map((cells) => [(cells[1] ?? "").replaceAll("`", ""), cells] as const),
    );
    const files = entriesIn(AUDIO, ".mp3").map((entry) => entry.path.split("/").pop() ?? "");
    expect([...rows.keys()].sort()).toEqual(files.slice().sort());
    for (const file of files) {
      const cells = rows.get(file) ?? [];
      expect(cells[2], `${file} source`).toMatch(/^https:\/\/(kenney\.nl|opengameart\.org)\/\S+$/);
      expect(cells[3], `${file} licence`).toBe("CC0");
    }
  });
});
