import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DAILY_COINS,
  FIRST_CLEAR_COINS,
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_FREEZES,
  REGION_BONUS_COINS,
  REGIONS,
  STAR_COINS,
  START_COINS,
  STREAK_BONUS_CAP,
  STREAK_BONUS_PER_DAY,
  THEMES,
  TOTAL_STARS,
} from "../src";

const DOC = readFileSync(
  join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    ".agents",
    "games",
    "floodplain-dispatch",
    "economy.md",
  ),
  "utf8",
);

function row(label: string, exact = false): string {
  const line = DOC.split("\n").find((entry) => {
    if (!entry.startsWith("|")) return false;
    const first = entry.split("|")[1]?.trim() ?? "";
    return exact ? first === label : first.startsWith(label);
  });
  if (!line) throw new Error(`economy.md has no row containing "${label}"`);
  return line;
}

function numbers(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

describe("economy.md and the constants agree", () => {
  it("coin sources", () => {
    expect(numbers(row("Starting grant"))).toContain(START_COINS);
    expect(numbers(row("First clear of a campaign map"))).toContain(FIRST_CLEAR_COINS);
    expect(numbers(row("Each additional best star"))).toContain(STAR_COINS);
    expect(numbers(row("Region completion bonus"))).toContain(REGION_BONUS_COINS);
    const daily = numbers(row("Daily clear, best tier"));
    expect(daily).toEqual(expect.arrayContaining([DAILY_COINS[1], DAILY_COINS[2], DAILY_COINS[3]]));
    const bonus = row("Daily streak bonus");
    expect(bonus).toContain(`${STREAK_BONUS_PER_DAY} x min(streak, ${STREAK_BONUS_CAP})`);
  });

  it("coin sinks", () => {
    expect(numbers(row("Hint (campaign map)"))).toContain(HINT_PRICE.campaign);
    expect(numbers(row("Hint (daily map)"))).toContain(HINT_PRICE.daily);
    expect(numbers(row("Streak freeze", true))).toContain(FREEZE_PRICE);
    expect(row("Streak freezes", true)).toContain(`0 to ${MAX_FREEZES}`);
  });

  it("the campaign total of 1250", () => {
    const total =
      START_COINS + 40 * FIRST_CLEAR_COINS + TOTAL_STARS * STAR_COINS + 4 * REGION_BONUS_COINS;
    expect(total).toBe(1250);
    expect(DOC).toContain(
      `${START_COINS} + ${40 * FIRST_CLEAR_COINS} + ${TOTAL_STARS * STAR_COINS} + ${4 * REGION_BONUS_COINS} = ${total}`,
    );
  });

  it("unlock thresholds", () => {
    expect(numbers(row("Region: Delta"))).toContain(REGIONS[1]?.unlockStars);
    expect(numbers(row("Region: Highland"))).toContain(REGIONS[2]?.unlockStars);
    expect(numbers(row("Region: Estuary"))).toContain(REGIONS[3]?.unlockStars);
    expect(numbers(row("Themes 2 to 7"))).toEqual([
      2,
      7,
      ...THEMES.slice(1).map((theme) => theme.starsNeeded),
    ]);
  });
});
