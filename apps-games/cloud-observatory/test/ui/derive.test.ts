import { CATALOG, createProfile, withLoreUnlocked } from "@web-games/cloud-observatory-core";
import { describe, expect, it } from "vitest";
import {
  achievementViews,
  atlasBonusPercent,
  atlasCards,
  boonViews,
  buyQuote,
  eclipseView,
  hasProgress,
  instrumentViews,
  nextGoal,
  upgradeViews,
} from "../../src/screens/derive";
import { seedProfile } from "../session/harness";

const instrument = (id: string) => {
  const def = CATALOG.instruments.find((item) => item.id === id);
  if (!def) throw new Error(id);
  return def;
};

describe("buyQuote", () => {
  const profile = seedProfile({ game: { starlight: 1000, owned: { telescope: 5 } } });

  it("prices x1 and x10 and flags affordability", () => {
    const one = buyQuote(profile, instrument("telescope"), 1);
    expect(one.count).toBe(1);
    expect(one.cost).toBeCloseTo(15 * 1.12 ** 5, 6);
    expect(one.affordable).toBe(true);
    const ten = buyQuote(profile, instrument("telescope"), 10);
    expect(ten.count).toBe(10);
    expect(ten.affordable).toBe(true);
    const poor = buyQuote(
      seedProfile({ game: { starlight: 300, owned: { telescope: 5 } } }),
      instrument("telescope"),
      10,
    );
    expect(poor.affordable).toBe(false);
  });

  it("max buys as many as the budget allows and quotes one when none are affordable", () => {
    const max = buyQuote(profile, instrument("telescope"), "max");
    expect(max.count).toBeGreaterThan(5);
    expect(max.cost).toBeLessThanOrEqual(1000);
    const poor = seedProfile({ game: { starlight: 1, owned: { telescope: 5 } } });
    const none = buyQuote(poor, instrument("telescope"), "max");
    expect(none.count).toBe(1);
    expect(none.affordable).toBe(false);
  });
});

describe("views", () => {
  it("instrument views unlock in order", () => {
    const views = instrumentViews(seedProfile({ game: { owned: { telescope: 1 } } }));
    expect(views.map((view) => view.unlocked)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(views[0]?.perSecond).toBeCloseTo(0.2, 6);
  });

  it("upgrade states follow owned counts and starlight", () => {
    const telescope = instrument("telescope");
    const states = (owned: number, starlight: number, upgrades: string[] = []) =>
      upgradeViews(
        seedProfile({ game: { owned: { telescope: owned }, starlight, upgrades } }),
        telescope,
      ).map((view) => view.state);
    expect(states(5, 1e6)).toEqual(["locked", "locked", "locked"]);
    expect(states(10, 1e6)).toEqual(["available", "locked", "locked"]);
    expect(states(10, 1)).toEqual(["short", "locked", "locked"]);
    expect(states(25, 1e6, ["u-telescope-1"])).toEqual(["bought", "available", "locked"]);
  });

  it("atlas cards are locked until the instrument and the starlight are both there", () => {
    const state = (game: object) =>
      atlasCards(seedProfile({ game }))
        .slice(0, 2)
        .map((card) => card.state);
    expect(state({})).toEqual(["locked", "locked"]);
    expect(state({ owned: { telescope: 2 }, starlight: 59 })).toEqual(["locked", "locked"]);
    expect(state({ owned: { telescope: 2 }, starlight: 60 })).toEqual(["ready", "locked"]);
    expect(state({ charted: ["lyre"] })).toEqual(["charted", "locked"]);
  });

  it("the atlas bonus counts 5% per chart, 7.5% with Atlas Ink", () => {
    expect(atlasBonusPercent(seedProfile({ game: { charted: ["lyre", "crown"] } }))).toBe(10);
    expect(
      atlasBonusPercent(
        seedProfile({ game: { charted: ["lyre", "crown"], boons: ["atlas-ink"] } }),
      ),
    ).toBe(15);
  });

  it("boons are owned, affordable or short", () => {
    const views = boonViews(seedProfile({ game: { shards: 3, boons: ["dark-adapted"] } }));
    expect(views.find((v) => v.def.id === "dark-adapted")?.state).toBe("owned");
    expect(views.find((v) => v.def.id === "clear-glass")?.state).toBe("affordable");
    const short = views.find((v) => v.def.id === "night-watch");
    expect(short?.state).toBe("short");
    expect(short?.missing).toBe(1);
  });

  it("the eclipse view needs 5 pending shards", () => {
    expect(eclipseView(seedProfile({ game: { cycleStarlight: 2.4e10 } }))).toEqual({
      pending: 4,
      available: false,
      needed: 1,
    });
    expect(eclipseView(seedProfile({ game: { cycleStarlight: 2.5e10 } })).available).toBe(true);
  });

  it("achievement progress is capped at the target", () => {
    const views = achievementViews(
      seedProfile({ game: { owned: { telescope: 14, lens: 3 }, charted: ["lyre"] } }),
    );
    const byId = (id: string) => views.find((view) => view.def.id === id);
    expect(byId("telescope-row")).toMatchObject({ current: 10, target: 10, unlocked: false });
    expect(byId("lens-bench")).toMatchObject({ current: 3, target: 10 });
    expect(byId("cartographer")).toMatchObject({ current: 1, target: 6 });
    expect(byId("first-ink")?.current).toBe(1);
    expect(views).toHaveLength(20);
  });
});

describe("nextGoal", () => {
  it("starts with gathering, then the cheapest purchase", () => {
    expect(nextGoal(createProfile(0)).kind).toBe("instrument");
    expect(nextGoal(createProfile(0))).toMatchObject({
      name: "Brass Telescope",
      affordable: false,
    });
    expect(nextGoal(seedProfile({ game: { starlight: 20 } }))).toMatchObject({
      kind: "instrument",
      affordable: true,
    });
  });

  it("prefers a chart that is ready, and an Eclipse when it is the first one", () => {
    expect(nextGoal(seedProfile({ game: { starlight: 100, owned: { telescope: 2 } } })).kind).toBe(
      "chart",
    );
    const ready = seedProfile({
      game: { starlight: 0, cycleStarlight: 4e10, owned: { telescope: 1 }, charted: ["lyre"] },
    });
    expect(nextGoal(ready).kind).toBe("eclipse");
  });

  it("names the cheapest target even when nothing is affordable", () => {
    const profile = seedProfile({
      game: { starlight: 0, owned: { telescope: 10 }, charted: ["lyre"] },
    });
    expect(nextGoal(profile)).toMatchObject({
      kind: "instrument",
      name: "Brass Telescope",
      affordable: false,
    });
  });

  it("considers upgrades once the instrument is out of the budget", () => {
    const profile = seedProfile({
      game: { starlight: 160, owned: { telescope: 10, lens: 0 }, charted: ["lyre"] },
    });
    const goal = nextGoal(profile);
    expect(goal.affordable).toBe(true);
    expect(goal.cost).toBeLessThanOrEqual(160);
  });
});

describe("hasProgress", () => {
  it("is false for a new profile and true after any play", () => {
    expect(hasProgress(createProfile(0))).toBe(false);
    expect(hasProgress(seedProfile({ stats: { taps: 1 } }))).toBe(true);
    expect(hasProgress(withLoreUnlocked(seedProfile({ game: { owned: { telescope: 1 } } })))).toBe(
      true,
    );
  });
});
