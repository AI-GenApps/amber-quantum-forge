import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  analyze,
  COVERAGE_MIN_OVERRIDES,
  PORTRAIT_MAX_BYTES,
  SPRITE_MAX_BYTES,
  TOTAL_RUNTIME_BYTES,
  violationsFor,
} from "../scripts/art-lib";
import { BACKDROP_SCRIM } from "../src/art/Backdrop";
import { ART_ENTRIES, ART_MANIFEST } from "../src/art/manifest";
import { runtimeSize, SLOT_IDS, SLOTS, type SlotId, slotDef } from "../src/art/slots";
import { contrastRatio, mixHex } from "../src/theme/contrast";
import { MAP_THEMES } from "../src/theme/mapThemes";
import { PALETTE } from "../src/theme/tokens";

const APP = join(import.meta.dirname, "..");
const ROOT = join(APP, "../..");
const EVIDENCE = join(ROOT, ".agents/resources/2026-10-23/web-games/floodplain-dispatch");
const PUBLIC_ART = join(APP, "public/art");
const MASTERS = join(EVIDENCE, "art/masters");
const INDEX = readFileSync(join(ROOT, ".agents/games/floodplain-dispatch/assets-index.md"), "utf8");

interface Verdict {
  slot: SlotId;
  verdict: "accepted" | "rejected";
  evidence: string;
  match: string;
  batch: string;
  round: number;
}
interface Provenance {
  slot: SlotId;
  status: "accepted" | "rejected" | "missing";
  runtimeFile: string | null;
  runtimeBytes: number | null;
  master: string | null;
  masterBytes: number | null;
  masterSha256: string | null;
}

const verdicts = (
  JSON.parse(readFileSync(join(EVIDENCE, "06/verdicts.json"), "utf8")) as { slots: Verdict[] }
).slots;
const provenance = JSON.parse(
  readFileSync(join(EVIDENCE, "06/provenance.json"), "utf8"),
) as Provenance[];
const accepted = verdicts.filter((v) => v.verdict === "accepted").map((v) => v.slot);
const bundleAccepted = accepted.filter((slot) => slotDef(slot).inBundle);

describe("runtime art files", () => {
  it("has a file for every manifest entry and an entry for every file", () => {
    const files = readdirSync(PUBLIC_ART).sort();
    expect(files).toEqual(ART_ENTRIES.map((entry) => `${entry.slot}.webp`).sort());
    expect(ART_MANIFEST.slice().sort()).toEqual(bundleAccepted.slice().sort());
    for (const entry of ART_ENTRIES) {
      expect(entry.file).toBe(`/art/${entry.slot}.webp`);
      expect(slotDef(entry.slot).inBundle).toBe(true);
    }
  });

  it("matches the declared pixel size, alpha, coverage and safe area of every entry", async () => {
    for (const entry of ART_ENTRIES) {
      const path = join(PUBLIC_ART, `${entry.slot}.webp`);
      const stats = await analyze(path);
      expect([stats.width, stats.height]).toEqual([entry.width, entry.height]);
      const size = runtimeSize(entry.slot);
      expect([entry.width, entry.height]).toEqual([size?.width, size?.height]);
      expect(violationsFor(entry.slot, stats, statSync(path).size, "runtime")).toEqual([]);
    }
  });

  it("fits the asset budget", () => {
    const entries = ART_ENTRIES.map((entry) => ({
      path: `public/art/${entry.slot}.webp`,
      bytes: statSync(join(PUBLIC_ART, `${entry.slot}.webp`)).size,
    }));
    const report = assertAssetBudget(entries, {
      totalBytes: TOTAL_RUNTIME_BYTES,
      perFileBytes: PORTRAIT_MAX_BYTES,
      maxFiles: 20,
    });
    expect(report.fileCount).toBe(accepted.filter((slot) => slotDef(slot).inBundle).length);
    for (const entry of entries) {
      const slot = entry.path.replace(/^public\/art\/|\.webp$/g, "") as SlotId;
      const limit = slotDef(slot).kind === "sprite" ? SPRITE_MAX_BYTES : PORTRAIT_MAX_BYTES;
      expect(entry.bytes).toBeLessThanOrEqual(limit);
    }
  });

  it("keeps store assets and rejected slots out of the bundle", () => {
    const names = readdirSync(PUBLIC_ART);
    expect(names).not.toContain("icon.webp");
    expect(names).not.toContain("feature-graphic.webp");
    expect(names).not.toContain("key-art.webp");
    expect(names.every((name) => name.endsWith(".webp"))).toBe(true);
  });
});

describe("masters and provenance", () => {
  it("keeps one q90 WebP master for every accepted slot and nothing else", async () => {
    expect(readdirSync(MASTERS).sort()).toEqual(accepted.map((slot) => `${slot}.webp`).sort());
    for (const slot of accepted) {
      const path = join(MASTERS, `${slot}.webp`);
      const stats = await analyze(path);
      expect(violationsFor(slot, stats, statSync(path).size, "master")).toEqual([]);
    }
  });

  it("records a provenance row for all 20 slots, equal to the files on disk", () => {
    expect(provenance.map((row) => row.slot)).toEqual([...SLOT_IDS]);
    for (const row of provenance) {
      const verdict = verdicts.find((v) => v.slot === row.slot);
      expect(row.status).toBe(verdict ? verdict.verdict : "missing");
      if (row.status !== "accepted") {
        expect(row.master).toBeNull();
        expect(row.runtimeFile).toBeNull();
        expect(existsSync(join(MASTERS, `${row.slot}.webp`))).toBe(false);
        expect(existsSync(join(PUBLIC_ART, `${row.slot}.webp`))).toBe(false);
        continue;
      }
      const master = readFileSync(join(MASTERS, `${row.slot}.webp`));
      expect(row.masterBytes).toBe(master.length);
      expect(row.masterSha256).toBe(createHash("sha256").update(master).digest("hex"));
      if (slotDef(row.slot).inBundle) {
        expect(row.runtimeBytes).toBe(statSync(join(PUBLIC_ART, `${row.slot}.webp`)).size);
      } else {
        expect(row.runtimeFile).toBeNull();
      }
    }
  });

  it("shows the same rows, bytes and hashes in the assets index", () => {
    for (const row of provenance) {
      const line = INDEX.split("\n").find((entry) => entry.startsWith(`| \`${row.slot}\` | `));
      expect(line, row.slot).toBeDefined();
      if (row.status === "accepted") {
        expect(line).toContain(row.masterSha256 as string);
        expect(line).toContain((row.masterBytes as number).toLocaleString("en-US"));
        if (row.runtimeBytes !== null) {
          expect(line).toContain((row.runtimeBytes as number).toLocaleString("en-US"));
        }
      } else {
        expect(line).toContain(row.status);
        expect(line).toContain("placeholder");
      }
    }
  });

  it("records every verdict against a review note that contains it", () => {
    expect(new Set(verdicts.map((v) => v.slot)).size).toBe(verdicts.length);
    for (const verdict of verdicts) {
      const review = readFileSync(join(EVIDENCE, verdict.evidence), "utf8");
      expect(review, verdict.slot).toContain(verdict.match);
    }
    expect(verdicts.find((v) => v.slot === "key-art")?.verdict).toBe("rejected");
    expect(existsSync(join(EVIDENCE, "art/art-bible.md"))).toBe(true);
  });
});

describe("art checks", () => {
  async function webp(width: number, height: number, draw: (x: number, y: number) => number) {
    const data = Buffer.alloc(width * height * 4, 255);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) data[(y * width + x) * 4 + 3] = draw(x, y);
    }
    return sharp(data, { raw: { width, height, channels: 4 } })
      .webp({ lossless: true })
      .toBuffer();
  }
  const disc = (size: number, radius: number) => (x: number, y: number) =>
    Math.hypot(x - size / 2, y - size / 2) < radius ? 255 : 0;

  it("accepts a centred sprite and names the slot in every failure", async () => {
    const good = await webp(192, 192, disc(192, 70));
    expect(violationsFor("pump", await analyze(good), good.length, "runtime")).toEqual([]);
    const small = await webp(100, 100, disc(100, 36));
    const issues = violationsFor("pump", await analyze(small), small.length, "runtime");
    expect(issues.join("\n")).toContain("pump (runtime): size 100x100, expected 192x192");
  });

  it("rejects a sprite without alpha, with solid corners, too full or off the safe area", async () => {
    const opaque = await webp(192, 192, () => 255);
    const issues = violationsFor("pump", await analyze(opaque), opaque.length, "runtime");
    expect(issues.some((issue) => issue.includes("corner alpha"))).toBe(true);
    expect(issues.some((issue) => issue.includes("coverage"))).toBe(true);
    expect(issues.some((issue) => issue.includes("safe area"))).toBe(true);
    const empty = await webp(192, 192, () => 0);
    expect(
      violationsFor("pump", await analyze(empty), empty.length, "runtime").join("\n"),
    ).toContain("coverage");
  });

  it("rejects bad aspect, partial alpha on opaque slots, oversize files and wrong formats", async () => {
    const wide = await webp(800, 1000, () => 255);
    expect(
      violationsFor("backdrop-valley", await analyze(wide), wide.length, "runtime").join("\n"),
    ).toContain("is not 2:3");
    const holey = await webp(800, 1200, (x) => (x === 0 ? 10 : 255));
    expect(
      violationsFor("backdrop-valley", await analyze(holey), holey.length, "runtime").join("\n"),
    ).toContain("alpha as low as 10");
    const solid = await webp(800, 1200, () => 255);
    expect(
      violationsFor("backdrop-valley", await analyze(solid), PORTRAIT_MAX_BYTES + 1, "runtime"),
    ).toHaveLength(1);
    const png = await sharp({
      create: { width: 192, height: 192, channels: 4, background: "#00000000" },
    })
      .png()
      .toBuffer();
    expect(violationsFor("pump", await analyze(png), png.length, "runtime").join("\n")).toContain(
      "format is png",
    );
  });

  it("rejects animated and EXIF-carrying files", async () => {
    const frame = await sharp({
      create: { width: 192, height: 192, channels: 4, background: "#ff0000" },
    })
      .raw()
      .toBuffer();
    const animated = await sharp(Buffer.concat([frame, Buffer.alloc(frame.length)]), {
      raw: { width: 192, height: 384, channels: 4, pageHeight: 192 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    const stats = await analyze(animated);
    expect(stats.pages).toBe(2);
    expect(
      violationsFor("backdrop-valley", stats, animated.length, "runtime").join("\n"),
    ).toContain("animated");
    const exif = await sharp({
      create: { width: 192, height: 192, channels: 4, background: "#00000000" },
    })
      .withExif({ IFD0: { Copyright: "x" } })
      .webp()
      .toBuffer();
    expect(violationsFor("pump", await analyze(exif), exif.length, "runtime").join("\n")).toContain(
      "EXIF",
    );
  });

  it("allows lower coverage only where the silhouette needs it", () => {
    expect(Object.keys(COVERAGE_MIN_OVERRIDES).sort()).toEqual(["sandbag-barrier", "tree-poplar"]);
    for (const override of Object.values(COVERAGE_MIN_OVERRIDES)) {
      expect(override.why.length).toBeGreaterThan(10);
    }
    expect(SLOTS.filter((slot) => slot.kind === "sprite")).toHaveLength(13);
  });
});

describe("backdrop legibility", () => {
  it("keeps light text readable on the scrim over the brightest and darkest backdrop pixel", async () => {
    let lightest = "#000000";
    let darkest = "#ffffff";
    let lightestLuma = -1;
    let darkestLuma = 256;
    for (const entry of ART_ENTRIES.filter((e) => e.slot.startsWith("backdrop-"))) {
      const { data } = await sharp(join(PUBLIC_ART, `${entry.slot}.webp`))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += 3) {
        const luma =
          0.2126 * (data[i] as number) +
          0.7152 * (data[i + 1] as number) +
          0.0722 * (data[i + 2] as number);
        const hex = `#${[0, 1, 2].map((k) => (data[i + k] as number).toString(16).padStart(2, "0")).join("")}`;
        if (luma > lightestLuma) {
          lightestLuma = luma;
          lightest = hex;
        }
        if (luma < darkestLuma) {
          darkestLuma = luma;
          darkest = hex;
        }
      }
    }
    for (const theme of MAP_THEMES) {
      for (const art of [lightest, darkest]) {
        const under = mixHex(art, theme.background, BACKDROP_SCRIM);
        expect(
          contrastRatio(PALETTE.paper, under),
          `${theme.id} over ${art}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(PALETTE.paper2, under),
          `${theme.id} muted over ${art}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
