// @vitest-environment node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import { ART_SLOTS } from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import {
  type Analysis,
  analyse,
  BYTE_LIMITS,
  checkIdentity,
  checkSlot,
} from "../scripts/art-checks";
import { ART_MANIFEST } from "../src/art/manifest";
import { CREDITS } from "../src/data/credits";

const APP = join(import.meta.dirname, "..");
const ROOT = join(APP, "../..");
const RUNTIME = join(APP, "public/art");
const EVIDENCE = join(ROOT, ".agents/resources/2026-10-23/web-games/the-last-window");
const MASTERS = join(EVIDENCE, "art/masters");
const INDEX = readFileSync(join(ROOT, ".agents/games/the-last-window/assets-index.md"), "utf8");

const STORE_ONLY = ["icon", "feature-graphic"];
const runtimeFiles = readdirSync(RUNTIME).filter((name) => name.endsWith(".webp"));

interface Row {
  slot: string;
  cells: string[];
}

function tableRows(text: string, start: string, end: string): Row[] {
  const body = text.slice(text.indexOf(start) + start.length, text.indexOf(end));
  return body
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => {
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim().replaceAll("`", ""));
      return { slot: cells[0] ?? "", cells };
    });
}

const provenance = tableRows(INDEX, "<!-- art-provenance:start -->", "<!-- art-provenance:end -->");

async function analyseFile(path: string): Promise<Analysis> {
  return analyse(readFileSync(path));
}

describe("runtime art files", () => {
  it("has a file for every manifest entry and a manifest entry for every file", () => {
    const wanted = ART_MANIFEST.map((slot) => `${slot}.webp`).sort();
    expect([...runtimeFiles].sort()).toEqual(wanted);
    expect(new Set(ART_MANIFEST).size).toBe(ART_MANIFEST.length);
  });

  it("keeps the icon and feature graphic out of the bundle", () => {
    for (const slot of STORE_ONLY) {
      expect(ART_MANIFEST).not.toContain(slot);
      expect(existsSync(join(RUNTIME, `${slot}.webp`))).toBe(false);
    }
    for (const slot of ART_MANIFEST) {
      expect(ART_SLOTS.find((def) => def.id === slot)?.runtime, slot).not.toBeNull();
    }
  });

  it("passes the size, alpha, coverage, metadata and byte checks for every entry", async () => {
    for (const slot of ART_MANIFEST) {
      const def = ART_SLOTS.find((entry) => entry.id === slot);
      expect(def, slot).toBeDefined();
      if (!def) continue;
      const found = await analyseFile(join(RUNTIME, `${slot}.webp`));
      expect(checkSlot(def, found, "runtime"), slot).toEqual([]);
      expect(found.bytes, slot).toBeLessThanOrEqual(BYTE_LIMITS[def.kind]);
    }
  });

  it("keeps each customer's framing across expressions and one shared bust bottom edge", async () => {
    const busts = new Map<string, Analysis>();
    for (const slot of ART_MANIFEST.filter((id) => id.startsWith("customer-"))) {
      busts.set(slot, await analyseFile(join(RUNTIME, `${slot}.webp`)));
    }
    expect(busts.size).toBe(24);
    expect(checkIdentity(busts)).toEqual([]);
  });

  it("stays inside the art budget of 8 MB", () => {
    const entries = runtimeFiles.map((name) => ({
      path: name,
      bytes: statSync(join(RUNTIME, name)).size,
    }));
    const report = assertAssetBudget(entries, { totalBytes: 8_000_000 });
    expect(report.fileCount).toBe(ART_MANIFEST.length);
  });
});

describe("checks catch bad images", () => {
  const bust = ART_SLOTS.find((def) => def.id === "customer-1-neutral");
  const interior = ART_SLOTS.find((def) => def.id === "interior-rain");
  const item = ART_SLOTS.find((def) => def.id === "drink-1");

  async function good(slot: string): Promise<Analysis> {
    return analyseFile(join(RUNTIME, `${slot}.webp`));
  }

  it("flags a wrong size, an opaque bust and a transparent interior", async () => {
    if (!bust || !interior || !item) throw new Error("slot missing");
    const found = await good("customer-1-neutral");
    expect(checkSlot(bust, { ...found, width: 481 }, "runtime").join()).toContain("size 481x640");
    expect(checkSlot(bust, { ...found, corners: [255, 0, 0, 0] }, "runtime").join()).toContain(
      "corner",
    );
    expect(checkSlot(bust, { ...found, hasAlpha: false }, "runtime").join()).toContain("alpha");
    expect(checkSlot(bust, { ...found, coverage: 0.2 }, "runtime").join()).toContain("coverage");
    expect(checkSlot(bust, { ...found, pages: 3 }, "runtime").join()).toContain("animated");
    expect(checkSlot(bust, { ...found, hasExif: true }, "runtime").join()).toContain("EXIF");
    expect(checkSlot(bust, { ...found, bytes: 130_000 }, "runtime").join()).toContain("byte limit");
    const room = await good("interior-rain");
    expect(checkSlot(interior, { ...room, fullyOpaque: false }, "runtime").join()).toContain(
      "opaque",
    );
    const drink = await good("drink-1");
    const tiny = { ...drink, box: { left: 0.4, top: 0.4, right: 0.6, bottom: 0.6 } };
    expect(checkSlot(item, tiny, "runtime").join()).toContain("extent");
    const edge = { ...drink, box: { left: 0.01, top: 0.1, right: 0.8, bottom: 0.9 } };
    expect(checkSlot(item, edge, "runtime").join()).toContain("margin");
  });

  it("flags a customer whose expressions drift apart", async () => {
    const neutral = await good("customer-1-neutral");
    const drifted = { ...neutral, box: { ...neutral.box, right: neutral.box.right - 0.1 } };
    const problems = checkIdentity(
      new Map([
        ["customer-1-neutral", neutral],
        ["customer-1-happy", drifted],
      ]),
    );
    expect(problems.join()).toContain("customer-1: right edge");
    const high = { ...neutral, box: { ...neutral.box, bottom: 0.8 } };
    expect(
      checkIdentity(
        new Map([
          ["customer-1-neutral", neutral],
          ["customer-2-neutral", high],
        ]),
      ).join(),
    ).toContain("bottom edge");
  });
});

describe("masters and provenance", () => {
  it("keeps a q90 WebP master for every accepted slot, store assets included", async () => {
    const accepted = provenance.filter((row) => row.cells[1] === "accepted");
    expect(accepted).toHaveLength(54);
    const files = readdirSync(MASTERS).filter((name) => name.endsWith(".webp"));
    expect(files.sort()).toEqual(accepted.map((row) => `${row.slot}.webp`).sort());
    for (const def of ART_SLOTS) {
      const found = await analyseFile(join(MASTERS, `${def.id}.webp`));
      expect(checkSlot(def, found, "master"), def.id).toEqual([]);
      expect(found.width, def.id).toBeGreaterThanOrEqual((def.runtime ?? { width: 1 }).width);
    }
  });

  it("lists all 54 slots in the provenance table with matching bytes and hashes", () => {
    expect(provenance.map((row) => row.slot).sort()).toEqual(ART_SLOTS.map((d) => d.id).sort());
    for (const row of provenance) {
      const [, status, source, verdict, runtime, runtimeBytes, master, masterBytes, sha] =
        row.cells;
      expect(["accepted", "rejected", "missing"], row.slot).toContain(status);
      if (status !== "accepted") {
        expect(existsSync(join(RUNTIME, `${row.slot}.webp`)), row.slot).toBe(false);
        continue;
      }
      expect(source, row.slot).toMatch(/^(b\d|retry), round \d$/);
      expect(verdict, row.slot).toContain("ACCEPTED");
      const verdictFile = (verdict ?? "").split(", ")[1] ?? "";
      expect(existsSync(join(EVIDENCE, "art", verdictFile)), row.slot).toBe(true);
      const masterBuffer = readFileSync(join(EVIDENCE, "art", master ?? ""));
      expect(createHash("sha256").update(masterBuffer).digest("hex"), row.slot).toBe(sha);
      expect(masterBuffer.length.toLocaleString("en-US"), row.slot).toBe(masterBytes);
      if (STORE_ONLY.includes(row.slot)) {
        expect(runtime, row.slot).toBe("-");
      } else {
        const size = statSync(join(APP, runtime ?? "")).size;
        expect(size.toLocaleString("en-US"), row.slot).toBe(runtimeBytes);
      }
    }
  });

  it("integrates only slots recorded as accepted in the inbox manifest", () => {
    const accepted: Array<{ assetId: string }> = JSON.parse(
      readFileSync(join(EVIDENCE, "art/accepted-manifest.json"), "utf8"),
    );
    const ids = new Set(accepted.map((entry) => entry.assetId));
    for (const slot of ART_MANIFEST) expect(ids.has(slot), slot).toBe(true);
    const decisions = readFileSync(join(EVIDENCE, "06/README.md"), "utf8");
    const rows = tableRows(decisions, "<!-- art-decisions:start -->", "<!-- art-decisions:end -->");
    expect(rows).toHaveLength(54);
    for (const row of rows) {
      const shipped = ART_MANIFEST.includes(row.slot) || STORE_ONLY.includes(row.slot);
      expect(row.cells[1] === "accepted", row.slot).toBe(shipped);
    }
  });

  it("ships the art bible and review notes as evidence", () => {
    expect(existsSync(join(EVIDENCE, "art/art-bible.md"))).toBe(true);
    const notes = readdirSync(join(EVIDENCE, "art/review")).filter((n) => n.endsWith(".md"));
    expect(notes.length).toBeGreaterThanOrEqual(10);
  });

  it("credits the art to the designer thread under the project's own licence", () => {
    const art = CREDITS.filter((row) => row.group === "art");
    expect(art.length).toBeGreaterThan(0);
    for (const row of art) {
      expect(row.author).toBe("MobileGamesDesigner thread");
      expect(row.licence).toBe("Owned by the project");
    }
  });
});
