import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { emptyTiles, equalTiles } from "../src/board";
import { decodePuzzle, encodePuzzle } from "../src/code";
import {
  analyseRecord,
  countClues,
  median,
  puzzleFromRecord,
  solutionFromRecord,
} from "../src/content/analyse";
import {
  CAMPAIGN,
  CHAPTER_SIZE_COUNTS,
  CHAPTERS,
  chapterPuzzles,
  getChapter,
  getPuzzle,
  MAX_STARS,
  nextPuzzle,
  PUZZLE_COUNT,
  unlockedChapters,
} from "../src/content/chapters";
import { campaignSeed, campaignSpecs, skyColours } from "../src/content/spec";
import { CHAPTER_IDS, type PuzzleRecord } from "../src/content/types";
import { ANCHOR_HARD_LIMIT, ANCHOR_MEDIAN_LIMIT, validateCampaign } from "../src/content/validate";
import { measure, ratingOf } from "../src/gen/difficulty";
import { generatePuzzle } from "../src/gen/generate";
import { rangesFor } from "../src/gen/ranges";
import { analyseLoops } from "../src/loops";
import { type Colour, validatePuzzleShape } from "../src/puzzle";
import { evaluate } from "../src/rules";
import { solve } from "../src/solver";

const REPORT = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".agents",
  "resources",
  "2026-10-23",
  "web-games",
  "lantern-loops",
  "02",
  "campaign-report.json",
);

interface Proven {
  readonly record: PuzzleRecord;
  readonly solved: ReturnType<typeof solve>;
}

let proven: Proven[] = [];

beforeAll(() => {
  proven = CAMPAIGN.map((record) => ({
    record,
    solved: solve(puzzleFromRecord(record), { limit: 2 }),
  }));
});

describe("campaign volume and naming", () => {
  it("has exactly 120 puzzles, 30 per chapter, ids harbor-01 to sky-30", () => {
    expect(CAMPAIGN).toHaveLength(120);
    expect(PUZZLE_COUNT).toBe(120);
    expect(MAX_STARS).toBe(360);
    expect(CAMPAIGN[0]?.id).toBe("harbor-01");
    expect(CAMPAIGN[119]?.id).toBe("sky-30");
    for (const chapter of CHAPTER_IDS) {
      const rows = CAMPAIGN.filter((record) => record.chapter === chapter);
      expect(rows).toHaveLength(30);
      rows.forEach((record, k) => {
        expect(record.id).toBe(`${chapter}-${String(k + 1).padStart(2, "0")}`);
        expect(record.index).toBe(k + 1);
      });
    }
  });

  it("has unique titles of at most 24 characters", () => {
    const titles = CAMPAIGN.map((record) => record.title.toLowerCase());
    expect(new Set(titles).size).toBe(120);
    for (const record of CAMPAIGN) {
      expect(record.title.length).toBeGreaterThan(0);
      expect(record.title.length).toBeLessThanOrEqual(24);
    }
  });

  it("matches the size table per chapter and ascends in size", () => {
    for (const chapter of CHAPTER_IDS) {
      const rows = chapterPuzzles(chapter);
      const counts: Record<number, number> = {};
      for (const record of rows) counts[record.size] = (counts[record.size] ?? 0) + 1;
      expect(counts).toEqual(CHAPTER_SIZE_COUNTS[chapter]);
      const sizes = rows.map((record) => record.size);
      expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    }
  });

  it("has chapters with blurbs, unlock thresholds and backdrop slots", () => {
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual(["harbor", "garden", "bridge", "sky"]);
    expect(CHAPTERS.map((chapter) => chapter.unlockStars)).toEqual([0, 45, 120, 210]);
    for (const chapter of CHAPTERS) {
      expect(chapter.blurb.length).toBeLessThanOrEqual(90);
      expect(chapter.backdrop).toBe(`backdrop-${chapter.id}`);
    }
    expect(getChapter("bridge").mechanic).toBe("Mirrors");
  });

  it("looks puzzles up, steps through the campaign and gates chapters by stars", () => {
    expect(getPuzzle("garden-05")?.title).toBe("Plum Blossom");
    expect(getPuzzle("nope")).toBeUndefined();
    expect(chapterPuzzles("sky")).toHaveLength(30);
    expect(nextPuzzle("harbor-01")?.id).toBe("harbor-02");
    expect(nextPuzzle("harbor-30")?.id).toBe("garden-01");
    expect(nextPuzzle("sky-30")).toBeUndefined();
    expect(nextPuzzle("nope")).toBeUndefined();
    expect(unlockedChapters(0).map((chapter) => chapter.id)).toEqual(["harbor"]);
    expect(unlockedChapters(45).map((chapter) => chapter.id)).toEqual(["harbor", "garden"]);
    expect(unlockedChapters(209)).toHaveLength(3);
    expect(unlockedChapters(360)).toHaveLength(4);
  });
});

describe("every puzzle is proven", () => {
  it("decodes and re-encodes to the same code, with a valid shape", () => {
    for (const { record } of proven) {
      const decoded = decodePuzzle(record.code, record.id);
      expect(decoded.ok, record.id).toBe(true);
      if (!decoded.ok) continue;
      expect(encodePuzzle(decoded.value), record.id).toBe(record.code);
      expect(validatePuzzleShape(decoded.value).ok, record.id).toBe(true);
      expect(decoded.value.size, record.id).toBe(record.size);
    }
  });

  it("has exactly one solution and it equals the stored solution", () => {
    for (const { record, solved } of proven) {
      expect(solved.exhausted, record.id).toBe(false);
      expect(solved.count, record.id).toBe(1);
      expect(
        equalTiles(solved.solutions[0] as Uint8Array, solutionFromRecord(record)),
        record.id,
      ).toBe(true);
    }
  });

  it("evaluates the stored solution as solved and the initial board as unsolved", () => {
    for (const { record } of proven) {
      const puzzle = puzzleFromRecord(record);
      expect(evaluate(puzzle, solutionFromRecord(record)).solved, record.id).toBe(true);
      expect(evaluate(puzzle, emptyTiles(puzzle)).solved, record.id).toBe(false);
    }
  });

  it("has a lantern on every loop of the solution and no open chains", () => {
    for (const { record } of proven) {
      const analysis = analyseLoops(puzzleFromRecord(record), solutionFromRecord(record));
      expect(analysis.chains, record.id).toEqual([]);
      expect(analysis.loops.length, record.id).toBeGreaterThan(0);
      for (const loop of analysis.loops) expect(loop.lanterns.length, record.id).toBeGreaterThan(0);
    }
  });

  it("keeps the proof cheap enough for the player's device", () => {
    for (const { record, solved } of proven) expect(solved.nodes, record.id).toBeLessThan(40_000);
  });
});

describe("mechanic gating", () => {
  const stats = () =>
    proven.map(({ record }) => ({ record, counts: countClues(puzzleFromRecord(record)) }));

  it("adds one mechanic per chapter", () => {
    for (const { record, counts } of stats()) {
      expect(counts.lanterns, record.id).toBeGreaterThan(0);
      if (record.chapter === "harbor") expect(counts.stones, record.id).toBe(0);
      else expect(counts.stones, record.id).toBeGreaterThan(0);
      if (record.chapter === "harbor" || record.chapter === "garden") {
        expect(counts.mirrors, record.id).toBe(0);
      } else expect(counts.mirrors, record.id).toBeGreaterThan(0);
      if (record.chapter !== "sky") {
        expect(counts.gates, record.id).toBe(0);
        expect(counts.colours, record.id).toEqual(["amber"]);
      } else expect(counts.gates, record.id).toBeGreaterThan(0);
    }
  });

  it("introduces the mechanic in puzzle 1 and uses every mechanic in the finale", () => {
    const by = new Map(stats().map((row) => [row.record.id, row.counts]));
    expect(by.get("garden-01")?.stones).toBeGreaterThan(0);
    expect(by.get("bridge-01")?.mirrors).toBeGreaterThan(0);
    expect(by.get("sky-01")?.gates).toBeGreaterThan(0);
    for (const id of ["harbor-30", "garden-30", "bridge-30", "sky-30"]) {
      const counts = by.get(id);
      expect(counts?.lanterns, id).toBeGreaterThan(0);
      if (id !== "harbor-30") expect(counts?.stones, id).toBeGreaterThan(0);
      if (id === "bridge-30" || id === "sky-30") expect(counts?.mirrors, id).toBeGreaterThan(0);
      if (id === "sky-30") expect(counts?.gates, id).toBeGreaterThan(0);
    }
  });

  it("introduces colours in order and uses all five in Sky 27", () => {
    const sky = new Map(
      stats()
        .filter((row) => row.record.chapter === "sky")
        .map((row) => [row.record.index, row.counts.colours]),
    );
    const intro: Array<[number, Colour]> = [
      [1, "rose"],
      [3, "jade"],
      [4, "violet"],
      [5, "azure"],
    ];
    for (const [index, colour] of intro) {
      expect(sky.get(index), `sky-${index}`).toContain(colour);
      for (let before = 1; before < index; before++) {
        expect(sky.get(before), `sky-${before}`).not.toContain(colour);
      }
    }
    expect(sky.get(1)).toEqual(["amber", "rose"]);
    expect(sky.get(27)).toHaveLength(5);
    for (const colours of sky.values()) {
      expect(colours.length).toBeGreaterThanOrEqual(2);
      expect(colours.length).toBeLessThanOrEqual(5);
    }
    expect(skyColours(27)).toHaveLength(5);
  });

  it("keeps clue counts inside the ranges of the content plan", () => {
    for (const { record, counts } of stats()) {
      const mechanics = getChapter(record.chapter).mechanics;
      const ranges = rangesFor(
        record.size,
        mechanics,
        record.chapter === "bridge" || record.chapter === "sky",
      );
      const within = (value: number, range: readonly [number, number]) =>
        value >= range[0] && value <= range[1];
      expect(
        within(counts.lanterns, ranges.lanterns),
        `${record.id} lanterns ${counts.lanterns}`,
      ).toBe(true);
      expect(within(counts.stones, ranges.stones), `${record.id} stones ${counts.stones}`).toBe(
        true,
      );
      expect(within(counts.mirrors, ranges.mirrors), `${record.id} mirrors ${counts.mirrors}`).toBe(
        true,
      );
      expect(within(counts.gates, ranges.gates), `${record.id} gates ${counts.gates}`).toBe(true);
    }
  });
});

describe("anchors and ratings", () => {
  it("keeps anchors under the hard limit and each chapter median at or under the target", () => {
    for (const chapter of CHAPTER_IDS) {
      const shares = proven
        .filter(({ record }) => record.chapter === chapter)
        .map(({ record }) => analyseRecord(record).anchorShare);
      for (const share of shares) expect(share).toBeLessThanOrEqual(ANCHOR_HARD_LIMIT);
      expect(median(shares), chapter).toBeLessThanOrEqual(ANCHOR_MEDIAN_LIMIT);
    }
    expect(ANCHOR_HARD_LIMIT).toBe(50);
    expect(ANCHOR_MEDIAN_LIMIT).toBe(35);
  });

  it("stores integer ratings 1 to 5 equal to the recomputed ones", () => {
    for (const { record } of proven) {
      expect(Number.isInteger(record.rating), record.id).toBe(true);
      expect(record.rating).toBeGreaterThanOrEqual(1);
      expect(record.rating).toBeLessThanOrEqual(5);
      expect(ratingOf(measure(puzzleFromRecord(record))), record.id).toBe(record.rating);
    }
  });

  it("never lowers the rating from one band of six puzzles to the next", () => {
    for (const chapter of CHAPTER_IDS) {
      const rows = chapterPuzzles(chapter);
      for (let band = 1; band < 5; band++) {
        const before = rows.slice((band - 1) * 6, band * 6).map((record) => record.rating);
        const after = rows.slice(band * 6, (band + 1) * 6).map((record) => record.rating);
        expect(Math.max(...before), `${chapter} band ${band}`).toBeLessThanOrEqual(
          Math.min(...after),
        );
      }
    }
  });

  it("matches the committed campaign report", () => {
    const report = JSON.parse(readFileSync(REPORT, "utf8")) as ReturnType<typeof analyseRecord>[];
    expect(report).toHaveLength(120);
    expect(report).toEqual(CAMPAIGN.map((record) => analyseRecord(record)));
  });
});

describe("seeds and validation", () => {
  it("stores hash(ll-gen-1|id) as the seed and re-derives sampled puzzles from it", () => {
    for (const record of CAMPAIGN) expect(record.seed, record.id).toBe(campaignSeed(record.id));
    const sample = new Set([
      "harbor-01",
      "harbor-30",
      "garden-15",
      "bridge-01",
      "bridge-27",
      "sky-01",
      "sky-27",
      "sky-30",
    ]);
    for (const spec of campaignSpecs().filter((row) => sample.has(row.id))) {
      const made = generatePuzzle(spec.params, spec.seed);
      const record = getPuzzle(spec.id) as PuzzleRecord;
      expect(encodePuzzle(made.puzzle), spec.id).toBe(record.code);
      expect(made.rating, spec.id).toBe(record.rating);
    }
  });

  it("validateCampaign accepts the shipped data", () => {
    expect(validateCampaign()).toEqual([]);
  });

  it("validateCampaign flags tampered data", () => {
    const swap = (id: string, patch: Partial<PuzzleRecord>) =>
      CAMPAIGN.map((record) => (record.id === id ? { ...record, ...patch } : record));
    const messages = (records: readonly PuzzleRecord[]) =>
      validateCampaign(records).map((issue) => `${issue.id}: ${issue.message}`);
    const target = getPuzzle("garden-10") as PuzzleRecord;
    expect(messages(CAMPAIGN.slice(1)).join("\n")).toContain("119 puzzles");
    expect(
      messages(swap("garden-10", { rating: target.rating === 5 ? 4 : 5 })).join("\n"),
    ).toContain("rating");
    expect(messages(swap("garden-10", { title: "Plum Blossom" })).join("\n")).toContain(
      "duplicate title",
    );
    expect(messages(swap("garden-10", { seed: 1 })).join("\n")).toContain("seed");
    expect(
      messages(swap("garden-10", { solution: "0".repeat(target.size * target.size) })).join("\n"),
    ).toContain("solution");
    const stripped = target.code.replace(/=[0-9a-f]/, "");
    expect(stripped).not.toBe(target.code);
    expect(messages(swap("garden-10", { code: stripped })).join("\n")).toMatch(
      /solutions found|ran out/,
    );
    expect(messages(swap("garden-10", { code: "nonsense" })).join("\n")).toContain(
      "does not decode",
    );
  });
});
