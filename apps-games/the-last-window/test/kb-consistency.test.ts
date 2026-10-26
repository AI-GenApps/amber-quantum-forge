// @vitest-environment node
import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ART_SLOTS,
  BASE_BOOK_SLOTS,
  BASE_PASTRY_SLOTS,
  BOOKS,
  CAMPAIGN_DAYS,
  DAYS,
  DECOR,
  DECOR_TOTAL_PRICE,
  DIARY,
  DRINKS,
  ENDING_TITLES,
  FINAL_SCENE_GIFT,
  FINALE_DAY,
  FINALE_LINES,
  FP_CAP,
  FRIENDSHIP_THRESHOLDS,
  GRADE_BONUS_ONE,
  GRADE_BONUS_THREE,
  GRADE_BONUS_TWO,
  LAMP_BONUS,
  LATE_CUSTOMERS_BASE,
  LATE_CUSTOMERS_MAX,
  LATE_PATIENCE_FLOOR_SECONDS,
  LATE_PATIENCE_START_SECONDS,
  LATE_REGULARS,
  MOODS,
  PASTRIES,
  PORTIONS_PER_KIND,
  REGULARS,
  SCENE_GIFT,
  SCENES,
  SEATS,
  SHIFT_TICKS,
  START_COINS,
  STREAK_BONUS_CAP_DAYS,
  STREAK_BONUS_PER_DAY,
  TICK_MS,
  TIP_DELIGHTED_PCT,
  TIP_SATISFIED_PCT,
  TUTORIAL_ORDERS,
  TUTORIAL_STEPS,
  WALKIN_LOOKS,
} from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import { AUDIO_SLOTS } from "../src/audio/slots";
import { HOWTO_PAGES } from "../src/data/howto";
import { ROUTE_NAMES } from "../src/nav";
import {
  APP_ROOT,
  bytesOf,
  group,
  KB_DIR,
  KB_FILES,
  type KbFile,
  readKb,
  tableRows,
  totalBytes,
} from "./kbDocs";

const sumOf = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const seconds = (ticks: number): number => (ticks * TICK_MS) / 1000;

function expectIn(file: KbFile, ...needles: string[]): void {
  const text = readKb(file);
  for (const needle of needles) expect(text, `${file} should contain: ${needle}`).toContain(needle);
}

const regularVisits = sumOf(DAYS.map((day) => day.regularsDue.length));
const customers = sumOf(DAYS.map((day) => day.customers));
const choiceScenes = SCENES.filter((scene) => scene.choice !== undefined);
const endingTitles = Object.values(ENDING_TITLES).flatMap((pair) => [pair.a, pair.b]);

describe("knowledge base files", () => {
  it("has the eight files and no stray files", () => {
    expect(readdirSync(KB_DIR).sort()).toEqual([...KB_FILES].sort());
  });

  it("the README says v1 is complete and pending owner QA", () => {
    expectIn("README.md", "Status: v1 complete, pending owner QA");
  });

  it("every open question has an owner and a default", () => {
    const rows = tableRows(readKb("open-questions.md"), "| # |");
    expect(rows.length).toBeGreaterThanOrEqual(13);
    for (const row of rows) {
      expect(row, row[0]).toHaveLength(4);
      expect(row[2]?.length, `${row[0]} default`).toBeGreaterThan(10);
      expect(row[3]?.length, `${row[0]} owner`).toBeGreaterThan(2);
    }
  });
});

describe("campaign and content counts", () => {
  it("14 days, 130 customers (48 regular visits, 82 walk-ins)", () => {
    expect([DAYS.length, CAMPAIGN_DAYS, FINALE_DAY, DIARY.length]).toEqual([14, 14, 14, 14]);
    expect(customers).toBe(130);
    expect(regularVisits).toBe(48);
    expect(customers - regularVisits).toBe(82);
    expectIn("content-plan.md", "130 (48 regular visits, 82 walk-ins)", "| Campaign days | 14 ");
    expectIn("README.md", "14 days", "130 customers", "Shop Diary (14)");
    expectIn("store-listing.md", "14 days");
  });

  it("8 regulars, 40 scenes, 12 choices, 16 endings, 24 finale lines", () => {
    expect(REGULARS).toHaveLength(8);
    expect(SCENES).toHaveLength(40);
    expect(choiceScenes).toHaveLength(12);
    expect(sumOf(REGULARS.map((regular) => regular.choiceCount))).toBe(12);
    expect(new Set(endingTitles).size).toBe(16);
    expect(FINALE_LINES).toHaveLength(24);
    expectIn(
      "content-plan.md",
      "| Scenes | 40 (8 regulars x 5) |",
      "| Choices | 12 ",
      "| Endings | 16 ",
      "| Finale lines | 24 ",
      "| Regular customers (named) | 8 |",
    );
    expectIn("README.md", "8 regulars x 5 scenes = 40 scenes, 12 choices, 16 endings");
    expectIn("store-listing.md", "40 scenes", "eight regulars");
  });

  it("6 drinks, 5 pastries, 5 books, 5 moods, 8 decor, 6 walk-in looks, 3 weather", () => {
    expect([DRINKS.length, PASTRIES.length, BOOKS.length, MOODS.length, DECOR.length]).toEqual([
      6, 5, 5, 5, 8,
    ]);
    expect(WALKIN_LOOKS).toBe(6);
    expect(new Set(DAYS.map((day) => day.weather))).toEqual(
      new Set(["morning", "evening", "rain"]),
    );
    expectIn("content-plan.md", "| Drinks / pastries / books | 6 / 5 / 5 |", "| Moods | 5 |");
    expectIn("content-plan.md", "| Decor items | 8 |", "| Walk-in types (code-drawn) | 6 |");
    expectIn(
      "README.md",
      "6 drinks, 5 pastries, 5 books, 5 moods, 8 decor items, 3 weather variants",
    );
  });

  it("the shift lengths are 180, 210 and 240 s on a 100 ms tick, 3 seats", () => {
    expect([SHIFT_TICKS.short, SHIFT_TICKS.medium, SHIFT_TICKS.long].map(seconds)).toEqual([
      180, 210, 240,
    ]);
    expect(TICK_MS).toBe(100);
    expect(SEATS).toBe(3);
    DAYS.forEach((day) => {
      const expected =
        day.day <= 4 ? SHIFT_TICKS.short : day.day <= 9 ? SHIFT_TICKS.medium : SHIFT_TICKS.long;
      expect(day.shiftTicks, `day ${day.day}`).toBe(expected);
    });
    expectIn(
      "README.md",
      "180 s (Days 1 to 4), 210 s (5 to 9), 240 s (10 to 14); 10 ticks per second",
    );
    expectIn("README.md", "3 counter seats");
    expectIn("product.md", "180 s (1800 ticks)", "210 s", "240 s", "`TICK_MS = 100`", "3 seats");
  });
});

describe("economy numbers", () => {
  it("starts with 30 coins; scene gifts total 280; decor totals 1,200", () => {
    expect(START_COINS).toBe(30);
    expect([SCENE_GIFT, FINAL_SCENE_GIFT]).toEqual([5, 15]);
    expect(sumOf(SCENES.map((scene) => scene.gift))).toBe(280);
    expect(sumOf(DECOR.map((item) => item.price))).toBe(1200);
    expect(DECOR_TOTAL_PRICE).toBe(1200);
    expectIn("economy.md", "| Coins | currency | 30 |", "`8 x (4 x 5 + 15) = 280`", "Total 1,200.");
    expectIn("README.md", "coins (start 30)", "8 items, 1,200 total");
    expectIn("product.md", "5 coins, scene 5 gives 15");
    expectIn("content-plan.md", "1,200");
  });

  it("the content-plan decor table equals the decor data", () => {
    const rows = tableRows(readKb("content-plan.md"), "## Decor");
    expect(rows).toHaveLength(DECOR.length);
    rows.forEach((row, index) => {
      const item = DECOR[index];
      expect(row[0]).toBe(item?.id);
      expect(row[1]).toBe(item?.name);
      expect(Number(row[2])).toBe(item?.price);
      expect(row[3]).toBe(`Day ${item?.unlockDay}`);
    });
  });

  it("friendship thresholds are 1, 2, 4, 6, 8 with a cap of 8", () => {
    expect([...FRIENDSHIP_THRESHOLDS]).toEqual([1, 2, 4, 6, 8]);
    expect(FP_CAP).toBe(8);
    expectIn("README.md", "FP cap 8, thresholds 1, 2, 4, 6, 8");
    expectIn("economy.md", "Thresholds `[1, 2, 4, 6, 8]`");
    expectIn("product.md", "`FP_CAP = 8`", "`[1, 2, 4, 6, 8]`");
  });

  it("price and stock-cost tables match the data", () => {
    expect(DRINKS.map((drink) => drink.price)).toEqual([4, 5, 4, 5, 5, 6]);
    expect(PASTRIES.map((pastry) => pastry.price)).toEqual([3, 4, 5, 4, 5]);
    expect(BOOKS.map((book) => book.price)).toEqual([6, 6, 7, 7, 7]);
    expect(PASTRIES.map((pastry) => pastry.stockCost)).toEqual([1, 1, 2, 1, 2]);
    expect(PORTIONS_PER_KIND).toBe(5);
    const costs = PASTRIES.map((pastry) => pastry.stockCost).sort((a, b) => b - a);
    const bill = (kinds: number): number => PORTIONS_PER_KIND * sumOf(costs.slice(0, kinds));
    expect([bill(4), bill(3)]).toEqual([30, 25]);
    expectIn(
      "economy.md",
      "drinks 4, 5, 4, 5, 5, 6 (sum 29)",
      "pastries 3, 4, 5, 4, 5 (sum 21)",
      "books 6, 6, 7, 7, 7",
      "(sum 33)",
      "Salted Butter Roll 1, Cinnamon Knot 1, Pear Tart 2, Lemon Cream Bun 1, Ginger Loaf 2",
      "`5 x (2 + 2 + 1 + 1) = 30`",
      "`5 x (2 + 2 + 1) = 25`",
    );
  });

  it("shelf slots are 3 and 3, each raised by one decor item", () => {
    expect([BASE_PASTRY_SLOTS, BASE_BOOK_SLOTS]).toEqual([3, 3]);
    const kinds = DECOR.map((item) => item.effect.kind);
    expect(kinds).toContain("pastrySlot");
    expect(kinds).toContain("bookSlot");
    expectIn(
      "product.md",
      "3 kinds (4 with Glass Cake Stand)",
      "3 books (4 with Rolling Library Ladder)",
    );
    expectIn("economy.md", "+1 pastry shelf kind (3 to 4)", "+1 book shelf slot (3 to 4)");
  });

  it("tips are 40 and 15 percent (50 and 25 with the Gramophone); closing bonuses 5, 10, 20", () => {
    expect([TIP_DELIGHTED_PCT, TIP_SATISFIED_PCT]).toEqual([40, 15]);
    const gramophone = DECOR.find((item) => item.effect.kind === "tipPoints");
    expect(gramophone?.effect).toEqual({ kind: "tipPoints", points: 10 });
    expect([GRADE_BONUS_ONE, GRADE_BONUS_TWO, GRADE_BONUS_THREE]).toEqual([5, 10, 20]);
    expectIn(
      "economy.md",
      "40 percent (delighted) or 15 percent (satisfied)",
      "| Closing bonus | 5 / 10 / 20",
    );
    expectIn("economy.md", "(50 / 25)");
    expectIn(
      "product.md",
      "delighted 40 percent, satisfied",
      "15 percent",
      "+10 percentage points",
    );
    expectIn("product.md", "| 3 |", "| 20 |", "| 10 |", "| 5 |");
  });

  it("Late Shift caps: 12 to 14 customers, patience 40 down to 34, 3 regulars, Lamp Bonus 15, streak 2 x min(streak, 7)", () => {
    expect([LATE_CUSTOMERS_BASE, LATE_CUSTOMERS_MAX, LATE_REGULARS]).toEqual([12, 14, 3]);
    expect([LATE_PATIENCE_START_SECONDS, LATE_PATIENCE_FLOOR_SECONDS]).toEqual([40, 34]);
    expect([LAMP_BONUS, STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP_DAYS]).toEqual([15, 2, 7]);
    expectIn(
      "product.md",
      "`12 + floor(n / 5)` capped at 14",
      "`40 - floor(n / 5)` seconds with a floor of 34",
    );
    expectIn("product.md", "3 distinct regulars");
    expectIn("economy.md", "| Lamp Bonus | 15 |", "2 x min(streak, 7)");
  });
});

describe("screens, onboarding and assets", () => {
  it("the 14 routes equal the product.md screens table", () => {
    const rows = tableRows(readKb("product.md"), "| Route |");
    expect(rows.map((row) => row[0])).toEqual([...ROUTE_NAMES]);
    expect(ROUTE_NAMES).toHaveLength(14);
  });

  it("5 sheets, a 7-step guided shift with 6 scripted customers, 6 how-to pages", () => {
    const sheets = readdirSync(join(APP_ROOT, "src/sheets")).filter(
      (name) => name !== "Confirm.tsx",
    );
    expect(sheets).toHaveLength(5);
    expect(TUTORIAL_STEPS).toHaveLength(7);
    expect(TUTORIAL_ORDERS).toHaveLength(6);
    expect(HOWTO_PAGES).toHaveLength(6);
    expectIn(
      "product.md",
      "Sheets (5)",
      "six scripted customers",
      "How to play has 6 pages",
      "| `howto` | How to play | 6 pages |",
    );
    expect(readKb("product.md")).toContain("(7) read the patience");
  });

  it("54 art slots (B1 4, B2 9, B3 16, B4 25) and 52 runtime files", () => {
    const perBatch = ["B1", "B2", "B3", "B4"].map(
      (batch) => ART_SLOTS.filter((slot) => slot.batch === batch).length,
    );
    expect(ART_SLOTS).toHaveLength(54);
    expect(perBatch).toEqual([4, 9, 16, 25]);
    expect(ART_SLOTS.filter((slot) => slot.runtime !== null)).toHaveLength(52);
    expectIn("README.md", "54 designer slots (B1 4, B2 9, B3 16, B4 25)");
    expectIn("assets-index.md", "B1 4 + B2 9 + B3 16 + B4 25 = 54", "## Art slots (54)");
    const runtime = totalBytes(join(APP_ROOT, "public/art"), ".webp");
    expectIn("assets-index.md", `Runtime total: ${group(runtime)} bytes (52 files)`);
  });

  it("33 sounds and 3 music loops, 36 files, sizes equal the audio folder", () => {
    const music = AUDIO_SLOTS.filter((slot) => slot.kind === "music");
    expect(music).toHaveLength(3);
    expect(AUDIO_SLOTS.length - music.length).toBe(33);
    const total = totalBytes(join(APP_ROOT, "public/audio"), ".ogg");
    expectIn(
      "assets-index.md",
      `Total audio: ${group(total)} bytes (36 files, ${(total / 1048576).toFixed(2)} MB; budget 2 MB)`,
    );
    expectIn(
      "assets-index.md",
      "Count: 33 sounds (including the `rain-loop` ambience) and 3 music loops = 36 slots",
    );
    expectIn("README.md", `33 sounds and 3 music loops, ${(total / 1048576).toFixed(2)} MB`);
  });

  it("the font table lists the real woff2 sizes and the 300 KB budget", () => {
    const young = bytesOf(join(APP_ROOT, "public/fonts/young-serif/YoungSerif-Regular.woff2"));
    const nunito = bytesOf(join(APP_ROOT, "public/fonts/nunito-sans/NunitoSans-Variable.woff2"));
    expectIn(
      "assets-index.md",
      `| ${group(young)} |`,
      `| ${group(nunito)} |`,
      `(${group(young + nunito)} bytes`,
    );
    expect(young + nunito).toBeLessThanOrEqual(300 * 1024);
  });

  it("the measured budget numbers in the README and assets index equal the files", () => {
    const art = totalBytes(join(APP_ROOT, "public/art"), ".webp");
    const audio = totalBytes(join(APP_ROOT, "public/audio"), ".ogg");
    const fonts =
      bytesOf(join(APP_ROOT, "public/fonts/young-serif/YoungSerif-Regular.woff2")) +
      bytesOf(join(APP_ROOT, "public/fonts/nunito-sans/NunitoSans-Variable.woff2"));
    const measured = [
      `art ${(art / 1048576).toFixed(2)} MiB (52 files)`,
      `fonts ${(fonts / 1024).toFixed(1)} KiB (2 files)`,
      `audio ${(audio / 1048576).toFixed(2)} MiB (36 files)`,
    ];
    expectIn("README.md", ...measured);
    expectIn(
      "assets-index.md",
      `${(art / 1048576).toFixed(2)} MiB (${group(art)} bytes, 52 files)`,
      `${(fonts / 1024).toFixed(1)} KiB (2 woff2 files)`,
      `${(audio / 1048576).toFixed(2)} MiB (36 ogg files)`,
    );
  });

  it("the budget row names every limit", () => {
    expectIn(
      "README.md",
      "JS bundle <= 300 KB gzip excluding art; art <= 8 MB; fonts <= 300 KB; audio <= 2 MB",
    );
    expectIn(
      "assets-index.md",
      "at most 300 KB",
      "at most 8 MB",
      "at most 2 MB",
      "400 KB",
      "120 KB",
      "60 KB",
    );
  });
});

describe("store listing draft", () => {
  it("every length cell equals the text length and stays inside the limit", () => {
    const rows = tableRows(readKb("store-listing.md"), "| Field |");
    expect(rows).toHaveLength(5);
    for (const [field, draft, length, limit] of rows) {
      expect(draft?.length, field).toBe(Number(length));
      const max = Number.parseInt(limit ?? "", 10);
      expect(Number(length), field).toBeLessThanOrEqual(max);
    }
  });

  it("states no data collected, no ads, no purchases and no network", () => {
    expectIn(
      "store-listing.md",
      "No data collected. No data shared.",
      "| Contains ads | No |",
      "| In-app purchases | No |",
      "The app makes no network requests.",
    );
  });
});
