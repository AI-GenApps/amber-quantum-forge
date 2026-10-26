import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACHIEVEMENTS,
  ALMANAC,
  CASES,
  CHAPTER_BONUS,
  CHAPTER_UNLOCKS,
  CHAPTERS,
  FIRST_CLOSE_POSTAGE,
  FREEZE_PRICE,
  HINT_PRICE,
  LEDGER,
  MAX_FREEZES,
  MAX_HINTS_PER_CASE,
  MIN_FITS_TO_ACCUSE,
  PEOPLE,
  STAMP_POSTAGE,
  START_POSTAGE,
  THEMES,
  TOTAL_ACHIEVEMENTS,
  TOTAL_ALMANAC,
  TOTAL_CASES,
  TOTAL_CHAPTERS,
  TOTAL_CLUES,
  TOTAL_DEDUCTIONS,
  TOTAL_DIRECT,
  TOTAL_FLAVOUR_CLUES,
  TOTAL_LEAD_CLUES,
  TOTAL_OBJECTS,
  TOTAL_PAIR,
  TOTAL_PEOPLE,
  TOTAL_RULE_OUT,
  TOTAL_STAMPS,
} from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { BUDGETS, measureAssets } from "../scripts/bundle-lib";
import { SLOTS } from "../src/art/slots";
import { AUDIO_SLOTS } from "../src/audio/slots";

const APP = join(import.meta.dirname, "..");
const KB = join(APP, "../../.agents/games/lost-parcel-desk");
const read = (name: string): string => readFileSync(join(KB, name), "utf8");

const README = read("README.md");
const PRODUCT = read("product.md");
const ECONOMY = read("economy.md");
const CONTENT = read("content-plan.md");
const STORE = read("store-listing.md");
const ASSETS = read("assets-index.md");
const DECISIONS = read("decisions-log.md");
const QUESTIONS = read("open-questions.md");

const SOUNDS = AUDIO_SLOTS.filter((slot) => slot.kind !== "music");
const MUSIC = AUDIO_SLOTS.filter((slot) => slot.kind === "music");
const CAMPAIGN_POSTAGE =
  START_POSTAGE +
  TOTAL_CASES * FIRST_CLOSE_POSTAGE +
  TOTAL_STAMPS * STAMP_POSTAGE +
  TOTAL_CHAPTERS * CHAPTER_BONUS;
const REJECTED = ["key-art", "evidence-04-3", "evidence-08-1", "townsfolk-9"];
const rowOf = (doc: string, key: string): string | undefined =>
  doc.split("\n").find((line) => line.startsWith(`| ${key} |`));

function fact(label: string): string {
  const line = rowOf(README, label);
  if (!line) throw new Error(`README.md has no quick fact "${label}"`);
  return line;
}

describe("shipped numbers", () => {
  it("match the values every document repeats", () => {
    expect(CASES).toHaveLength(12);
    expect(CHAPTERS).toHaveLength(3);
    expect(TOTAL_STAMPS).toBe(36);
    expect(CASES.flatMap((item) => item.objects)).toHaveLength(49);
    expect(CASES.flatMap((item) => item.clues)).toHaveLength(70);
    expect(CASES.flatMap((item) => item.clues).filter((clue) => clue.flavour)).toHaveLength(37);
    expect(CASES.flatMap((item) => item.deductions)).toHaveLength(24);
    expect(PEOPLE).toHaveLength(12);
    expect(ALMANAC).toHaveLength(24);
    expect(LEDGER).toHaveLength(12);
    expect(ACHIEVEMENTS).toHaveLength(12);
    expect(THEMES.map((theme) => theme.stampsNeeded)).toEqual([0, 6, 14, 24, 33]);
    expect([...CHAPTER_UNLOCKS]).toEqual([0, 7, 18]);
    expect(CHAPTERS.map((chapter) => chapter.unlockStamps)).toEqual([0, 7, 18]);
    expect(CAMPAIGN_POSTAGE).toBe(450);
    expect([HINT_PRICE.campaign, HINT_PRICE.daily, FREEZE_PRICE, MAX_FREEZES]).toEqual([
      20, 15, 30, 2,
    ]);
    expect([MIN_FITS_TO_ACCUSE, MAX_HINTS_PER_CASE]).toEqual([2, 2]);
    expect(SLOTS).toHaveLength(67);
    expect(SOUNDS).toHaveLength(27);
    expect(MUSIC).toHaveLength(2);
  });

  it("match the totals constants of the core", () => {
    expect(TOTAL_CASES).toBe(CASES.length);
    expect(TOTAL_OBJECTS).toBe(49);
    expect(TOTAL_CLUES).toBe(TOTAL_LEAD_CLUES + TOTAL_FLAVOUR_CLUES);
    expect([TOTAL_LEAD_CLUES, TOTAL_FLAVOUR_CLUES]).toEqual([33, 37]);
    expect(TOTAL_DEDUCTIONS).toBe(TOTAL_DIRECT + TOTAL_PAIR + TOTAL_RULE_OUT);
    expect([TOTAL_DIRECT, TOTAL_PAIR, TOTAL_RULE_OUT]).toEqual([12, 9, 3]);
    expect([TOTAL_PEOPLE, TOTAL_ALMANAC, TOTAL_ACHIEVEMENTS]).toEqual([12, 24, 12]);
  });

  it("keeps the deduction kinds and the lead and flavour split the documents state", () => {
    const deductions = CASES.flatMap((item) => item.deductions);
    const count = (kind: string): number => deductions.filter((item) => item.kind === kind).length;
    expect([count("direct"), count("pair"), count("rule-out")]).toEqual([12, 9, 3]);
    const leadIds = new Set(deductions.flatMap((item) => item.clueIds));
    expect(leadIds.size).toBe(33);
  });

  it("keeps the dev port and the app id", () => {
    expect(config.appId).toBe("app.w3dev.lostparceldesk");
    const vite = readFileSync(join(APP, "vite.config.ts"), "utf8");
    expect(vite).toContain("port: 4016");
    expect(fact("Dev port")).toContain("4016");
    expect(fact("App id")).toContain(config.appId);
  });
});

describe("README quick facts", () => {
  it("states the status as complete and pending owner QA", () => {
    expect(README).toContain("Status: v1 complete, pending owner QA");
  });

  it("states the campaign, evidence, stamps and unlocks", () => {
    expect(fact("Campaign")).toContain("3 chapters x 4 cases = 12 cases, 36 stamps");
    expect(fact("Evidence")).toContain("49 objects");
    expect(fact("Evidence")).toContain("70 clues (33 lead, 37 flavour)");
    expect(fact("Evidence")).toContain(
      "24 deductions (12 direct, 9 key-and-lock pairs, 3 rule-outs)",
    );
    expect(fact("Cast")).toContain("12 townsfolk");
    expect(fact("Chapter unlocks")).toContain("Chapter 2 at 7 stamps, chapter 3 at 18 stamps");
    expect(fact("Themes / achievements")).toContain(
      "5 desk themes (0 to 33 stamps), 12 achievements",
    );
  });

  it("states postage sources and sinks", () => {
    const currency = fact("Currency");
    expect(currency).toContain(`${CAMPAIGN_POSTAGE} from the campaign`);
    expect(currency).toContain(`hints (${HINT_PRICE.campaign} / ${HINT_PRICE.daily})`);
    expect(currency).toContain(`streak freezes (${FREEZE_PRICE})`);
  });

  it("states audio, art and budgets", () => {
    expect(fact("Audio")).toContain(`${SOUNDS.length} sounds and ${MUSIC.length} music loops`);
    expect(fact("Art")).toContain(`${SLOTS.length} designer slots`);
    const budgets = fact("Budgets");
    expect(budgets).toContain(`JS bundle <= ${BUDGETS.jsGzipBytes / 1024} KB gzip`);
    expect(budgets).toContain(`art <= ${BUDGETS.artBytes / 1024 / 1024} MB`);
    expect(budgets).toContain(`fonts <= ${BUDGETS.fontBytes / 1024} KB`);
    expect(budgets).toContain(`audio <= ${BUDGETS.audioBytes / 1024 / 1024} MB`);
  });
});

describe("product.md and economy.md", () => {
  it("state the stamp rules, the hint and freeze prices and the unlocks", () => {
    expect(PRODUCT).toContain(`campaign ${HINT_PRICE.campaign}, daily ${HINT_PRICE.daily}`);
    expect(PRODUCT).toContain("Chapter 2 unlocks at 7 total stamps and chapter 3 at 18");
    expect(PRODUCT).toContain("(0, 6, 14, 24, 33)");
    expect(PRODUCT).toContain("the campaign maximum is 36");
  });

  it("states the postage grant, sources and sinks", () => {
    expect(ECONOMY).toContain(`| Starting grant | ${START_POSTAGE} |`);
    expect(ECONOMY).toContain("30 + 120 + 180 + 120 = **450 postage**");
    expect(ECONOMY).toContain(`| Hint (campaign case) | ${HINT_PRICE.campaign} |`);
    expect(ECONOMY).toContain(`| Hint (daily case) | ${HINT_PRICE.daily} |`);
    expect(ECONOMY).toContain(`| Streak freeze | ${FREEZE_PRICE} |`);
    expect(ECONOMY).toContain("| Chapter 2: Rain on the Sorting Room | 7 (and case 04 closed) |");
    expect(ECONOMY).toContain("| Chapter 3: The Last Sack | 18 (and case 08 closed) |");
    expect(ECONOMY).toContain("| Desk themes 2 to 5 | 6, 14, 24, 33 |");
  });
});

describe("content-plan.md", () => {
  it("states the totals", () => {
    expect(CONTENT).toContain("12 cases (4 per chapter)");
    expect(CONTENT).toContain("49 evidence objects");
    expect(CONTENT).toContain("70 clues: 33 lead clues");
    expect(CONTENT).toContain("24 deductions: 12 direct, 9 key-and-lock pairs, 3 rule-outs");
    expect(CONTENT).toContain("5 desk themes, 12 achievements");
  });

  it("has one case index row per case with the shipped title, owner and counts", () => {
    for (const item of CASES) {
      const number = item.id.slice(-2);
      const row = CONTENT.split("\n").find(
        (line) => line.startsWith(`| ${number} |`) && line.includes(item.title),
      );
      expect(row, item.id).toBeDefined();
      const owner = PEOPLE.find((person) => person.id === item.ownerId);
      const cells = (row ?? "").split("|").map((cell) => cell.trim());
      expect(cells[2]).toBe(item.title);
      expect(cells[5]).toBe(owner?.name);
      expect(cells[7]).toBe(String(item.objects.length));
      expect(cells[8]).toBe(String(item.clues.filter((clue) => !clue.flavour).length));
      expect(cells[9]).toBe(String(item.clues.filter((clue) => clue.flavour).length));
    }
  });

  it("lists every townsfolk, achievement and theme", () => {
    for (const person of PEOPLE) expect(CONTENT, person.id).toContain(`| ${person.name} |`);
    for (const achievement of ACHIEVEMENTS) {
      expect(CONTENT, achievement.id).toContain(`| ${achievement.id} | ${achievement.title} |`);
    }
    for (const theme of THEMES) {
      expect(CONTENT, theme.id).toContain(
        `| ${theme.id} | ${theme.name} | ${theme.stampsNeeded} |`,
      );
    }
  });
});

describe("store-listing.md", () => {
  it("repeats the content counts", () => {
    expect(STORE).toContain("12 hand-written cases in three chapters");
    expect(STORE).toContain("49 evidence objects, 12 townsfolk");
    expect(STORE).toContain("Five desk themes");
  });

  it("keeps the no-data, no-ads, no-purchase promises", () => {
    expect(STORE).toContain("No data collected. No data shared.");
    expect(STORE).toContain("No ads, no accounts, no purchases, nothing collected");
    expect(STORE).toContain("| Contains ads | No |");
    expect(STORE).toContain("| In-app purchases | No |");
  });

  it("fits the store text limits", () => {
    const cell = (label: string): string => (rowOf(STORE, label) ?? "").split("|")[2]?.trim() ?? "";
    expect(cell("App name").length).toBeLessThanOrEqual(30);
    expect(cell("Subtitle (App Store)").length).toBeLessThanOrEqual(30);
    expect(cell("Short description (Google Play)").length).toBeLessThanOrEqual(80);
    expect(cell("Promotional text").length).toBeLessThanOrEqual(170);
    expect(cell("Keywords (App Store)").length).toBeLessThanOrEqual(100);
  });
});

describe("assets-index.md", () => {
  it("has one row per art slot and the right slot heading", () => {
    expect(ASSETS).toContain(`## Art slots (${SLOTS.length})`);
    const missing = SLOTS.filter((slot) => !ASSETS.includes(`| \`${slot.id}\` |`));
    expect(missing).toEqual([]);
  });

  it("lists the four rejected slots as code-drawn placeholders", () => {
    for (const id of REJECTED) {
      expect(ASSETS, id).toContain(`| \`${id}\` | rejected`);
      expect(QUESTIONS, id).toContain(`\`${id}\``);
    }
  });

  it("states the measured art, font and audio totals", () => {
    const art = measureAssets("art", [".webp"]);
    const fonts = measureAssets("fonts", [".woff2"]);
    const audio = measureAssets("audio", [".ogg"]);
    expect(ASSETS).toContain(`${art.files.length} runtime WebP files`);
    expect(ASSETS).toContain(`${art.bytes.toLocaleString("en-US")} bytes`);
    expect(ASSETS).toContain(`${fonts.bytes.toLocaleString("en-US")} bytes`);
    expect(ASSETS).toContain(`${audio.bytes.toLocaleString("en-US")} bytes`);
    expect(ASSETS).toContain(`${SOUNDS.length} sound slots and ${MUSIC.length} music loops`);
  });
});

describe("decisions-log.md and open-questions.md", () => {
  it("records the final release entry", () => {
    expect(DECISIONS).toContain("Task 08: release readiness");
  });

  it("gives every open question an owner", () => {
    const rows = QUESTIONS.split("\n").filter((line) => /^\| Q\d+ \|/.test(line));
    expect(rows.length).toBeGreaterThanOrEqual(21);
    for (const row of rows) expect(row.split("|")[4]?.trim().length, row).toBeGreaterThan(0);
  });
});

describe("owner QA checklist", () => {
  const checklist = readFileSync(
    join(APP, "../../.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa-checklist.md"),
    "utf8",
  );

  it("names the three viewports and the dev server port", () => {
    for (const size of ["360 x 640", "390 x 844", "430 x 932"]) expect(checklist).toContain(size);
    expect(checklist).toContain("localhost:4016");
  });

  it("covers every case by number and title", () => {
    for (const item of CASES) {
      expect(checklist, item.id).toContain(`Case ${item.id.slice(-2)} ${item.title}`);
    }
  });

  it("covers every screen of the app", () => {
    const screens = [
      "Boot",
      "Home",
      "Case files",
      "Case intro",
      "Evidence table",
      "Object viewer",
      "Deduction board",
      "Reveal",
      "Town map",
      "Almanac",
      "Ledger",
      "Daily Parcel",
      "Achievements",
      "Records",
      "Desk themes",
      "Settings",
      "How to play",
      "Credits and licences",
    ];
    for (const screen of screens) expect(checklist, screen).toContain(`- [ ] ${screen}`);
  });

  it("lists what a browser pass does not cover", () => {
    expect(checklist).toContain("Android hardware Back button");
  });
});
