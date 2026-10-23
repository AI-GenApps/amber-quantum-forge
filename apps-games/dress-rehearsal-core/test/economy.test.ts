import { describe, expect, it } from "vitest";
import {
  AFFINITY_PAYMENT,
  applyCampaignResult,
  buyFrame,
  buyFreeze,
  buyHint,
  CHALLENGES,
  CHAPTER_BONUS_COINS,
  CHAPTERS,
  defaultProfile,
  FIRST_CLEAR_COINS,
  FRAME_PRICE,
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_FREEZES,
  type Profile,
  type ProgressEvent,
  STAR_COINS,
  START_COINS,
  type Stars,
  selectFrame,
} from "../src/index";
import { economyTable, numbersIn, rowStartingWith } from "./helpers/economy-doc";
import { profileWithStars, score } from "./helpers/profiles";

const SOURCES = economyTable("Source");
const SINKS = economyTable("Sink");

function coinsGained(events: readonly ProgressEvent[]): number {
  return events.reduce(
    (sum, event) =>
      sum + (event.type === "coins-gained" && event.reason !== "affinity" ? event.amount : 0),
    0,
  );
}

function affinityCoins(events: readonly ProgressEvent[]): number {
  return events.reduce(
    (sum, event) => sum + (event.type === "affinity-level" ? event.amount : 0),
    0,
  );
}

function rich(coins = 500): Profile {
  return { ...defaultProfile(), coins };
}

describe("economy.md source table", () => {
  it("starting grant is 40", () => {
    expect(numbersIn(rowStartingWith(SOURCES, "Starting grant")[1] ?? "")).toEqual([40]);
    expect(START_COINS).toBe(40);
    expect(defaultProfile().coins).toBe(40);
  });

  it("first clear pays 10", () => {
    expect(numbersIn(rowStartingWith(SOURCES, "First clear")[1] ?? "")).toEqual([10]);
    expect(FIRST_CLEAR_COINS).toBe(10);
  });

  it("each additional best star pays 5", () => {
    expect(numbersIn(rowStartingWith(SOURCES, "Each additional best star")[1] ?? "")).toEqual([5]);
    expect(STAR_COINS).toBe(5);
  });

  it("chapter completion pays 40 once per chapter", () => {
    expect(numbersIn(rowStartingWith(SOURCES, "Chapter completion bonus")[1] ?? "")).toEqual([40]);
    expect(CHAPTER_BONUS_COINS).toBe(40);
    expect(CHAPTERS).toHaveLength(6);
  });

  it("each affinity level pays 10", () => {
    expect(numbersIn(rowStartingWith(SOURCES, "Client affinity level")[1] ?? "")).toEqual([10]);
    expect(AFFINITY_PAYMENT).toBe(10);
  });

  it("the campaign totals add up to 1460", () => {
    const challenges = CHALLENGES.length;
    const parts = [
      START_COINS,
      challenges * FIRST_CLEAR_COINS,
      challenges * 3 * STAR_COINS,
      CHAPTERS.length * CHAPTER_BONUS_COINS,
      6 * 3 * AFFINITY_PAYMENT,
    ];
    expect(parts).toEqual([40, 400, 600, 240, 180]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1460);
  });
});

describe("economy.md sink table", () => {
  it("hints cost 20 on a campaign challenge and 30 on the daily", () => {
    expect(numbersIn(rowStartingWith(SINKS, "Hint (campaign")[1] ?? "")).toEqual([20]);
    expect(numbersIn(rowStartingWith(SINKS, "Hint (Daily")[1] ?? "")).toEqual([30]);
    expect(HINT_PRICE).toEqual({ campaign: 20, daily: 30 });
  });

  it("a streak freeze costs 25", () => {
    expect(numbersIn(rowStartingWith(SINKS, "Streak freeze")[1] ?? "")).toEqual([25]);
    expect(FREEZE_PRICE).toBe(25);
    expect(MAX_FREEZES).toBe(2);
  });

  it("frames cost 30, 40 and 60", () => {
    expect(numbersIn(rowStartingWith(SINKS, "Frame: Paper")[1] ?? "")).toEqual([30]);
    expect(numbersIn(rowStartingWith(SINKS, "Frame: Polaroid")[1] ?? "")).toEqual([40]);
    expect(numbersIn(rowStartingWith(SINKS, "Frame: Magazine")[1] ?? "")).toEqual([60]);
    expect(FRAME_PRICE).toEqual({ paper: 30, polaroid: 40, magazine: 60 });
  });
});

describe("applyCampaignResult", () => {
  it("pays 10 + 5 for a first clear at one star", () => {
    const { profile, events } = applyCampaignResult(defaultProfile(), "riv-01", score(1));
    expect(profile.coins).toBe(40 + 15);
    expect(coinsGained(events)).toBe(15);
    expect(affinityCoins(events)).toBe(0);
    expect(profile.stars["riv-01"]).toBe(1);
  });

  it("pays 25 for a first clear at three stars and nothing for a later replay", () => {
    const first = applyCampaignResult(defaultProfile(), "riv-01", score(3));
    expect(coinsGained(first.events)).toBe(25);
    expect(first.profile.coins).toBe(40 + 25 + 10);
    const replay = applyCampaignResult(first.profile, "riv-01", score(3));
    expect(replay.profile.coins).toBe(first.profile.coins);
    expect(coinsGained(replay.events)).toBe(0);
  });

  it("pays only the difference when stars are upgraded", () => {
    const one = applyCampaignResult(defaultProfile(), "riv-01", score(1));
    const three = applyCampaignResult(one.profile, "riv-01", score(3));
    expect(coinsGained(three.events)).toBe(10);
    const two = applyCampaignResult(one.profile, "riv-01", score(2));
    expect(coinsGained(two.events)).toBe(5);
    const twoToThree = applyCampaignResult(two.profile, "riv-01", score(3));
    expect(coinsGained(twoToThree.events)).toBe(5);
    expect(coinsGained(twoToThree.events)).toBe(5);
    expect(twoToThree.profile.coins).toBe(40 + 25 + 10);
  });

  it("never lowers stars or pays for a worse replay", () => {
    const three = applyCampaignResult(defaultProfile(), "riv-01", score(3, 90));
    const worse = applyCampaignResult(three.profile, "riv-01", score(1, 50));
    expect(worse.profile.stars["riv-01"]).toBe(3);
    expect(worse.profile.best["riv-01"]?.harmony).toBe(90);
    expect(worse.profile.coins).toBe(three.profile.coins);
  });

  it("keeps the better harmony at equal stars without paying", () => {
    const first = applyCampaignResult(defaultProfile(), "riv-01", score(3, 72, 320));
    const better = applyCampaignResult(first.profile, "riv-01", score(3, 85, 300));
    expect(better.profile.best["riv-01"]).toEqual({ stars: 3, harmony: 85, spend: 300 });
    expect(better.profile.coins).toBe(first.profile.coins);
  });

  it("a zero-star result pays nothing and counts as no clear", () => {
    const { profile, events } = applyCampaignResult(defaultProfile(), "riv-01", score(0));
    expect(profile.coins).toBe(40);
    expect(profile.stars["riv-01"]).toBeUndefined();
    expect(events).toEqual([]);
    expect(profile.stats.looksFinished).toBe(0);
    expect(profile.history).toHaveLength(1);
  });

  it("emits a star-gained event and updates the stats", () => {
    const { profile, events } = applyCampaignResult(defaultProfile(), "riv-01", score(2));
    expect(events).toContainEqual({ type: "star-gained", challengeId: "riv-01", from: 0, to: 2 });
    expect(profile.stats).toMatchObject({ looksFinished: 1, starsEarned: 2 });
  });

  it("ignores unknown challenge ids", () => {
    const start = defaultProfile();
    const result = applyCampaignResult(start, "nope-01", score(3));
    expect(result.profile).toBe(start);
    expect(result.events).toEqual([]);
  });

  it("does not mutate its input", () => {
    const start = defaultProfile();
    const snapshot = JSON.stringify(start);
    applyCampaignResult(start, "riv-01", score(3));
    expect(JSON.stringify(start)).toBe(snapshot);
  });

  it("pays the chapter bonus once, in the update that clears the last challenge", () => {
    const chapter = CHALLENGES.filter((def) => def.chapterIndex === 0);
    let profile = defaultProfile();
    const bonuses: number[] = [];
    for (const def of chapter) {
      const before = profile.coins;
      const update = applyCampaignResult(profile, def.id, score(1));
      const bonus = update.events.filter((event) => event.type === "chapter-bonus");
      bonuses.push(bonus.length);
      const expected = 15 + (bonus.length > 0 ? 40 : 0) + affinityCoins(update.events);
      expect(update.profile.coins - before).toBe(expected);
      profile = update.profile;
    }
    expect(bonuses).toEqual([0, 0, 0, 0, 0, 0, 1]);
    expect(profile.chapterBonusClaimed.riviera).toBe(true);
    const replay = applyCampaignResult(profile, "riv-07", score(3));
    expect(replay.events.some((event) => event.type === "chapter-bonus")).toBe(false);
    expect(replay.profile.coins - profile.coins).toBe(10);
  });

  it("does not pay the bonus while a chapter challenge is uncleared", () => {
    const chapter = CHALLENGES.filter((def) => def.chapterIndex === 1);
    let profile = defaultProfile();
    for (const def of chapter.slice(0, -1)) {
      profile = applyCampaignResult(profile, def.id, score(3)).profile;
    }
    expect(profile.chapterBonusClaimed["rainy-city"]).toBeUndefined();
    const last = chapter[chapter.length - 1];
    const done = applyCampaignResult(profile, last?.id ?? "", score(1));
    expect(done.profile.chapterBonusClaimed["rainy-city"]).toBe(true);
  });
});

describe("a perfect campaign replay", () => {
  it("pays exactly 1460 coins including the grant", () => {
    let profile = defaultProfile();
    const unlocked: number[] = [];
    for (const def of CHALLENGES) {
      const update = applyCampaignResult(profile, def.id, score(3));
      for (const event of update.events) {
        if (event.type === "chapter-unlocked") unlocked.push(event.chapterIndex);
      }
      profile = update.profile;
    }
    expect(profile.coins).toBe(1460);
    expect(unlocked).toEqual([2, 3, 4, 5]);
    expect(Object.values(profile.stars).reduce<number>((sum, stars) => sum + stars, 0)).toBe(120);
    expect(Object.keys(profile.chapterBonusClaimed)).toHaveLength(6);
    expect(Object.values(profile.affinityPaid)).toEqual([3, 3, 3, 3, 3, 3]);
  });

  it("pays 1460 whatever the star path (1 star first, then upgrades)", () => {
    let profile = defaultProfile();
    for (const stars of [1, 2, 3] as const) {
      for (const def of CHALLENGES) {
        profile = applyCampaignResult(profile, def.id, score(stars as Stars)).profile;
      }
    }
    expect(profile.coins).toBe(1460);
  });

  it("pays nothing more on a second perfect pass", () => {
    let profile = defaultProfile();
    for (const def of CHALLENGES) profile = applyCampaignResult(profile, def.id, score(3)).profile;
    const coins = profile.coins;
    for (const def of CHALLENGES) profile = applyCampaignResult(profile, def.id, score(3)).profile;
    expect(profile.coins).toBe(coins);
  });
});

describe("hints", () => {
  it("charge 20 or 30 and count in the stats", () => {
    const campaign = buyHint(rich(100), "campaign");
    expect(campaign.ok && campaign.profile.coins).toBe(80);
    expect(campaign.ok && campaign.profile.stats.hintsUsed).toBe(1);
    const daily = buyHint(rich(100), "daily");
    expect(daily.ok && daily.profile.coins).toBe(70);
    expect(daily.ok && daily.events).toEqual([{ type: "coins-spent", amount: 30, reason: "hint" }]);
  });

  it("are rejected with too few coins", () => {
    expect(buyHint(rich(19), "campaign")).toEqual({ ok: false, reason: "INSUFFICIENT_COINS" });
    expect(buyHint(rich(29), "daily")).toEqual({ ok: false, reason: "INSUFFICIENT_COINS" });
    expect(buyHint(rich(20), "campaign").ok).toBe(true);
    expect(buyHint(rich(30), "daily").ok).toBe(true);
  });
});

describe("streak freezes", () => {
  it("cost 25 each and stop at two", () => {
    const first = buyFreeze(rich(100));
    expect(first.ok && first.profile.coins).toBe(75);
    expect(first.ok && first.profile.streakFreezes).toBe(1);
    const second = first.ok ? buyFreeze(first.profile) : first;
    expect(second.ok && second.profile.streakFreezes).toBe(2);
    expect(second.ok && second.profile.coins).toBe(50);
    const third = second.ok ? buyFreeze(second.profile) : second;
    expect(third).toEqual({ ok: false, reason: "MAX_FREEZES" });
  });

  it("are rejected with too few coins", () => {
    expect(buyFreeze(rich(24))).toEqual({ ok: false, reason: "INSUFFICIENT_COINS" });
    expect(buyFreeze(rich(25)).ok).toBe(true);
  });
});

describe("frames", () => {
  it("are bought once at 30, 40 and 60", () => {
    let profile = rich(500);
    for (const [frame, price] of [
      ["paper", 30],
      ["polaroid", 40],
      ["magazine", 60],
    ] as const) {
      const before = profile.coins;
      const bought = buyFrame(profile, frame);
      expect(bought.ok).toBe(true);
      if (!bought.ok) return;
      expect(before - bought.profile.coins).toBe(price);
      expect(buyFrame(bought.profile, frame)).toEqual({ ok: false, reason: "ALREADY_OWNED" });
      profile = bought.profile;
    }
    expect(profile.framesOwned).toEqual(["plain", "paper", "polaroid", "magazine"]);
    expect(500 - profile.coins).toBe(130);
  });

  it("are rejected with too few coins, for plain and for unknown names", () => {
    expect(buyFrame(rich(29), "paper")).toEqual({ ok: false, reason: "INSUFFICIENT_COINS" });
    expect(buyFrame(rich(500), "plain")).toEqual({ ok: false, reason: "ALREADY_OWNED" });
    expect(buyFrame(rich(500), "gold")).toEqual({ ok: false, reason: "UNKNOWN_FRAME" });
  });

  it("can be selected only when owned; plain is always available", () => {
    const start = rich(500);
    expect(selectFrame(start, "polaroid")).toEqual({ ok: false, reason: "NOT_OWNED" });
    expect(selectFrame(start, "gold")).toEqual({ ok: false, reason: "UNKNOWN_FRAME" });
    const bought = buyFrame(start, "polaroid");
    if (!bought.ok) throw new Error("expected purchase");
    const chosen = selectFrame(bought.profile, "polaroid");
    expect(chosen.ok && chosen.profile.frameSelected).toBe("polaroid");
    const back = chosen.ok ? selectFrame(chosen.profile, "plain") : chosen;
    expect(back.ok && back.profile.frameSelected).toBe("plain");
  });

  it("buying does not select", () => {
    const bought = buyFrame(rich(500), "magazine");
    expect(bought.ok && bought.profile.frameSelected).toBe("plain");
  });
});

describe("purchases leave the input alone", () => {
  it("does not mutate the profile", () => {
    const start = profileWithStars({}, { coins: 200 });
    const snapshot = JSON.stringify(start);
    buyHint(start, "daily");
    buyFreeze(start);
    buyFrame(start, "paper");
    expect(JSON.stringify(start)).toBe(snapshot);
  });
});
