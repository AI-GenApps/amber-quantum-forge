import { describe, expect, it } from "vitest";
import {
  applyCampaignResult,
  CHALLENGES,
  CHAPTERS,
  challengeUnlocked,
  chapterUnlocked,
  closetFor,
  defaultProfile,
  sanitizeProfile,
  starsToNextUnlock,
  TOTAL_STARS,
  totalStars,
  unlockedPieces,
  unlockedThemes,
} from "../src/index";
import { profileWithStars, profileWithTotal, score } from "./helpers/profiles";

const BOUNDARIES: readonly (readonly [number, number, number])[] = [
  [11, 12, 2],
  [26, 27, 3],
  [44, 45, 4],
  [65, 66, 5],
];

describe("chapter thresholds", () => {
  it("are 0, 0, 12, 27, 45 and 66 stars", () => {
    expect(CHAPTERS.map((chapter) => chapter.unlockStars)).toEqual([0, 0, 12, 27, 45, 66]);
  });

  it("the first two chapters are open at the start", () => {
    const profile = defaultProfile();
    expect(chapterUnlocked(profile, 0)).toBe(true);
    expect(chapterUnlocked(profile, 1)).toBe(true);
    expect(chapterUnlocked(profile, 2)).toBe(false);
  });

  for (const [below, at, chapter] of BOUNDARIES) {
    it(`chapter ${chapter + 1} opens at ${at} stars, not at ${below}`, () => {
      expect(chapterUnlocked(profileWithTotal(below), chapter)).toBe(false);
      expect(chapterUnlocked(profileWithTotal(at), chapter)).toBe(true);
    });

    it(`crossing ${at} stars emits the unlock events once`, () => {
      const start = profileWithTotal(below);
      const target = CHALLENGES.find((def) => (start.stars[def.id] ?? 0) < 3);
      if (target === undefined) throw new Error("no open challenge");
      const raised = applyCampaignResult(
        start,
        target.id,
        score(((start.stars[target.id] ?? 0) + 1) as 1 | 2 | 3),
      );
      expect(totalStars(raised.profile)).toBe(at);
      expect(raised.events).toContainEqual({ type: "chapter-unlocked", chapterIndex: chapter });
      expect(raised.events).toContainEqual({
        type: "pieces-unlocked",
        chapterIndex: chapter,
        count: 8,
        closetSize: 8 * (chapter + 1),
      });
      const again = applyCampaignResult(raised.profile, target.id, score(1));
      expect(again.events.some((event) => event.type === "chapter-unlocked")).toBe(false);
    });
  }
});

describe("closet from the profile", () => {
  it("has 16, 24, 32, 40 and 48 pieces at the unlock totals", () => {
    const sizes = [0, 11, 12, 26, 27, 44, 45, 65, 66, 120].map(
      (total) => unlockedPieces(profileWithTotal(total)).length,
    );
    expect(sizes).toEqual([16, 16, 24, 24, 32, 32, 40, 40, 48, 48]);
  });

  it("lists the themes in chapter order", () => {
    expect(unlockedThemes(defaultProfile())).toEqual(["riviera", "rainy-city"]);
    expect(unlockedThemes(profileWithTotal(66)).at(-1)).toBe("vintage");
  });

  it("matches the content closet for each chapter level", () => {
    const totals = [0, 12, 27, 45, 66];
    totals.forEach((total, index) => {
      const ids = unlockedPieces(profileWithTotal(total)).map((piece) => piece.id);
      expect(ids).toEqual(closetFor(index + 1).map((piece) => piece.id));
    });
  });
});

describe("challenge unlocks", () => {
  it("opens the first challenge of an unlocked chapter and then one at a time", () => {
    const start = defaultProfile();
    expect(challengeUnlocked(start, "riv-01")).toBe(true);
    expect(challengeUnlocked(start, "riv-02")).toBe(false);
    expect(challengeUnlocked(start, "rai-01")).toBe(true);
    expect(challengeUnlocked(start, "rai-02")).toBe(false);
    const cleared = profileWithStars({ "riv-01": 1 });
    expect(challengeUnlocked(cleared, "riv-02")).toBe(true);
    expect(challengeUnlocked(cleared, "riv-03")).toBe(false);
  });

  it("keeps a locked chapter closed even when the previous challenge is cleared", () => {
    const profile = profileWithStars({ "rai-07": 3 });
    expect(challengeUnlocked(profile, "gal-01")).toBe(false);
    expect(challengeUnlocked(profileWithTotal(12), "gal-01")).toBe(true);
  });

  it("returns false for unknown ids", () => {
    expect(challengeUnlocked(defaultProfile(), "nope")).toBe(false);
  });
});

describe("star totals", () => {
  it("never exceed 120", () => {
    const stars = Object.fromEntries(CHALLENGES.map((def) => [def.id, 9]));
    const clean = sanitizeProfile({ stars: { ...stars, "fake-01": 3, "fake-02": 3 } });
    expect(clean).not.toBeNull();
    expect(totalStars(clean ?? defaultProfile())).toBe(120);
    expect(TOTAL_STARS).toBe(120);
  });

  it("starsToNextUnlock counts down and ends at null", () => {
    expect(starsToNextUnlock(defaultProfile())).toEqual({
      chapterIndex: 2,
      threshold: 12,
      needed: 12,
    });
    expect(starsToNextUnlock(profileWithTotal(11))).toEqual({
      chapterIndex: 2,
      threshold: 12,
      needed: 1,
    });
    expect(starsToNextUnlock(profileWithTotal(12))?.chapterIndex).toBe(3);
    expect(starsToNextUnlock(profileWithTotal(65))).toEqual({
      chapterIndex: 5,
      threshold: 66,
      needed: 1,
    });
    expect(starsToNextUnlock(profileWithTotal(66))).toBeNull();
  });
});
