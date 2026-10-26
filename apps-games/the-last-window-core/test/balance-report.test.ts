import { describe, expect, it } from "vitest";
import { type BalancePolicy, formatRun, playBalance } from "./helpers/balance";
import { CASUAL, PERFECT } from "./helpers/bot";
import { readDoc, tableAfter } from "./helpers/doc";

const CASUAL_PLAYER: BalancePolicy = { name: "casual", bot: CASUAL, stock: "suggested" };
const STRONG_PLAYER: BalancePolicy = { name: "strong", bot: PERFECT, stock: "foresight" };

describe("balance report over the real 14 days", () => {
  const casualPlain = playBalance(CASUAL_PLAYER, false);
  const strongPlain = playBalance(STRONG_PLAYER, false);
  const casualBuying = playBalance(CASUAL_PLAYER, true);
  const strongBuying = playBalance(STRONG_PLAYER, true);

  it("prints the tables to stdout", () => {
    const runs = [casualPlain, strongPlain, casualBuying, strongBuying];
    const summary = runs.map(
      (run) =>
        `${run.policy.padEnd(7)} ${run.buying ? "buying" : "plain "} net=${run.net} income=${run.income} stock=${run.stockSpent} scenes=${run.scenesDone}/40 decorAffordable=${run.decorAffordable} owned=${run.profile.owned.length} finalCoins=${run.profile.coins}`,
    );
    process.stdout.write(`\nBALANCE\n${summary.join("\n")}\n\n`);
    for (const run of runs) process.stdout.write(`${formatRun(run)}\n\n`);
    expect(runs).toHaveLength(4);
  });

  it("never ends with negative coins on any day", () => {
    for (const run of [casualPlain, strongPlain, casualBuying, strongBuying]) {
      for (const line of run.lines)
        expect(line.coinsAfter, `${run.policy} day ${line.day}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("the strong player earns at least as many coins as the casual player", () => {
    expect(strongPlain.net).toBeGreaterThanOrEqual(casualPlain.net);
    expect(strongBuying.profile.owned.length).toBeGreaterThanOrEqual(
      casualBuying.profile.owned.length,
    );
  });

  it("the strong player sees at least as many scenes as the casual player", () => {
    expect(strongPlain.scenesDone).toBeGreaterThanOrEqual(casualPlain.scenesDone);
    expect(strongBuying.scenesDone).toBeGreaterThan(0);
  });

  it("keeps economy.md in step with the measured nets", () => {
    const rows = tableAfter(readDoc("economy.md"), "## Balance targets");
    const range = (cell: string): [number, number] => {
      const match = /([\d,]+) to ([\d,]+)/.exec(cell);
      if (!match) throw new Error(`no range in ${cell}`);
      return [
        Number((match[1] ?? "").replace(/,/g, "")),
        Number((match[2] ?? "").replace(/,/g, "")),
      ];
    };
    const [casualLow, casualHigh] = range(rows[0]?.[2] ?? "");
    const [strongLow, strongHigh] = range(rows[1]?.[2] ?? "");
    expect(casualPlain.net).toBeGreaterThanOrEqual(casualLow);
    expect(casualPlain.net).toBeLessThanOrEqual(casualHigh);
    expect(strongPlain.net).toBeGreaterThanOrEqual(strongLow);
    expect(strongPlain.net).toBeLessThanOrEqual(strongHigh);
    expect(rows[0]?.[4]).toBe(`${casualPlain.scenesDone} of 40`);
    expect(rows[1]?.[4]).toBe(`${strongPlain.scenesDone} of 40`);
  });
});
