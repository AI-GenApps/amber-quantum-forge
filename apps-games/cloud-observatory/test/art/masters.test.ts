import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { loadSlotTable } from "../../scripts/art-lib";
import { ART_SLOTS } from "../../src/ui/art-slots";
import {
  APP,
  acceptedEntries,
  buildReport,
  EVIDENCE,
  isWebp,
  MASTERS,
  provenanceRows,
  REPO,
  slotTableRows,
} from "./paths";

const table = loadSlotTable(join(APP, "scripts", "art-slots.json"));
const accepted = acceptedEntries();
const ids = accepted.map((entry) => entry.assetId).sort();

describe("accepted list", () => {
  it("names only real slots, once each", () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(ART_SLOTS as readonly string[]).toContain(id);
  });

  it("is the designer's list: all 33 slots", () => {
    expect(ids).toEqual([...ART_SLOTS].sort());
  });

  it("names a review file that accepts each slot", () => {
    for (const entry of accepted) {
      const file = join(EVIDENCE, "review", `${entry.batch}-round-${entry.round}.md`);
      expect(existsSync(file), entry.assetId).toBe(true);
      const lines = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.includes(entry.assetId));
      expect(
        lines.some((line) => line.includes("ACCEPTED")),
        entry.assetId,
      ).toBe(true);
    }
  });
});

describe("masters", () => {
  it("has one WebP master per accepted slot and none for any other slot", () => {
    const files = readdirSync(MASTERS).sort();
    expect(files).toEqual(ids.map((id) => `${id}.webp`));
    for (const file of files) expect(isWebp(join(MASTERS, file)), file).toBe(true);
  });

  it("keeps the generation size of each slot", async () => {
    for (const id of ids) {
      const row = table.slots.find((slot) => slot.id === id);
      const meta = await sharp(join(MASTERS, `${id}.webp`)).metadata();
      expect([meta.width, meta.height], id).toEqual(row?.master);
      expect(meta.hasAlpha, id).toBe(row?.transparent === true);
    }
  });

  it("matches the build report", () => {
    const report = buildReport();
    expect(report.map((row) => row.id).sort()).toEqual(ids);
    for (const row of report) {
      expect(statSync(join(MASTERS, `${row.id}.webp`)).size).toBe(row.masterBytes);
      if (row.bundled) {
        expect(statSync(join(REPO, "apps-games/cloud-observatory", row.bundled.file)).size).toBe(
          row.bundled.bytes,
        );
      }
    }
  });
});

describe("evidence", () => {
  it("keeps the art bible, every review and the accepted manifest", () => {
    expect(existsSync(join(EVIDENCE, "art-bible.md"))).toBe(true);
    const reviews = readdirSync(join(EVIDENCE, "review")).filter((name) =>
      /^(b\d|retry)-round-\d\.md$/.test(name),
    );
    expect(reviews.length).toBe(18);
    for (const name of reviews) {
      expect(readFileSync(join(EVIDENCE, "review", name), "utf8")).toMatch(
        /ACCEPTED|REJECTED|accepted/i,
      );
    }
  });
});

describe("assets-index.md", () => {
  it("has a provenance row for each accepted slot and none for any other", () => {
    expect(
      provenanceRows()
        .map((row) => row.slot)
        .sort(),
    ).toEqual(ids);
    for (const row of provenanceRows()) {
      const entry = accepted.find((candidate) => candidate.assetId === row.slot);
      expect(row.cells.join(" "), row.slot).toContain(`${entry?.batch}`);
      expect(row.cells.join(" "), row.slot).toContain(`round ${entry?.round}`);
      expect(row.cells.join(" "), row.slot).toContain(`masters/${row.slot}.webp`);
    }
  });

  it("marks each of the 33 slots accepted or placeholder, matching the accepted list", () => {
    const rows = slotTableRows();
    expect(rows).toHaveLength(33);
    for (const row of rows) {
      const status = row.cells[row.cells.length - 2];
      expect(status, row.slot).toBe(ids.includes(row.slot) ? "accepted" : "placeholder");
    }
  });
});
