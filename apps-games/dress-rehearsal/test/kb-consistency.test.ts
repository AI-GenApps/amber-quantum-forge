import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AFFINITY_THRESHOLDS,
  CATEGORIES,
  CHALLENGES,
  CHAPTERS,
  CLIENTS,
  closetFor,
  DAILY_FALLBACKS,
  DAILY_REWARD,
  FRAME_IDS,
  FRAME_PRICE,
  FREEZE_PRICE,
  HARMONY_WEIGHTS,
  HINT_PRICE,
  MAX_FREEZES,
  MAX_GALLERY,
  PIECES,
  RULE_KINDS,
  START_COINS,
  THREE_STAR_HARMONY,
} from "@web-games/dress-rehearsal-core";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { SLOT_IDS, SLOTS } from "../src/art/slots";
import { AUDIO_SLOTS } from "../src/audio/slots";

const KB_DIR = join(import.meta.dirname, "../../../.agents/games/dress-rehearsal");
const kb = (name: string): string => readFileSync(join(KB_DIR, name), "utf8");
const APP_DIR = join(import.meta.dirname, "..");

const README = kb("README.md");
const ECONOMY = kb("economy.md");
const PRODUCT = kb("product.md");
const PLAN = kb("content-plan.md");
const ASSETS = kb("assets-index.md");
const STORE = kb("store-listing.md");
const DECISIONS = kb("decisions-log.md");

const list = (values: readonly number[], glue = ", "): string => values.join(glue);
const perChapter = CHAPTERS.map(
  (chapter) => CHALLENGES.filter((c) => c.chapterIndex === chapter.index).length,
);
const perClient = CLIENTS.map(
  (client) => CHALLENGES.filter((c) => c.clientId === client.id).length,
);
const perCategory = CATEGORIES.map(
  (category) => PIECES.filter((p) => p.category === category).length,
);

describe("code numbers behind the knowledge base", () => {
  it("has 6 chapters, 40 challenges, 120 stars", () => {
    expect(CHAPTERS).toHaveLength(6);
    expect(CHALLENGES).toHaveLength(40);
    expect(perChapter).toEqual([7, 7, 7, 7, 6, 6]);
    expect(CHALLENGES.length * 3).toBe(120);
  });

  it("has 48 pieces with the category counts and a 16-piece starting closet", () => {
    expect(PIECES).toHaveLength(48);
    expect(perCategory).toEqual([8, 7, 5, 6, 6, 6, 4, 6]);
    expect(closetFor(0)).toHaveLength(16);
    expect(closetFor(1)).toHaveLength(16);
    expect(CHAPTERS.map((chapter) => closetFor(chapter.index).length)).toEqual([
      16, 16, 24, 32, 40, 48,
    ]);
  });

  it("has 6 clients with 7, 7, 7, 7, 6, 6 challenges and 8 lines each", () => {
    expect(CLIENTS).toHaveLength(6);
    expect(perClient).toEqual([7, 7, 7, 7, 6, 6]);
    for (const client of CLIENTS) expect(Object.keys(client.lines), client.id).toHaveLength(8);
  });

  it("has 16 rule kinds and 7 daily fallbacks", () => {
    expect(RULE_KINDS).toHaveLength(16);
    expect(new Set(RULE_KINDS).size).toBe(16);
    expect(DAILY_FALLBACKS).toHaveLength(7);
  });

  it("pins unlocks, affinity, harmony and the star bar", () => {
    expect(CHAPTERS.map((chapter) => chapter.unlockStars)).toEqual([0, 0, 12, 27, 45, 66]);
    expect([...AFFINITY_THRESHOLDS]).toEqual([3, 9, 15]);
    expect(Object.values(HARMONY_WEIGHTS)).toEqual([40, 10, 20, 15, 15]);
    expect(THREE_STAR_HARMONY).toBe(70);
  });

  it("pins the economy", () => {
    expect(START_COINS).toBe(40);
    expect(HINT_PRICE).toEqual({ campaign: 20, daily: 30 });
    expect(FREEZE_PRICE).toBe(25);
    expect(MAX_FREEZES).toBe(2);
    expect(FRAME_PRICE).toEqual({ paper: 30, polaroid: 40, magazine: 60 });
    expect(FRAME_IDS).toHaveLength(4);
    expect([...DAILY_REWARD]).toEqual([0, 8, 12, 16]);
    expect(MAX_GALLERY).toBe(24);
  });

  it("has 63 art slots and 24 sounds plus 2 music loops", () => {
    expect(SLOT_IDS).toHaveLength(63);
    expect(SLOTS.filter((slot) => slot.inBundle)).toHaveLength(61);
    expect(AUDIO_SLOTS.filter((slot) => slot.kind === "sfx")).toHaveLength(24);
    expect(AUDIO_SLOTS.filter((slot) => slot.kind === "music")).toHaveLength(2);
  });

  it("pins the app id and the dev port", () => {
    expect(config.appId).toBe("app.w3dev.dressrehearsal");
    expect(readFileSync(join(APP_DIR, "vite.config.ts"), "utf8")).toContain("port: 4015");
  });
});

describe("README quick facts equal the code", () => {
  it("states the campaign shape", () => {
    expect(README).toContain(`${CHAPTERS.length} chapters`);
    expect(README).toContain(`${CHALLENGES.length} challenges (${list(perChapter)})`);
    expect(README).toContain(`${CHALLENGES.length * 3} stars`);
    expect(README).toContain(`${PIECES.length} pieces`);
    expect(README).toContain(`of ${RULE_KINDS.length} rule kinds`);
  });

  it("states unlocks, affinity, harmony and coins", () => {
    expect(README).toContain(
      "Riviera Summer 0, Rainy City 0, Gala Night 12, Mountain Weekend 27, Studio Avant-garde 45, Vintage 70s 66 stars",
    );
    expect(README).toContain(`affinity levels at ${list(AFFINITY_THRESHOLDS)}`);
    expect(README).toContain(
      `colour scheme ${HARMONY_WEIGHTS.scheme} + neutral anchor ${HARMONY_WEIGHTS.anchor} + dress code ${HARMONY_WEIGHTS.dressCode} + era match ${HARMONY_WEIGHTS.era} + season sense ${HARMONY_WEIGHTS.season}`,
    );
    expect(README).toContain(`harmony >= ${THREE_STAR_HARMONY} of 100`);
    expect(README).toContain("1460 from the campaign");
    expect(README).toContain(`hints (${HINT_PRICE.campaign} / ${HINT_PRICE.daily})`);
    expect(README).toContain(`streak freezes (${FREEZE_PRICE})`);
    expect(README).toContain(
      `export frames (${FRAME_PRICE.paper} / ${FRAME_PRICE.polaroid} / ${FRAME_PRICE.magazine})`,
    );
    expect(README).toContain(`up to ${MAX_GALLERY} saved boards`);
  });

  it("states art, audio, port and app id", () => {
    expect(README).toContain(`${SLOT_IDS.length} designer slots`);
    expect(README).toContain("24 sounds and 2 music loops");
    expect(README).toContain("`app.w3dev.dressrehearsal`");
    expect(README).toContain("| Dev server port | 4015 |");
    expect(README).toMatch(/Status: v1 complete, pending owner QA/);
  });
});

describe("economy.md equals the code", () => {
  it("lists every price, grant and total", () => {
    expect(ECONOMY).toContain(`| Starting grant | ${START_COINS} |`);
    expect(ECONOMY).toContain("1460 coins");
    expect(ECONOMY).toContain(`| Hint (campaign challenge) | ${HINT_PRICE.campaign} |`);
    expect(ECONOMY).toContain(`| Hint (Daily Fitting) | ${HINT_PRICE.daily} |`);
    expect(ECONOMY).toContain(`| Streak freeze | ${FREEZE_PRICE} |`);
    expect(ECONOMY).toContain(`| Frame: Paper Border | ${FRAME_PRICE.paper} |`);
    expect(ECONOMY).toContain(`| Frame: Polaroid | ${FRAME_PRICE.polaroid} |`);
    expect(ECONOMY).toContain(`| Frame: Magazine Cover | ${FRAME_PRICE.magazine} |`);
    expect(ECONOMY).toContain(`thresholds ${list(AFFINITY_THRESHOLDS)}`);
    expect(ECONOMY).toContain(
      "Gala Night 12, Mountain Weekend 27, Studio Avant-garde 45, Vintage 70s\n  66 stars",
    );
  });

  it("adds up: grant + clears + stars + chapter bonuses + affinity payments", () => {
    const total =
      START_COINS +
      10 * CHALLENGES.length +
      5 * CHALLENGES.length * 3 +
      40 * CHAPTERS.length +
      10 * 3 * CLIENTS.length;
    expect(total).toBe(1460);
  });
});

describe("content-plan.md and product.md equal the code", () => {
  it("states the totals", () => {
    expect(PLAN).toContain(
      `${CHAPTERS.length} chapters (one per theme), ${CHALLENGES.length} challenges (${list(perChapter)}), ${CHALLENGES.length * 3} campaign stars`,
    );
    expect(PLAN).toContain(
      `${PIECES.length} closet pieces (6 themes x 8): top ${perCategory[0]}, bottom ${perCategory[1]}, dress ${perCategory[2]}, outer ${perCategory[3]}, shoes ${perCategory[4]}, bag ${perCategory[5]}, hat ${perCategory[6]}, accessory ${perCategory[7]}`,
    );
    expect(PLAN).toContain(`${RULE_KINDS.length} rule kinds`);
    expect(PLAN).toContain(
      `affinity levels at ${AFFINITY_THRESHOLDS[0]}, ${AFFINITY_THRESHOLDS[1]} and ${AFFINITY_THRESHOLDS[2]} stars`,
    );
  });

  it("states the gallery cap", () => {
    expect(PRODUCT).toContain(`up to ${MAX_GALLERY} saved boards`);
  });

  it("names every chapter and every client", () => {
    for (const chapter of CHAPTERS) expect(PLAN, chapter.title).toContain(chapter.title);
    for (const client of CLIENTS) expect(PLAN, client.name).toContain(client.name);
  });
});

describe("assets-index.md and store-listing.md equal the code", () => {
  it("states the slot and sound counts", () => {
    expect(ASSETS).toContain(`${SLOT_IDS.length} slots`);
    expect(ASSETS).toContain("24 sounds, 2\nmusic loops");
    for (const slot of SLOT_IDS) expect(ASSETS, slot).toContain(`\`${slot}\``);
  });

  it("states the budgets", () => {
    expect(ASSETS).toContain("| JS bundle (gzip, excluding art, fonts and audio) | 300 KB |");
    expect(ASSETS).toContain("8 MB total");
    expect(ASSETS).toContain("total at most 300 KB");
    expect(ASSETS).toContain("| Audio | 2 MB total |");
  });

  it("repeats the store counts", () => {
    expect(STORE).toContain(`${CHALLENGES.length} handmade challenges across six themes`);
    expect(STORE).toContain(`${PIECES.length} pieces to collect`);
    expect(STORE).toContain("Six recurring clients");
    for (const chapter of CHAPTERS) expect(STORE, chapter.title).toContain(chapter.title);
  });

  it("logs the final epic decisions", () => {
    expect(DECISIONS).toMatch(/### D34\./);
  });
});
