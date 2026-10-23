import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DAILY_COINS,
  FIRST_CLEAR_COINS,
  FREEZE_PRICE,
  HINT_PRICE,
  MAPS,
  MAX_FREEZES,
  PIECE_COSTS,
  REGION_BONUS_COINS,
  REGIONS,
  STAR_COINS,
  START_COINS,
  THEMES,
  TOTAL_FIELDS,
  TOTAL_HOUSES,
  TOTAL_STARS,
} from "@web-games/floodplain-dispatch-core";
import { describe, expect, it } from "vitest";
import { BUDGETS } from "../scripts/bundle-lib";
import { SLOTS } from "../src/art/slots";
import { AUDIO_SLOTS } from "../src/audio/slots";

const ROOT = join(import.meta.dirname, "../../..");
const KB = join(ROOT, ".agents/games/floodplain-dispatch");
const read = (name: string): string => readFileSync(join(KB, name), "utf8");

const README = read("README.md");
const PRODUCT = read("product.md");
const ECONOMY = read("economy.md");
const CONTENT = read("content-plan.md");
const STORE = read("store-listing.md");
const ASSETS = read("assets-index.md");
const DECISIONS = read("decisions-log.md");

const SOUNDS = AUDIO_SLOTS.filter((slot) => slot.kind !== "music");
const MUSIC = AUDIO_SLOTS.filter((slot) => slot.kind === "music");
const CAMPAIGN_COINS =
  START_COINS +
  MAPS.length * FIRST_CLEAR_COINS +
  TOTAL_STARS * STAR_COINS +
  REGIONS.length * REGION_BONUS_COINS;

function fact(label: string): string {
  const line = README.split("\n").find((entry) => entry.startsWith(`| ${label} |`));
  if (!line) throw new Error(`README.md has no quick fact "${label}"`);
  return line;
}

describe("shipped numbers", () => {
  it("match the values every document repeats", () => {
    expect(MAPS).toHaveLength(40);
    expect(REGIONS).toHaveLength(4);
    expect(TOTAL_STARS).toBe(120);
    expect(TOTAL_HOUSES).toBe(193);
    expect(TOTAL_FIELDS).toBe(133);
    expect(REGIONS.slice(1).map((region) => region.unlockStars)).toEqual([12, 33, 60]);
    expect(THEMES.map((theme) => theme.starsNeeded)).toEqual([0, 9, 27, 48, 75, 100, 120]);
    expect(CAMPAIGN_COINS).toBe(1250);
    expect(SLOTS).toHaveLength(20);
    expect(SOUNDS).toHaveLength(25);
    expect(MUSIC).toHaveLength(2);
    expect(PIECE_COSTS).toEqual({ canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 });
    expect([HINT_PRICE.campaign, HINT_PRICE.daily, FREEZE_PRICE, MAX_FREEZES]).toEqual([
      25, 40, 30, 2,
    ]);
    expect([DAILY_COINS[1], DAILY_COINS[2], DAILY_COINS[3]]).toEqual([10, 15, 20]);
  });
});

describe("README quick facts", () => {
  it("states the status as complete and pending owner QA", () => {
    expect(README).toContain("Status: v1 complete, pending owner QA");
  });

  it("states campaign size, stars, houses and fields", () => {
    expect(fact("Campaign")).toContain(`${REGIONS.length} regions x 10 maps = ${MAPS.length} maps`);
    expect(fact("Campaign")).toContain(`${TOTAL_STARS} stars`);
    expect(fact("Houses / fields in campaign")).toContain(`${TOTAL_HOUSES} / ${TOTAL_FIELDS}`);
  });

  it("states piece costs, unlocks, coins and themes", () => {
    const costs = PIECE_COSTS;
    expect(fact("Pieces")).toContain(
      `canal ${costs.canal}, barrier ${costs.barrier}, sluice gate ${costs.gate}, pump ${costs.pump}, reservoir ${costs.reservoir}`,
    );
    const unlocks = REGIONS.slice(1).map((region) => region.unlockStars);
    expect(fact("Region unlocks")).toContain(
      `Delta ${unlocks[0]}, Highland ${unlocks[1]}, Estuary ${unlocks[2]}`,
    );
    const currency = fact("Currency");
    expect(currency).toContain(`${CAMPAIGN_COINS} from the campaign`);
    expect(currency).toContain(`hints (${HINT_PRICE.campaign} / ${HINT_PRICE.daily})`);
    expect(currency).toContain(`streak freezes (${FREEZE_PRICE})`);
    expect(fact("Themes")).toContain(`${THEMES.length} cosmetic map themes`);
  });

  it("states audio, art and budgets", () => {
    expect(fact("Audio")).toContain(`${SOUNDS.length} sounds and ${MUSIC.length} music loops`);
    expect(fact("Art")).toContain(`${SLOTS.length} designer slots`);
    expect(fact("Budgets")).toContain(`JS bundle <= ${BUDGETS.jsGzipBytes / 1024} KB gzip`);
    expect(fact("Budgets")).toContain(`art <= ${BUDGETS.artBytes / 1024 / 1024} MB`);
    expect(fact("Budgets")).toContain(`fonts <= ${BUDGETS.fontBytes / 1024} KB`);
    expect(fact("Budgets")).toContain(`audio <= ${BUDGETS.audioBytes / 1024 / 1024} MB`);
  });
});

describe("product.md", () => {
  it("lists every piece with its cost", () => {
    const rows: [string, number][] = [
      ["Canal", PIECE_COSTS.canal],
      ["Sandbag barrier", PIECE_COSTS.barrier],
      ["Pump", PIECE_COSTS.pump],
      ["Sluice gate", PIECE_COSTS.gate],
      ["Reservoir", PIECE_COSTS.reservoir],
    ];
    for (const [name, cost] of rows) {
      const line = PRODUCT.split("\n").find((entry) => entry.startsWith(`| ${name} |`));
      expect(line, name).toBeDefined();
      expect(line?.split("|")[2]?.trim(), name).toBe(String(cost));
    }
  });

  it("states the unlock thresholds and the hint and freeze prices", () => {
    for (const region of REGIONS.slice(1)) {
      expect(PRODUCT).toContain(`${region.unlockStars}`);
    }
    expect(PRODUCT).toContain(`${HINT_PRICE.campaign}`);
    expect(PRODUCT).toContain(`${HINT_PRICE.daily}`);
    expect(PRODUCT).toContain(`${FREEZE_PRICE}`);
  });
});

describe("economy.md", () => {
  it("states the campaign total, the star count and the budgets of coins", () => {
    expect(ECONOMY).toContain(`= ${CAMPAIGN_COINS} coins`);
    expect(ECONOMY).toContain(`${MAPS.length} maps x 3 stars = ${TOTAL_STARS}`);
    expect(ECONOMY).toContain(`(${TOTAL_STARS} stars, ${TOTAL_STARS * STAR_COINS} total)`);
  });
});

describe("content-plan.md", () => {
  it("states the house and field totals", () => {
    expect(CONTENT).toContain(`${TOTAL_HOUSES} houses and ${TOTAL_FIELDS} fields`);
    expect(CONTENT).toContain(`House total ${TOTAL_HOUSES}, field total ${TOTAL_FIELDS}`);
  });

  it("lists every theme with its star threshold", () => {
    for (const theme of THEMES) expect(CONTENT).toContain(theme.name);
  });
});

describe("store-listing.md", () => {
  it("repeats the campaign size, regions and theme count", () => {
    expect(STORE).toContain(`${MAPS.length} hand-built maps across four regions`);
    expect(STORE).toContain("Seven map themes");
    expect(STORE).toContain(`${MAPS.length} maps, daily dispatches, seven themes`);
    expect(THEMES).toHaveLength(7);
  });

  it("keeps the no-data, no-ads, no-purchase promises", () => {
    expect(STORE).toContain("No data collected");
    expect(STORE).toContain("No ads, no accounts, no purchases, nothing collected");
    expect(STORE).toContain("| Contains ads | No |");
    expect(STORE).toContain("| In-app purchases | No |");
  });
});

describe("assets-index.md", () => {
  it("has one row per art slot", () => {
    const rows = SLOTS.map((slot) => ASSETS.includes(`| \`${slot.id}\` |`));
    expect(rows.every(Boolean)).toBe(true);
    expect(ASSETS).toContain("## Art slots (20)");
  });

  it("states the audio counts and lists the unfinished art", () => {
    expect(ASSETS).toContain(`${SOUNDS.length} sound slots`);
    expect(ASSETS).toContain(`${MUSIC.length} music loops`);
    expect(ASSETS).toContain("`key-art`");
    expect(ASSETS).toContain("rejected");
  });
});

describe("decisions-log.md", () => {
  it("records the campaign totals and the final release entry", () => {
    expect(DECISIONS).toContain(`${TOTAL_HOUSES} houses, ${TOTAL_FIELDS} fields`);
    expect(DECISIONS).toContain("Task 08 release readiness");
  });
});
