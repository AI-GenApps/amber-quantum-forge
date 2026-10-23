import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAR_UNLOCKS } from "../../src/progress/stars";
import { MILESTONES, TOKEN_CONFIG } from "../../src/progress/tokens";

const ECONOMY = readFileSync(
  join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    ".agents",
    "games",
    "lantern-loops",
    "economy.md",
  ),
  "utf8",
);

function row(label: string): string[] {
  const line = ECONOMY.split("\n").find((l) => l.startsWith(`| ${label} |`));
  if (!line) throw new Error(`economy.md has no table row "${label}"`);
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function num(label: string, column: number): number {
  const cell = row(label)[column] ?? "";
  const match = /\d+/.exec(cell);
  if (!match) throw new Error(`no number in "${cell}" for ${label}`);
  return Number(match[0]);
}

describe("economy.md and the constants agree", () => {
  it("currencies table: start balance and cap", () => {
    expect(num("Hint tokens", 2)).toBe(TOKEN_CONFIG.start);
    expect(num("Hint tokens", 3)).toBe(TOKEN_CONFIG.cap);
  });

  it("sources table: starting balance, daily, archive and chapter rewards", () => {
    expect(num("Starting balance", 1)).toBe(TOKEN_CONFIG.start);
    expect(num("Daily solved", 1)).toBe(TOKEN_CONFIG.daily);
    expect(num("Daily solved with 0 hints", 1)).toBe(TOKEN_CONFIG.dailyNoHintBonus);
    expect(num("Archive solve", 1)).toBe(TOKEN_CONFIG.archive);
    expect(num("Chapter cleared", 1)).toBe(TOKEN_CONFIG.chapterCleared);
  });

  it("sink table: hint cost", () => {
    expect(num("Hint", 1)).toBe(TOKEN_CONFIG.hintCost);
  });

  it("milestone row matches the milestone table", () => {
    const rewards = [...(row("Streak milestone")[1] ?? "").matchAll(/\d+/g)].map((m) =>
      Number(m[0]),
    );
    expect(rewards).toEqual(Object.values(MILESTONES));
    const rule = row("Streak milestone")[2] ?? "";
    const days = [...(rule.match(/streak ([\d / ]+) days/)?.[1] ?? "").matchAll(/\d+/g)].map((m) =>
      Number(m[0]),
    );
    expect(days).toEqual(Object.keys(MILESTONES).map(Number));
  });

  it("chapter unlock table", () => {
    expect(row("Harbor")[1]).toBe("open");
    expect(num("Garden", 1)).toBe(STAR_UNLOCKS.garden);
    expect(num("Bridge", 1)).toBe(STAR_UNLOCKS.bridge);
    expect(num("Sky", 1)).toBe(STAR_UNLOCKS.sky);
    expect(STAR_UNLOCKS.harbor).toBe(0);
  });
});
