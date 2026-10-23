import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  CHAPTER_IDS,
  CHAPTER_SIZE_COUNTS,
  DAILY_TIERS,
  MAX_FREEZES,
  MAX_STARS,
  MILESTONES,
  PUZZLE_COUNT,
  PUZZLES_PER_CHAPTER,
  STAR_UNLOCKS,
  STARS_BY_HINTS,
  TOKEN_CONFIG,
} from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { ART_SLOTS, SLOT_IDS } from "../../src/art/slots";
import { APP_DIR, BUDGETS, KB_DIR, REPO_ROOT, walk } from "./paths";

const FILES = [
  "README.md",
  "product.md",
  "economy.md",
  "content-plan.md",
  "store-listing.md",
  "assets-index.md",
  "decisions-log.md",
  "open-questions.md",
] as const;

const kb = (name: string): string => readFileSync(join(KB_DIR, name), "utf8");
const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

/** Quick-facts table of the README: first cell to second cell. */
function quickFacts(): Map<string, string> {
  const facts = new Map<string, string>();
  for (const line of kb("README.md").split("\n")) {
    const match = /^\| (.+?) \| (.+) \|$/.exec(line);
    if (match && !match[1]?.startsWith("---") && !match[1]?.startsWith("[")) {
      facts.set((match[1] ?? "").trim(), (match[2] ?? "").trim());
    }
  }
  return facts;
}

function fact(label: string): string {
  const value = quickFacts().get(label);
  if (value === undefined) throw new Error(`README quick fact missing: ${label}`);
  return value;
}

interface SlotRow {
  id: string;
  status: string;
}

function slotRows(): SlotRow[] {
  return kb("assets-index.md")
    .split("\n")
    .filter((line) => /^\| B[12] \|/.test(line))
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      return { id: (cells[2] ?? "").replaceAll("`", ""), status: cells[cells.length - 2] ?? "" };
    });
}

describe("knowledge base files", () => {
  it("has all eight files, each non-empty and free of TODO", () => {
    for (const name of FILES) {
      expect(existsSync(join(KB_DIR, name)), name).toBe(true);
      const text = kb(name);
      expect(text.length, name).toBeGreaterThan(500);
      expect(text, name).not.toMatch(/\bTODO\b/);
    }
  });

  it("links every file from the README index", () => {
    const readme = kb("README.md");
    for (const name of FILES.filter((f) => f !== "README.md")) {
      expect(readme, name).toContain(`](${name})`);
    }
  });
});

describe("README quick facts match the code constants", () => {
  it("campaign: 120 puzzles in 4 chapters of 30", () => {
    expect(PUZZLE_COUNT).toBe(120);
    expect(PUZZLES_PER_CHAPTER * CHAPTER_IDS.length).toBe(PUZZLE_COUNT);
    expect(fact("Campaign")).toContain(
      `${PUZZLE_COUNT} puzzles, ${CHAPTER_IDS.length} chapters of ${PUZZLES_PER_CHAPTER}`,
    );
  });

  it("chapter sizes", () => {
    const text = fact("Chapter sizes");
    const counts = (id: (typeof CHAPTER_IDS)[number]): string =>
      Object.values(CHAPTER_SIZE_COUNTS[id]).join("/");
    expect(text).toContain(`Garden ${counts("garden")}`);
    expect(text).toContain(`Bridge ${counts("bridge")}`);
    expect(text).toContain(`Sky ${counts("sky")}`);
    expect(Object.values(CHAPTER_SIZE_COUNTS.harbor)).toEqual([10, 10, 10]);
    expect(text).toContain("Harbor 10 x 5x5 + 10 x 6x6 + 10 x 7x7");
  });

  it("chapter unlocks 45, 120, 210 and the 360 maximum", () => {
    expect([STAR_UNLOCKS.garden, STAR_UNLOCKS.bridge, STAR_UNLOCKS.sky]).toEqual([45, 120, 210]);
    expect(MAX_STARS).toBe(360);
    expect(fact("Chapter unlocks")).toContain(
      `Garden at ${STAR_UNLOCKS.garden} total stars, Bridge at ${STAR_UNLOCKS.bridge}, Sky at ${STAR_UNLOCKS.sky} (maximum ${MAX_STARS})`,
    );
  });

  it("stars per hint count", () => {
    const [none, one, many] = STARS_BY_HINTS;
    expect(fact("Stars")).toBe(
      `0 hints = ${none} stars, 1 hint = ${one}, 2 or more hints = ${many}`,
    );
  });

  it("hint tokens: start 3, cap 20, cost 1", () => {
    expect(fact("Hint tokens")).toContain(
      `Start ${TOKEN_CONFIG.start}, cap ${TOKEN_CONFIG.cap}, cost ${TOKEN_CONFIG.hintCost} per hint`,
    );
    expect([TOKEN_CONFIG.start, TOKEN_CONFIG.cap]).toEqual([3, 20]);
    const economy = kb("economy.md");
    expect(economy).toContain(
      `+${MILESTONES[3]} / +${MILESTONES[7]} / +${MILESTONES[14]} / +${MILESTONES[30]} / +${MILESTONES[60]} / +${MILESTONES[100]}`,
    );
    expect(economy).toContain(`| Chapter cleared | +${TOKEN_CONFIG.chapterCleared} |`);
  });

  it("streak freeze: 1 per ISO week", () => {
    expect(MAX_FREEZES).toBe(1);
    expect(fact("Streak freeze")).toContain(`${MAX_FREEZES} per ISO week (cap ${MAX_FREEZES})`);
  });

  it("daily: Monday 5x5 to Sunday 9x9", () => {
    const monday = DAILY_TIERS[0]?.size;
    const sunday = DAILY_TIERS[6]?.size;
    expect([monday, sunday]).toEqual([5, 9]);
    expect(fact("Daily")).toContain(
      `Mon ${monday}x${monday} (easy) to Sun ${sunday}x${sunday} (hardest)`,
    );
    expect(kb("decisions-log.md")).toContain(
      DAILY_TIERS.map((t) => `${t.dayName.slice(0, 3)} ${t.size}x${t.size}`)
        .join(", ")
        .replace("Thu 7x7", "Thu 7x7 + mirrors")
        .replace("Sat 8x8", "Sat 8x8 + gates"),
    );
  });

  it("art slots: 15 listed, counts of shipped and placeholder match", () => {
    expect(SLOT_IDS).toHaveLength(15);
    expect(ART_SLOTS).toHaveLength(15);
    const rows = slotRows();
    const shipped = rows.filter((r) => r.status === "shipped").length;
    expect(fact("Art")).toContain(`${SLOT_IDS.length} slots`);
    expect(fact("Art")).toContain(`${shipped} of ${SLOT_IDS.length} art slots shipped`);
    expect(fact("Art")).toContain(`${SLOT_IDS.length - shipped} placeholders`);
  });

  it("budgets", () => {
    expect(fact("Budgets")).toBe(
      `JS bundle <= ${BUDGETS.jsGzipBytes / 1024} KB gzip (art, fonts, audio excluded), art <= ${BUDGETS.artBytes / 1024 / 1024} MB, audio <= ${BUDGETS.audioBytes / 1024 / 1024} MB, each woff2 <= ${BUDGETS.fontBytes / 1024} KB`,
    );
  });

  it("Capacitor ids and the dev port", () => {
    const config = readFileSync(join(APP_DIR, "capacitor.config.ts"), "utf8");
    const appId = /appId: "([^"]+)"/.exec(config)?.[1];
    expect(fact("Capacitor")).toContain(`appId \`${appId}\``);
    const vite = readFileSync(join(APP_DIR, "vite.config.ts"), "utf8");
    expect(fact("Capacitor")).toContain(`dev port ${/port: (\d+)/.exec(vite)?.[1]}`);
  });

  it("audio: file counts and budget", () => {
    const files = walk(join(APP_DIR, "public", "audio")).filter((p) => p.endsWith(".mp3"));
    expect(fact("Audio")).toContain(`${files.length - 1} effects`);
    expect(fact("Audio")).toContain("calm-loop");
  });

  it("the status line reports task 08", () => {
    const status = [...quickFacts()].find(([label]) => label.startsWith("Status"));
    expect(status?.[1]).toMatch(/Tasks 00 to 08/);
  });
});

describe("assets index", () => {
  it("lists all 15 slots and leaves none planned", () => {
    const rows = slotRows();
    expect(rows.map((r) => r.id).sort()).toEqual([...SLOT_IDS].sort());
    for (const row of rows) {
      expect(["shipped", "placeholder"], row.id).toContain(row.status);
    }
    expect(kb("assets-index.md")).not.toMatch(/\|\s*planned\s*\|\s*$/m);
  });

  it("lists every placeholder slot in open-questions and backs every shipped slot with a file", () => {
    const questions = kb("open-questions.md");
    for (const row of slotRows()) {
      if (row.status === "placeholder") expect(questions, row.id).toContain(`\`${row.id}\``);
      else {
        const slot = ART_SLOTS.find((s) => s.id === row.id);
        const file = slot?.inApp
          ? join(APP_DIR, "src", "art", "files", `${row.id}.webp`)
          : join(
              KB_DIR,
              "..",
              "..",
              "resources",
              "2026-10-23",
              "web-games",
              "lantern-loops",
              "art",
              "masters",
              `${row.id}.webp`,
            );
        expect(existsSync(file), `${row.id} -> ${relative(REPO_ROOT, file)}`).toBe(true);
      }
    }
  });

  it("records the provenance of every font: path, SHA-256 and licence file", () => {
    const index = kb("assets-index.md");
    const fonts = walk(join(APP_DIR, "public", "fonts")).filter((p) => p.endsWith(".woff2"));
    expect(fonts).toHaveLength(2);
    for (const font of fonts) {
      const line = index
        .split("\n")
        .find((l) => l.includes(`public/fonts/${basename(join(font, ".."))}/${basename(font)}`));
      expect(line, basename(font)).toBeDefined();
      expect(line, basename(font)).toContain(sha256(font));
      expect(existsSync(join(font, "..", "OFL.txt")), basename(font)).toBe(true);
    }
  });

  it("records source URL, licence and SHA-256 of every audio file", () => {
    const index = kb("assets-index.md");
    const files = walk(join(APP_DIR, "public", "audio")).filter((p) => p.endsWith(".mp3"));
    expect(files).toHaveLength(18);
    for (const file of files) {
      const line = index.split("\n").find((l) => l.includes(`public/audio/${basename(file)}`));
      expect(line, basename(file)).toBeDefined();
      expect(line, basename(file)).toContain(sha256(file));
      expect(line, basename(file)).toMatch(/https:\/\/(kenney\.nl|opengameart\.org)\//);
      expect(line, basename(file)).toContain("CC0");
    }
  });

  it("points at the evidence of task 08", () => {
    const index = kb("assets-index.md");
    for (const name of ["08/budgets.json", "08/no-data-audit.txt", "qa-checklist.md"]) {
      expect(index, name).toContain(name);
      expect(
        existsSync(
          join(KB_DIR, "..", "..", "resources", "2026-10-23", "web-games", "lantern-loops", name),
        ),
        name,
      ).toBe(true);
    }
  });
});

describe("decisions log", () => {
  const DECISION_AREAS: Record<string, RegExp> = {
    Rules: /tile-based/,
    Content: /Campaign sizes per chapter/,
    Unlocks: /chapters unlock at 45 \/ 120 \/ 210/,
    Stars: /\| Stars: 0 hints = 3/,
    Tokens: /\| Hint tokens: start 3, cap 20/,
    Streak: /\| Streak freeze: 1 per ISO week/,
    Daily: /\| Daily weekday tiers/,
    Budgets: /\| Budgets: /,
    Fonts: /\| Fonts: Fraunces/,
  };

  function epicAreas(): string[] {
    const status = readFileSync(
      join(REPO_ROOT, "tasks", "epics", "19-web-lantern-loops", "STATUS.md"),
      "utf8",
    );
    const start = status.indexOf("## Game design decisions");
    const end = status.indexOf("## Scope fence");
    return status
      .slice(start, end)
      .split("\n")
      .filter((line) => /^\| \w+ \| /.test(line) && !line.startsWith("| Area"))
      .map((line) => line.split("|")[1]?.trim() ?? "");
  }

  it("has a 2026-10-23 row for every area of the epic decision table", () => {
    const areas = epicAreas();
    expect(areas).toEqual(Object.keys(DECISION_AREAS));
    const rows = kb("decisions-log.md")
      .split("\n")
      .filter((line) => line.startsWith("| 2026-10-23 |"));
    for (const area of areas) {
      const pattern = DECISION_AREAS[area];
      expect(
        rows.some((row) => pattern?.test(row)),
        area,
      ).toBe(true);
    }
  });
});
