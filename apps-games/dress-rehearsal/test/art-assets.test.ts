import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BYTE_LIMITS, checkRuntime, decode, factsOf } from "../scripts/art-checks";
import { UNACCEPTED } from "../scripts/art-verdicts";
import { ART_ENTRIES } from "../src/art/manifest";
import { runtimeSize, SLOT_IDS, SLOTS, type SlotId, slotDef } from "../src/art/slots";
import { ART_CREDITS } from "../src/data/credits";

const APP = join(import.meta.dirname, "..");
const REPO = join(APP, "../..");
const EVIDENCE = join(REPO, ".agents/resources/2026-10-23/web-games/dress-rehearsal");
const MASTERS = join(EVIDENCE, "art/masters");
const PUBLIC_ART = join(APP, "public/art");
const ASSETS_INDEX = join(REPO, ".agents/games/dress-rehearsal/assets-index.md");

const sha256 = (data: Buffer): string => createHash("sha256").update(data).digest("hex");
const unaccepted = Object.keys(UNACCEPTED) as SlotId[];
const accepted = SLOT_IDS.filter((slot) => !unaccepted.includes(slot));

interface Row {
  slot: string;
  status: string;
  runtimeBytes: number;
  masterBytes: number;
  masterSha: string;
  cells: string[];
}

function provenanceRows(): Row[] {
  const text = readFileSync(ASSETS_INDEX, "utf8");
  const body =
    text.split("<!-- provenance:begin -->")[1]?.split("<!-- provenance:end -->")[0] ?? "";
  const num = (cell: string | undefined): number =>
    cell === undefined || cell === "-" ? 0 : Number(cell.replaceAll(",", ""));
  return body
    .split("\n")
    .filter((line) => /^\| `[a-z0-9-]+` \|/.test(line))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      return {
        slot: (cells[0] ?? "").replaceAll("`", ""),
        status: cells[1] ?? "",
        runtimeBytes: num(cells[5]),
        masterBytes: num(cells[7]),
        masterSha: (cells[8] ?? "").replaceAll("`", ""),
        cells,
      };
    });
}

describe("runtime art files", () => {
  const files = readdirSync(PUBLIC_ART).sort();

  it("has a file for every manifest entry and an entry for every file", () => {
    expect(files).toEqual(ART_ENTRIES.map((entry) => `${entry.slot}.webp`).sort());
    expect(files.length).toBe(58);
    for (const slot of unaccepted) expect(files).not.toContain(`${slot}.webp`);
    expect(files).not.toContain("icon.webp");
    expect(files).not.toContain("feature-graphic.webp");
  });

  it("passes the automated checks for every manifest entry", async () => {
    const problems: string[] = [];
    for (const entry of ART_ENTRIES) {
      const path = join(PUBLIC_ART, `${entry.slot}.webp`);
      const data = readFileSync(path);
      const image = await decode(data);
      expect({ width: image.width, height: image.height }, entry.slot).toEqual({
        width: entry.width,
        height: entry.height,
      });
      problems.push(...checkRuntime(entry.slot, image, await factsOf(data, data.byteLength)));
    }
    expect(problems).toEqual([]);
  });

  it("keeps to the byte budget with the kit budget check", () => {
    const entries = files.map((name) => ({
      path: `art/${name}`,
      bytes: statSync(join(PUBLIC_ART, name)).size,
    }));
    const report = assertAssetBudget(entries, { totalBytes: 8_000_000, perFileBytes: 400_000 });
    expect(report.fileCount).toBe(58);
    expect(report.totalBytes).toBeLessThan(2_000_000);
    for (const entry of entries) {
      const slot = entry.path.slice(4, -5) as SlotId;
      const kind = slotDef(slot).kind;
      const limit =
        kind === "item"
          ? BYTE_LIMITS.item
          : kind === "client"
            ? BYTE_LIMITS.client
            : BYTE_LIMITS.large;
      expect(entry.bytes, slot).toBeLessThanOrEqual(limit);
    }
  });
});

describe("masters", () => {
  const files = readdirSync(MASTERS).sort();

  it("exist for every accepted slot and for nothing else", () => {
    expect(files).toEqual(accepted.map((slot) => `${slot}.webp`).sort());
    expect(accepted).toHaveLength(60);
    for (const slot of unaccepted) expect(files).not.toContain(`${slot}.webp`);
  });

  it("are WebP at the delivered resolution, with alpha only for pieces and clients", async () => {
    const want: Record<string, [number, number]> = {
      item: [1024, 1024],
      client: [1024, 1536],
      backdrop: [1024, 1536],
      icon: [1024, 1024],
      landscape: [1536, 1024],
    };
    for (const slot of accepted) {
      const meta = await sharp(join(MASTERS, `${slot}.webp`)).metadata();
      const kind = slotDef(slot).kind;
      expect(meta.format, slot).toBe("webp");
      expect([meta.width, meta.height], slot).toEqual(want[kind]);
      expect(meta.hasAlpha === true, slot).toBe(kind === "item" || kind === "client");
      expect(meta.exif, slot).toBeUndefined();
    }
  });

  it("keep the store slots out of the bundle", () => {
    for (const slot of ["icon", "feature-graphic"] as const) {
      expect(runtimeSize(slot)).toBeNull();
      expect(existsSync(join(PUBLIC_ART, `${slot}.webp`))).toBe(false);
      expect(existsSync(join(MASTERS, `${slot}.webp`))).toBe(true);
    }
  });
});

describe("provenance", () => {
  const rows = provenanceRows();

  it("has one row for each of the 63 slots in slot order", () => {
    expect(rows.map((row) => row.slot)).toEqual([...SLOT_IDS]);
    expect(SLOTS).toHaveLength(63);
  });

  it("marks accepted slots with real bytes and hashes and the rest as placeholders", () => {
    for (const row of rows) {
      const slot = row.slot as SlotId;
      if (unaccepted.includes(slot)) {
        expect(["rejected", "missing"], slot).toContain(row.status);
        expect(row.status, slot).toBe(UNACCEPTED[slot]?.status);
        expect(row.runtimeBytes, slot).toBe(0);
        expect(row.masterBytes, slot).toBe(0);
        expect(row.cells.join(" "), slot).toContain("code-drawn fallback kept");
        continue;
      }
      expect(row.status, slot).toBe("accepted");
      const master = readFileSync(join(MASTERS, `${slot}.webp`));
      expect(row.masterBytes, slot).toBe(master.byteLength);
      expect(row.masterSha, slot).toBe(sha256(master));
      if (slotDef(slot).inBundle) {
        expect(row.runtimeBytes, slot).toBe(statSync(join(PUBLIC_ART, `${slot}.webp`)).size);
      } else {
        expect(row.runtimeBytes, slot).toBe(0);
      }
    }
    const statuses = rows.map((row) => row.status);
    expect(statuses.filter((status) => status === "accepted")).toHaveLength(60);
    expect(statuses.filter((status) => status === "missing")).toHaveLength(2);
    expect(statuses.filter((status) => status === "rejected")).toHaveLength(1);
  });

  it("matches the machine-readable provenance and points at copied review notes", () => {
    const json = JSON.parse(readFileSync(join(EVIDENCE, "06/provenance.json"), "utf8")) as {
      slot: string;
      status: string;
      review: string;
      masterSha256: string;
      masterBytes: number;
    }[];
    expect(json.map((row) => row.slot)).toEqual(rows.map((row) => row.slot));
    for (const [index, entry] of json.entries()) {
      expect(entry.status).toBe(rows[index]?.status);
      expect(entry.masterBytes).toBe(rows[index]?.masterBytes);
      if (entry.masterSha256 !== "-") expect(entry.masterSha256).toBe(rows[index]?.masterSha);
      if (entry.review !== "-")
        expect(existsSync(join(EVIDENCE, entry.review)), entry.slot).toBe(true);
    }
    expect(existsSync(join(EVIDENCE, "art/art-bible.md"))).toBe(true);
    expect(existsSync(join(EVIDENCE, "art/accepted-manifest.json"))).toBe(true);
  });

  it("lists the designer art on the credits screen data", () => {
    expect(ART_CREDITS.length).toBeGreaterThan(0);
    expect(ART_CREDITS[0]?.role).toContain("MobileGamesDesigner");
    expect(ART_CREDITS[0]?.licence).toBe("Owned by the project");
  });
});

describe("the automated checks fail loudly", () => {
  async function webp(
    width: number,
    height: number,
    paint: (data: Buffer) => void,
    channels: 3 | 4 = 4,
  ): Promise<Buffer> {
    const data = Buffer.alloc(width * height * channels, channels === 4 ? 0 : 200);
    paint(data);
    return sharp(data, { raw: { width, height, channels } })
      .webp({ quality: 82, alphaQuality: 100 })
      .toBuffer();
  }

  function fill(data: Buffer, width: number, box: [number, number, number, number]): void {
    const [x0, y0, x1, y1] = box;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) data.fill(255, (y * width + x) * 4, (y * width + x) * 4 + 4);
    }
  }

  async function check(slot: SlotId, data: Buffer): Promise<string[]> {
    return checkRuntime(slot, await decode(data), await factsOf(data, data.byteLength));
  }

  it("accepts a centred tee-sized piece", async () => {
    const data = await webp(256, 256, (d) => fill(d, 256, [26, 45, 230, 211]));
    expect(await check("item-riviera-1", data)).toEqual([]);
  });

  it("names the slot for a wrong size", async () => {
    const data = await webp(128, 128, (d) => fill(d, 128, [13, 22, 115, 105]));
    const problems = await check("item-riviera-1", data);
    expect(problems.some((p) => p.startsWith("item-riviera-1: size 128 x 128"))).toBe(true);
  });

  it("rejects a missing alpha channel, opaque corners and an oversized or off-centre box", async () => {
    const opaque = await webp(256, 256, () => undefined, 3);
    expect((await check("item-riviera-1", opaque)).join("\n")).toContain("missing alpha");
    const corner = await webp(256, 256, (d) => fill(d, 256, [0, 0, 250, 250]));
    const text = (await check("item-riviera-1", corner)).join("\n");
    expect(text).toContain("corner pixels");
    expect(text).toContain("safe area");
    expect(text).toContain("exceeds scale");
    const left = await webp(256, 256, (d) => fill(d, 256, [20, 45, 120, 211]));
    expect((await check("item-riviera-1", left)).join("\n")).toContain("off centre");
    const tiny = await webp(256, 256, (d) => fill(d, 256, [100, 100, 150, 150]));
    expect((await check("item-riviera-1", tiny)).join("\n")).toContain("touches neither");
  });

  it("rejects a transparent backdrop, an empty piece and an over-budget file", async () => {
    const clear = await webp(800, 1200, () => undefined);
    expect((await check("backdrop-gala", clear)).join("\n")).toContain("fully opaque");
    const empty = await webp(256, 256, () => undefined);
    expect((await check("item-riviera-1", empty)).join("\n")).toContain("no opaque pixels");
    const data = await webp(256, 256, (d) => fill(d, 256, [26, 45, 230, 211]));
    const facts = await factsOf(data, BYTE_LIMITS.item + 1);
    expect(checkRuntime("item-riviera-1", await decode(data), facts).join("\n")).toContain(
      "exceeds 60000",
    );
  });
});
