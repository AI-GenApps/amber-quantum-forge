import { describe, expect, it } from "vitest";
import {
  appendHistory,
  bestStamps,
  defaultProfile,
  fastestTimeMs,
  getCase,
  HISTORY_LIMIT,
  hintsPhrase,
  recordTotals,
  shareText,
} from "../src";
import { docLines } from "./fixtures/doc";
import { withCases, withTotal } from "./fixtures/profiles";

describe("share text", () => {
  const shareLines = docLines("product.md").filter((line) => line.includes("Lost Parcel Desk"));

  it("campaign: matches the product.md examples", () => {
    const title = getCase("04")?.title ?? "";
    expect(title).toBe("Small Print and Smaller Batteries");
    const none = shareText("campaign", { caseId: "04", title, stamps: 3, hints: 0 });
    expect(none).toBe(
      'Lost Parcel Desk - Case 04 "Small Print and Smaller Batteries": 3/3 stamps, no hints.',
    );
    expect(shareLines.join("\n")).toContain(none);
    const one = shareText("campaign", { caseId: "04", title, stamps: 2, hints: 1 });
    expect(one).toBe(
      'Lost Parcel Desk - Case 04 "Small Print and Smaller Batteries": 2/3 stamps, 1 hint.',
    );
    expect(shareLines.join("\n")).toContain("2/3 stamps, 1 hint.");
    expect(shareText("campaign", { caseId: "07", title: "X", stamps: 1, hints: 2 })).toBe(
      'Lost Parcel Desk - Case 07 "X": 1/3 stamps, 2 hints.',
    );
  });

  it("daily: matches the product.md example", () => {
    const text = shareText("daily", { dateKey: "2026-10-23", stamps: 2, streak: 5 });
    expect(text).toBe("Lost Parcel Desk Daily 2026-10-23: 2/3 stamps. Streak 5.");
    expect(shareLines.join("\n")).toContain(text);
  });

  it("pluralises hints", () => {
    expect([0, 1, 2].map(hintsPhrase)).toEqual(["no hints", "1 hint", "2 hints"]);
  });
});

describe("records", () => {
  it("caps the history at 50, newest last", () => {
    let history: ReturnType<typeof appendHistory> = [];
    for (let index = 0; index < 60; index++) {
      history = appendHistory(history, {
        kind: "daily",
        id: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
        stamps: 1,
        hints: index,
      });
    }
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]?.hints).toBe(10);
    expect(history.at(-1)?.hints).toBe(59);
  });

  it("looks up best stamps and fastest time", () => {
    const profile = withCases({ "01": 3, "02": 1 });
    profile.cases["01"] = { stamps: 3, bestTimeMs: 61_000, hintsOnBest: 0, closedCount: 2 };
    expect(bestStamps(profile, "01")).toBe(3);
    expect(bestStamps(profile, "05")).toBe(0);
    expect(fastestTimeMs(profile, "01")).toBe(61_000);
    expect(fastestTimeMs(profile, "02")).toBeNull();
    expect(fastestTimeMs(profile, "05")).toBeNull();
  });

  it("totals the profile", () => {
    expect(recordTotals(defaultProfile())).toEqual({
      stamps: 0,
      casesClosed: 0,
      perfectCases: 0,
      hintsUsed: 0,
      dailiesCleared: 0,
      bestStreak: 0,
      achievements: 0,
    });
    const totals = recordTotals(withTotal(10));
    expect(totals.stamps).toBe(10);
    expect(totals.casesClosed).toBe(4);
    expect(totals.perfectCases).toBe(3);
  });
});
