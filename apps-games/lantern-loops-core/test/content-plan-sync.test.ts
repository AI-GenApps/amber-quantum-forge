import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAMPAIGN,
  CHAPTER_SIZE_COUNTS,
  CHAPTERS,
  MAX_STARS,
  PUZZLE_COUNT,
} from "../src/content/chapters";
import { CHAPTER_IDS, type ChapterId } from "../src/content/types";

const KB = join(import.meta.dirname, "..", "..", "..", ".agents", "games", "lantern-loops");
const PLAN = readFileSync(join(KB, "content-plan.md"), "utf8");
const README = readFileSync(join(KB, "README.md"), "utf8");

interface PlanRow {
  readonly id: string;
  readonly title: string;
  readonly size: number;
}

function section(text: string, from: string, to: string): string {
  const start = text.indexOf(from);
  const end = text.indexOf(to, start + from.length);
  if (start < 0 || end < 0) throw new Error(`section ${from} not found`);
  return text.slice(start, end);
}

function planRows(): Map<ChapterId, PlanRow[]> {
  const body = section(PLAN, "## 3. Campaign puzzles (120)", "## 4.");
  const out = new Map<ChapterId, PlanRow[]>();
  let current: ChapterId | null = null;
  for (const line of body.split("\n")) {
    const heading = /^### (\w+) \(30\)/.exec(line);
    if (heading) {
      current = (heading[1] as string).toLowerCase() as ChapterId;
      out.set(current, []);
      continue;
    }
    if (current === null || !line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    for (let k = 0; k + 2 < cells.length; k += 3) {
      const number = cells[k] as string;
      const size = /^(\d)x\1$/.exec(cells[k + 2] as string);
      if (/^\d\d$/.test(number) && size) {
        out.get(current)?.push({
          id: `${current}-${number}`,
          title: cells[k + 1] as string,
          size: Number(size[1]),
        });
      }
    }
  }
  return out;
}

describe("content plan stays in sync with the code", () => {
  const plan = planRows();

  it("parses 30 rows for each of the four chapters", () => {
    expect([...plan.keys()]).toEqual([...CHAPTER_IDS]);
    for (const rows of plan.values()) expect(rows).toHaveLength(30);
  });

  it("lists every campaign puzzle in the data with the same title and size (and the reverse)", () => {
    const fromPlan = new Map([...plan.values()].flat().map((row) => [row.id, row]));
    expect(fromPlan.size).toBe(PUZZLE_COUNT);
    for (const record of CAMPAIGN) {
      const row = fromPlan.get(record.id);
      expect(row, record.id).toBeDefined();
      expect(record.title, record.id).toBe(row?.title);
      expect(record.size, record.id).toBe(row?.size);
    }
    const inData = new Set(CAMPAIGN.map((record) => record.id));
    for (const id of fromPlan.keys()) expect(inData.has(id), id).toBe(true);
  });

  it("matches the size bands of every chapter", () => {
    for (const chapter of CHAPTER_IDS) {
      const bands = new RegExp(
        `### ${chapter[0]?.toUpperCase()}${chapter.slice(1)} \\(30\\)[\\s\\S]*?Size bands: ([^\\n]+)`,
      ).exec(PLAN);
      expect(bands, chapter).not.toBeNull();
      const counts: Record<number, number> = {};
      const text = (bands as RegExpExecArray)[1] as string;
      for (const match of text.matchAll(/(\d)x\1 = (\d+)/g)) {
        counts[Number(match[1])] = Number(match[2]);
      }
      expect(counts, chapter).toEqual(CHAPTER_SIZE_COUNTS[chapter]);
    }
  });

  it("matches the sizes-per-chapter table", () => {
    const table = section(PLAN, "### Sizes per chapter (30 each)", "Sizes appear");
    for (const chapter of CHAPTER_IDS) {
      const name = `${chapter[0]?.toUpperCase()}${chapter.slice(1)}`;
      const line = table.split("\n").find((row) => row.startsWith(`| ${name} |`));
      expect(line, name).toBeDefined();
      const cells = (line as string)
        .split("|")
        .slice(2, 7)
        .map((cell) => Number(cell.trim()));
      const want = [5, 6, 7, 8, 9].map((size) => CHAPTER_SIZE_COUNTS[chapter][size] ?? 0);
      expect(cells, name).toEqual(want);
    }
  });

  it("matches the chapter blurbs", () => {
    for (const chapter of CHAPTERS) {
      const found = new RegExp(`^- ${chapter.title}: "([^"]+)"`, "m").exec(PLAN);
      expect(found?.[1], chapter.id).toBe(chapter.blurb);
    }
  });

  it("matches the unlock thresholds, backdrop slots and mechanic names", () => {
    const table = section(PLAN, "## 2. Chapters", "Chapter blurbs");
    for (const chapter of CHAPTERS) {
      const line = table.split("\n").find((row) => row.startsWith(`| ${chapter.title} |`));
      expect(line, chapter.title).toBeDefined();
      const cells = (line as string).split("|").map((cell) => cell.trim());
      expect(cells[2], chapter.title).toBe(`\`${chapter.backdrop}\``);
      const unlock = cells[4] as string;
      if (chapter.unlockStars === 0) expect(unlock).toBe("open");
      else expect(unlock).toBe(`${chapter.unlockStars} stars`);
      expect(cells[5], chapter.title).toBe(chapter.mechanic);
    }
  });

  it("matches the clue ranges table", () => {
    const table = section(PLAN, "### Clue ranges per board", "A chapter's mechanic count");
    const expected: Record<number, string> = {
      5: "| 5x5 | 2 to 3 | 2 to 3 | 1 to 2 | n/a |",
      6: "| 6x6 | 3 to 4 | 3 to 5 | 2 to 3 | 1 to 2 |",
      7: "| 7x7 | 3 to 5 | 4 to 6 | 2 to 4 | 2 to 3 |",
      8: "| 8x8 | 4 to 6 | 5 to 8 | 3 to 5 | 2 to 4 |",
      9: "| 9x9 | 5 to 8 | 6 to 9 | 4 to 6 | 3 to 5 |",
    };
    for (const row of Object.values(expected)) expect(table).toContain(row);
  });

  it("keeps the README quick facts equal to the code constants", () => {
    expect(README).toContain("120 puzzles, 4 chapters of 30");
    expect(README).toContain(
      `Garden at ${CHAPTERS[1]?.unlockStars} total stars, Bridge at ${CHAPTERS[2]?.unlockStars}, Sky at ${CHAPTERS[3]?.unlockStars} (maximum ${MAX_STARS})`,
    );
    expect(README).toContain("Harbor 10 x 5x5 + 10 x 6x6 + 10 x 7x7");
    expect(PLAN).toContain("Generator version string: `ll-gen-1`");
  });
});
