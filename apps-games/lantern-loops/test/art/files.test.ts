// @vitest-environment node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ART_SPECS, specOf, TOTAL_SHIPPED_ART_BYTES } from "../../scripts/art-spec";
import { ART_SLOTS, SLOT_IDS } from "../../src/art/slots";

const APP = join(import.meta.dirname, "../..");
const REPO = join(APP, "../..");
const EVIDENCE = join(REPO, ".agents/resources/2026-10-23/web-games/lantern-loops/art");
const KB = join(REPO, ".agents/games/lantern-loops");
const FILES_DIR = join(APP, "src/art/files");

interface FileRecord {
  path: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
}
interface SlotRecord {
  slot: string;
  round: number;
  batch: string;
  transparent: boolean;
  source: FileRecord;
  master: FileRecord;
  shipped: FileRecord | null;
  cornerAlpha: number[];
  centreEdgeDensity?: number;
}

const sha256 = (data: Uint8Array): string => createHash("sha256").update(data).digest("hex");
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

const manifest = readJson<{ assetId: string; file: string }[]>(
  join(EVIDENCE, "accepted-manifest.json"),
);
const report = readJson<{ slots: SlotRecord[] }>(join(EVIDENCE, "report.json"));
const shippedNames = readdirSync(FILES_DIR).filter((name) => name.endsWith(".webp"));
const masterNames = readdirSync(join(EVIDENCE, "masters")).filter((n) => n.endsWith(".webp"));
const acceptedIds = manifest.map((entry) => entry.assetId);

function tableRows(markdown: string, heading: string): string[][] {
  const start = markdown.indexOf(heading);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  const lines = markdown.slice(start).split("\n").slice(1);
  const rows: string[][] = [];
  let started = false;
  for (const line of lines) {
    if (!line.startsWith("|")) {
      if (started) break;
      continue;
    }
    started = true;
    rows.push(
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  }
  return rows.slice(2);
}

const stripTicks = (cell: string): string => cell.replaceAll("`", "");

describe("no unreviewed file", () => {
  it("only slots of the committed accepted manifest have a master or a shipped file", () => {
    expect(new Set(acceptedIds).size).toBe(acceptedIds.length);
    for (const id of acceptedIds) expect(SLOT_IDS as readonly string[]).toContain(id);
    expect(masterNames.sort()).toEqual(acceptedIds.map((id) => `${id}.webp`).sort());
    const bundledAccepted = acceptedIds.filter((id) => specOf(id)?.shipped != null);
    expect(shippedNames.sort()).toEqual(bundledAccepted.map((id) => `${id}.webp`).sort());
    expect(report.slots.map((row) => row.slot).sort()).toEqual([...acceptedIds].sort());
  });

  it("names every shipped file after a bundled slot", () => {
    for (const name of shippedNames) {
      const slot = ART_SLOTS.find((entry) => entry.file === name);
      expect(slot?.inApp, name).toBe(true);
    }
  });
});

describe("shipped files", () => {
  it("are WebP at 2x display size with the recorded size and hash", async () => {
    for (const row of report.slots) {
      if (row.shipped === null) continue;
      const spec = specOf(row.slot);
      const path = join(APP, row.shipped.path);
      const data = readFileSync(path);
      expect(data.subarray(0, 4).toString("latin1"), row.slot).toBe("RIFF");
      expect(data.subarray(8, 12).toString("latin1"), row.slot).toBe("WEBP");
      const meta = await sharp(data).metadata();
      expect(meta.format, row.slot).toBe("webp");
      expect({ width: meta.width, height: meta.height }, row.slot).toEqual(spec?.shipped);
      expect(sha256(data), row.slot).toBe(row.shipped.sha256);
      expect(data.length, row.slot).toBe(row.shipped.bytes);
    }
  });

  it("keep alpha on transparent slots (clear corners, opaque centre) and none on opaque slots", async () => {
    for (const row of report.slots) {
      const spec = specOf(row.slot);
      const data = readFileSync(
        row.shipped === null ? join(EVIDENCE, row.master.path) : join(APP, row.shipped.path),
      );
      const meta = await sharp(data).metadata();
      expect(meta.hasAlpha, row.slot).toBe(spec?.transparent);
      if (spec?.transparent !== true) continue;
      const raw = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { width, height } = raw.info;
      const alphaAt = (x: number, y: number): number => raw.data[(y * width + x) * 4 + 3] ?? 0;
      for (const [x, y] of [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ] as const) {
        expect(alphaAt(x, y), `${row.slot} corner ${x},${y}`).toBe(0);
      }
      expect(alphaAt(Math.floor(width / 2), Math.floor(height / 2)), row.slot).toBeGreaterThan(200);
    }
  });

  it("stay within the art budget: 8 MB total and the per-kind file limits", () => {
    const entries = shippedNames.map((name) => ({
      path: join(FILES_DIR, name),
      bytes: statSync(join(FILES_DIR, name)).size,
    }));
    assertAssetBudget(entries, {
      totalBytes: TOTAL_SHIPPED_ART_BYTES,
      byExtension: { webp: TOTAL_SHIPPED_ART_BYTES },
    });
    for (const spec of ART_SPECS) {
      const entry = entries.find((item) => item.path.endsWith(`/${spec.id}.webp`));
      if (entry === undefined) continue;
      assertAssetBudget([entry], { perFileBytes: spec.maxShippedBytes });
    }
    expect(ART_SPECS.find((s) => s.id === "lantern-amber")?.maxShippedBytes).toBe(40 * 1024);
    expect(ART_SPECS.find((s) => s.id === "backdrop-sky")?.maxShippedBytes).toBe(400 * 1024);
    expect(ART_SPECS.find((s) => s.id === "empty-archive")?.maxShippedBytes).toBe(120 * 1024);
  });

  it("record the calm-centre edge density of every shipped backdrop", () => {
    for (const row of report.slots.filter((entry) => entry.slot.startsWith("backdrop-"))) {
      expect(row.centreEdgeDensity, row.slot).toBeTypeOf("number");
    }
  });
});

describe("masters", () => {
  it("are WebP at the generation size and match the recorded hash", async () => {
    for (const row of report.slots) {
      const data = readFileSync(join(EVIDENCE, row.master.path));
      const spec = specOf(row.slot);
      expect(row.master.path).toBe(`masters/${row.slot}.webp`);
      expect(sha256(data), row.slot).toBe(row.master.sha256);
      const meta = await sharp(data).metadata();
      expect(meta.format, row.slot).toBe("webp");
      expect({ width: meta.width, height: meta.height }, row.slot).toEqual({
        width: spec?.masterWidth,
        height: spec?.masterHeight,
      });
      expect(row.source.sha256, row.slot).toMatch(/^[0-9a-f]{64}$/);
      expect(row.source.path, row.slot).toBe(`${row.slot}.png`);
    }
  });

  it("ship the evidence copies of the art bible and every review note", () => {
    expect(existsSync(join(EVIDENCE, "art-bible.md"))).toBe(true);
    const batches = { b1: 4, b2: 4, retry: 3 } as const;
    for (const [batch, rounds] of Object.entries(batches)) {
      for (let round = 1; round <= rounds; round++) {
        expect(existsSync(join(EVIDENCE, `review/${batch}-round-${round}-review.md`))).toBe(true);
      }
    }
  });
});

describe("knowledge base", () => {
  const index = readFileSync(join(KB, "assets-index.md"), "utf8");
  const readme = readFileSync(join(KB, "README.md"), "utf8");
  const questions = readFileSync(join(KB, "open-questions.md"), "utf8");
  const slotRows = tableRows(index, "## Art slots (15)");
  const status = new Map(slotRows.map((cells) => [stripTicks(cells[1] ?? ""), cells[7] ?? ""]));

  it("gives every slot the status shipped or placeholder, matching the accepted manifest", () => {
    expect([...status.keys()].sort()).toEqual([...SLOT_IDS].sort());
    for (const id of SLOT_IDS) {
      expect(status.get(id), id).toBe(acceptedIds.includes(id) ? "shipped" : "placeholder");
    }
  });

  it("has one provenance row per accepted slot whose hashes match the report", () => {
    const rows = tableRows(index, "### Art provenance");
    expect(rows.map((cells) => stripTicks(cells[0] ?? "")).sort()).toEqual([...acceptedIds].sort());
    for (const cells of rows) {
      const record = report.slots.find((entry) => entry.slot === stripTicks(cells[0] ?? ""));
      expect(record).toBeDefined();
      expect(cells[1]).toContain(`${record?.slot}.png`);
      expect(stripTicks(cells[4] ?? "")).toBe(record?.source.sha256);
      expect(stripTicks(cells[5] ?? "")).toBe(record?.master.sha256);
      expect(stripTicks(cells[6] ?? "")).toBe(record?.shipped?.sha256 ?? "not bundled");
    }
  });

  it("lists every placeholder slot in open-questions.md and matches the README counts", () => {
    const placeholders = SLOT_IDS.filter((id) => !acceptedIds.includes(id));
    for (const id of placeholders) expect(questions, id).toContain(`\`${id}\``);
    const shipped = SLOT_IDS.length - placeholders.length;
    expect(readme).toContain(`${shipped} of ${SLOT_IDS.length} art slots shipped`);
    expect(readme).toContain(`${placeholders.length} placeholder`);
  });
});
