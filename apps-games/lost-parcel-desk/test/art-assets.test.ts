import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  analyze,
  COVERAGE_MIN_OVERRIDES,
  maxBytesFor,
  noteHoldsVerdict,
  SAFE_AREA_OVERRIDES,
  SCENE_MAX_BYTES,
  SPRITE_MAX_BYTES,
  TOTAL_RUNTIME_BYTES,
  type Verdict,
  violationsFor,
} from "../scripts/art-lib";
import { ART_ENTRIES, ART_MANIFEST, artUrls } from "../src/art/manifest";
import {
  hasAlphaSlot,
  runtimeSize,
  SLOT_IDS,
  SLOTS,
  type SlotId,
  slotAspect,
  slotDef,
} from "../src/art/slots";
import { ART_CREDITS } from "../src/data/credits";

const APP = join(import.meta.dirname, "..");
const ROOT = join(APP, "../..");
const EVIDENCE = join(ROOT, ".agents/resources/2026-10-23/web-games/lost-parcel-desk");
const PUBLIC_ART = join(APP, "public/art");
const MASTERS = join(EVIDENCE, "art/masters");
const INDEX = readFileSync(join(ROOT, ".agents/games/lost-parcel-desk/assets-index.md"), "utf8");

interface Provenance {
  slot: SlotId;
  status: "accepted" | "rejected" | "missing";
  runtimeFile: string | null;
  runtimeBytes: number | null;
  master: string | null;
  masterBytes: number | null;
  masterSha256: string | null;
  note: string;
}

const verdicts = (
  JSON.parse(readFileSync(join(EVIDENCE, "06/verdicts.json"), "utf8")) as { slots: Verdict[] }
).slots;
const provenance = JSON.parse(
  readFileSync(join(EVIDENCE, "06/provenance.json"), "utf8"),
) as Provenance[];
const accepted = verdicts.filter((v) => v.verdict === "accepted").map((v) => v.slot);
const rejected = verdicts.filter((v) => v.verdict === "rejected").map((v) => v.slot);
const bundleAccepted = accepted.filter((slot) => slotDef(slot)?.inBundle);

describe("runtime art files", () => {
  it("has a file for every manifest entry and an entry for every file", () => {
    const files = readdirSync(PUBLIC_ART).sort();
    expect(files).toEqual(ART_ENTRIES.map((entry) => `${entry.slot}.webp`).sort());
    expect(ART_MANIFEST.slice().sort()).toEqual(bundleAccepted.slice().sort());
    expect(artUrls()).toHaveLength(ART_ENTRIES.length);
    for (const entry of ART_ENTRIES) {
      expect(entry.file).toBe(`/art/${entry.slot}.webp`);
      expect(slotDef(entry.slot)?.inBundle).toBe(true);
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

  it("fits the asset budget of 8 MB with the per-file caps", () => {
    const entries = ART_ENTRIES.map((entry) => ({
      path: `public/art/${entry.slot}.webp`,
      bytes: statSync(join(PUBLIC_ART, `${entry.slot}.webp`)).size,
    }));
    const report = assertAssetBudget(entries, {
      totalBytes: 8_000_000,
      perFileBytes: SCENE_MAX_BYTES,
      maxFiles: 67,
    });
    expect(TOTAL_RUNTIME_BYTES).toBe(8_000_000);
    expect(report.fileCount).toBe(bundleAccepted.length);
    for (const entry of entries) {
      const slot = entry.path.replace(/^public\/art\/|\.webp$/g, "") as SlotId;
      expect(entry.bytes, slot).toBeLessThanOrEqual(maxBytesFor(slot) as number);
    }
  });

  it("keeps store assets and rejected slots out of the bundle", () => {
    const names = readdirSync(PUBLIC_ART);
    for (const slot of ["icon", "feature-graphic", ...rejected]) {
      expect(names, slot).not.toContain(`${slot}.webp`);
      expect(ART_MANIFEST, slot).not.toContain(slot);
    }
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

  it("splits the 67 slots into accepted and rejected with nothing missing", () => {
    expect(verdicts).toHaveLength(67);
    expect(new Set(verdicts.map((v) => v.slot)).size).toBe(67);
    expect(accepted).toHaveLength(63);
    expect(rejected.slice().sort()).toEqual([
      "evidence-04-3",
      "evidence-08-1",
      "key-art",
      "townsfolk-9",
    ]);
    expect(bundleAccepted).toHaveLength(61);
    expect(provenance.filter((row) => row.status === "missing")).toEqual([]);
  });

  it("records a provenance row for all 67 slots, equal to the files on disk", () => {
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
      if (slotDef(row.slot)?.inBundle) {
        expect(row.runtimeBytes).toBe(statSync(join(PUBLIC_ART, `${row.slot}.webp`)).size);
      } else {
        expect(row.runtimeFile).toBeNull();
      }
    }
  });

  it("shows the same rows, bytes and hashes in the assets index", () => {
    const section = INDEX.slice(INDEX.indexOf("<!-- provenance:begin"));
    for (const row of provenance) {
      const line = section.split("\n").find((entry) => entry.startsWith(`| \`${row.slot}\` | `));
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
    for (const verdict of verdicts) {
      const note = readFileSync(join(EVIDENCE, verdict.evidence), "utf8");
      expect(noteHoldsVerdict(note, verdict), `${verdict.slot}: ${verdict.match}`).toBe(true);
    }
    expect(verdicts.find((v) => v.slot === "key-art")?.verdict).toBe("rejected");
    expect(existsSync(join(EVIDENCE, "art/art-bible.md"))).toBe(true);
    expect(existsSync(join(EVIDENCE, "art/designer-manifest.json"))).toBe(true);
  });

  it("flags the one accepted slot without a line in its review note and says so in the open questions", () => {
    const unlisted = verdicts.filter((v) => v.source !== "review-note");
    expect(unlisted.map((v) => v.slot)).toEqual(["evidence-09-4"]);
    const questions = readFileSync(
      join(ROOT, ".agents/games/lost-parcel-desk/open-questions.md"),
      "utf8",
    );
    expect(questions).toContain("evidence-09-4");
    expect(questions).toContain("evidence-08-3");
  });

  it("lists the credit entries for the art", () => {
    expect(ART_CREDITS.length).toBeGreaterThan(0);
    for (const credit of ART_CREDITS) {
      expect(credit.author).toContain("MobileGamesDesigner");
      expect(credit.licence).toBe("Owned by the project");
    }
  });
});

describe("noteHoldsVerdict", () => {
  const verdict: Verdict = {
    slot: "evidence-07-2",
    verdict: "accepted",
    batch: "b4",
    round: 1,
    review: "b4/round-1/review/review.md",
    evidence: "art/review/b4-round-1.md",
    match: "- evidence-07-2 Rehearsal notice:",
    section: "## ACCEPTED",
    source: "review-note",
  };

  it("requires the line under its section and ignores the same line elsewhere", () => {
    const good = "# t\n## ACCEPTED\n- evidence-07-2 Rehearsal notice: fine\n## REJECTED\n- x";
    const wrong = "# t\n## ACCEPTED\n- other\n## REJECTED\n- evidence-07-2 Rehearsal notice: bad";
    expect(noteHoldsVerdict(good, verdict)).toBe(true);
    expect(noteHoldsVerdict(wrong, verdict)).toBe(false);
    expect(noteHoldsVerdict("# nothing", verdict)).toBe(false);
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
  const issues = async (slot: SlotId, image: Buffer, bytes = image.length): Promise<string> =>
    violationsFor(slot, await analyze(image), bytes, "runtime").join("\n");

  it("derives sizes, aspects and alpha from the slot kind", () => {
    expect(runtimeSize("evidence-02-3")).toEqual({ width: 560, height: 560 });
    expect(runtimeSize("parcel-open")).toEqual({ width: 560, height: 560 });
    expect(runtimeSize("townsfolk-4")).toEqual({ width: 360, height: 480 });
    expect(runtimeSize("desk-backdrop")).toEqual({ width: 800, height: 1200 });
    expect(runtimeSize("key-art")).toEqual({ width: 800, height: 1200 });
    expect(runtimeSize("icon")).toBeNull();
    expect(runtimeSize("feature-graphic")).toBeNull();
    expect(slotAspect("townsfolk-4")).toEqual([3, 4]);
    expect(slotAspect("feature-graphic")).toEqual([3, 2]);
    expect(SLOTS.filter((slot) => hasAlphaSlot(slot.id))).toHaveLength(63);
    expect(maxBytesFor("evidence-01-2")).toBe(SPRITE_MAX_BYTES);
    expect(maxBytesFor("townsfolk-1")).toBe(SPRITE_MAX_BYTES);
    expect(maxBytesFor("desk-backdrop")).toBe(SCENE_MAX_BYTES);
    expect(maxBytesFor("icon")).toBeNull();
  });

  it("accepts a centred sprite and names the slot in every failure", async () => {
    const good = await webp(560, 560, disc(560, 220));
    expect(await issues("evidence-01-2", good)).toBe("");
    const small = await webp(100, 100, disc(100, 36));
    expect(await issues("evidence-01-2", small)).toContain(
      "evidence-01-2 (runtime): size 100x100, expected 560x560",
    );
  });

  it("rejects a sprite without alpha, with solid corners, too full or off the safe area", async () => {
    const opaque = await webp(560, 560, () => 255);
    const text = await issues("evidence-01-2", opaque);
    expect(text).toContain("corner alpha");
    expect(text).toContain("coverage");
    expect(text).toContain("safe area");
    const empty = await webp(560, 560, () => 0);
    expect(await issues("evidence-01-2", empty)).toContain("coverage");
    const thin = await webp(560, 560, disc(560, 100));
    expect(await issues("evidence-01-3", thin)).toContain("coverage");
  });

  it("checks portraits at 3:4 and scenes at 2:3", async () => {
    const portrait = await webp(360, 480, (x, y) =>
      x > 40 && x < 320 && y > 40 && y < 440 ? 255 : 0,
    );
    expect(await issues("townsfolk-1", portrait)).toBe("");
    const square = await webp(480, 480, disc(480, 200));
    expect(await issues("townsfolk-1", square)).toContain("is not 3:4");
    const wide = await webp(800, 1000, () => 255);
    expect(await issues("desk-backdrop", wide)).toContain("is not 2:3");
  });

  it("allows low coverage and a taller bust only where an override gives the reason", async () => {
    const slim = await webp(560, 560, disc(560, 110));
    expect(await issues("evidence-01-3", slim)).toContain("coverage");
    expect(await issues("evidence-07-1", slim)).toBe("");
    const tall = await webp(360, 480, (x, y) => (x > 30 && x < 330 && y > 10 && y < 446 ? 255 : 0));
    expect(await issues("townsfolk-1", tall)).toContain("safe area");
    expect(await issues("townsfolk-7", tall)).toBe("");
  });

  it("keeps every override justified by the real masters", async () => {
    for (const [slot, override] of Object.entries(COVERAGE_MIN_OVERRIDES)) {
      expect(override?.why.length, slot).toBeGreaterThan(20);
      expect(accepted, slot).toContain(slot);
      const stats = await analyze(join(MASTERS, `${slot}.webp`));
      expect(stats.coverage, `${slot} needs its override`).toBeLessThan(0.26);
      expect(stats.coverage, slot).toBeGreaterThanOrEqual(override?.min ?? 1);
    }
    for (const [slot, override] of Object.entries(SAFE_AREA_OVERRIDES)) {
      expect(override?.why.length, slot).toBeGreaterThan(20);
      const stats = await analyze(join(MASTERS, `${slot}.webp`));
      expect(stats.bbox?.height, `${slot} needs its override`).toBeGreaterThan(0.9);
    }
  });

  it("rejects partial alpha on opaque slots, oversize files and wrong formats", async () => {
    const holey = await webp(800, 1200, (x) => (x === 0 ? 10 : 255));
    expect(await issues("desk-backdrop", holey)).toContain("alpha as low as 10");
    const solid = await webp(800, 1200, () => 255);
    expect(await issues("desk-backdrop", solid)).toBe("");
    expect(
      violationsFor("desk-backdrop", await analyze(solid), SCENE_MAX_BYTES + 1, "runtime"),
    ).toHaveLength(1);
    const png = await sharp({
      create: { width: 560, height: 560, channels: 4, background: "#00000000" },
    })
      .png()
      .toBuffer();
    expect(await issues("evidence-01-2", png)).toContain("format is png");
  });

  it("keeps masters from being smaller than the runtime size and the icon square", async () => {
    const small = await webp(400, 400, disc(400, 150));
    const stats = await analyze(small);
    expect(violationsFor("evidence-01-2", stats, small.length, "master").join("\n")).toContain(
      "smaller than the runtime size",
    );
    const icon = await webp(1024, 1024, () => 255);
    expect(violationsFor("icon", await analyze(icon), icon.length, "master")).toEqual([]);
    expect(violationsFor("icon", await analyze(icon), icon.length, "runtime").join("\n")).toContain(
      "store-only",
    );
  });

  it("rejects animated and EXIF-carrying files", async () => {
    const frame = await sharp({
      create: { width: 560, height: 560, channels: 4, background: "#ff0000" },
    })
      .raw()
      .toBuffer();
    const animated = await sharp(Buffer.concat([frame, Buffer.alloc(frame.length)]), {
      raw: { width: 560, height: 1120, channels: 4, pageHeight: 560 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    const stats = await analyze(animated);
    expect(stats.pages).toBe(2);
    expect(violationsFor("evidence-01-2", stats, animated.length, "runtime").join("\n")).toContain(
      "animated",
    );
    const exif = await sharp({
      create: { width: 560, height: 560, channels: 4, background: "#00000000" },
    })
      .withExif({ IFD0: { Copyright: "x" } })
      .webp()
      .toBuffer();
    expect(await issues("evidence-01-2", exif)).toContain("EXIF");
  });
});
