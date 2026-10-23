import { describe, expect, it } from "vitest";
import {
  defaultProfile,
  FP_CAP,
  type Profile,
  SCENES_PER_REGULAR,
  START_COINS,
  sanitizeProfile,
} from "../src";

function edit(change: (draft: Record<string, unknown>) => void): unknown {
  const draft = JSON.parse(JSON.stringify(defaultProfile())) as Record<string, unknown>;
  change(draft);
  return draft;
}

function ok(data: unknown): Profile {
  const profile = sanitizeProfile(data);
  if (profile === null) throw new Error("expected a profile");
  return profile;
}

describe("defaultProfile", () => {
  it("starts with 30 coins on day 1 and nothing owned", () => {
    const profile = defaultProfile();
    expect(profile.coins).toBe(START_COINS);
    expect(profile.day).toBe(1);
    expect(profile.owned).toEqual([]);
    expect(profile.daysDone).toEqual({});
    expect(profile.pendingEvening).toEqual([]);
    expect(profile.diary).toEqual([]);
    expect(Object.keys(profile.regulars)).toHaveLength(8);
    expect(profile.settings).toEqual({ recipeGuide: true, relaxed: false, textSize: "normal" });
    expect(profile.late.streak).toBe(0);
    expect(profile.late.lastKey).toBeNull();
  });

  it("round-trips through JSON and sanitize unchanged", () => {
    const profile = defaultProfile();
    expect(sanitizeProfile(JSON.parse(JSON.stringify(profile)))).toEqual(profile);
  });
});

describe("sanitizeProfile clamps", () => {
  it("clamps coins at zero and floors fractions", () => {
    expect(ok(edit((d) => (d.coins = -20))).coins).toBe(0);
    expect(ok(edit((d) => (d.coins = 12.9))).coins).toBe(12);
  });

  it("clamps FP to 0 to 8, scenes to 0 to 5 and visits", () => {
    const profile = ok(
      edit((d) => {
        const regulars = d.regulars as Record<string, Record<string, number>>;
        regulars["1"] = { fp: 99, visits: 5000, scenesDone: 9 } as never;
        regulars["2"] = { fp: -3, visits: -1, scenesDone: -2 } as never;
      }),
    );
    expect(profile.regulars[1]?.fp).toBe(FP_CAP);
    expect(profile.regulars[1]?.scenesDone).toBe(SCENES_PER_REGULAR);
    expect(profile.regulars[1]?.visits).toBe(999);
    expect(profile.regulars[2]).toMatchObject({ fp: 0, visits: 0, scenesDone: 0 });
  });

  it("clamps the day to 1 to 15", () => {
    expect(ok(edit((d) => (d.day = 0))).day).toBe(1);
    expect(ok(edit((d) => (d.day = 99))).day).toBe(15);
  });

  it("trims the diary to 14 unique days and keeps the order", () => {
    const profile = ok(edit((d) => (d.diary = [3, 3, 1, 99, 0, 2, -4, "x"])));
    expect(profile.diary).toEqual([1, 2, 3]);
    const many = ok(edit((d) => (d.diary = Array.from({ length: 40 }, (_, i) => i + 1))));
    expect(many.diary).toHaveLength(14);
  });

  it("clamps stats to sane maxima", () => {
    const profile = ok(edit((d) => (d.stats = { served: 1e15, delighted: -5, mistakes: 3.7 })));
    expect(profile.stats.served).toBe(1_000_000_000);
    expect(profile.stats.delighted).toBe(0);
    expect(profile.stats.mistakes).toBe(3);
    expect(profile.stats.itemsMade).toBe(0);
  });

  it("limits the late records and keeps best streak at least the streak", () => {
    const profile = ok(
      edit((d) => {
        d.late = {
          count: 4,
          lastKey: "2026-10-20",
          streak: 9,
          bestStreak: 3,
          records: { bestDelightedRun: 500 },
        };
      }),
    );
    expect(profile.late.bestStreak).toBe(9);
    expect(profile.late.records.bestDelightedRun).toBe(99);
  });
});

describe("sanitizeProfile drops", () => {
  it("drops unknown top-level keys and unknown nested keys", () => {
    const profile = ok(
      edit((d) => {
        d.cheat = { coins: 999999 };
        (d.settings as Record<string, unknown>).secret = true;
      }),
    );
    expect(profile).not.toHaveProperty("cheat");
    expect(profile.settings).not.toHaveProperty("secret");
  });

  it("drops unknown decor, pastry, book, scene and day ids", () => {
    const profile = ok(
      edit((d) => {
        d.owned = ["decor-2", "decor-99", "decor-2", "decor-1"];
        d.stock = { pastries: ["pastry-1", "pastry-77"], books: ["book-9", "book-2"] };
        d.pendingEvening = ["scene-1-1", "scene-9-9", 7];
        d.daysDone = {
          "1": { stars: 3, earned: 40, served: 6, delighted: 3 },
          "99": { stars: 1, earned: 1, served: 1, delighted: 1 },
        };
      }),
    );
    expect(profile.owned).toEqual(["decor-1", "decor-2"]);
    expect(profile.stock).toEqual({ pastries: ["pastry-1"], books: ["book-2"] });
    expect(profile.pendingEvening).toEqual(["scene-1-1"]);
    expect(Object.keys(profile.daysDone)).toEqual(["1"]);
  });

  it("keeps a pending scene only when it is the regular's next scene", () => {
    const profile = ok(
      edit((d) => {
        const regulars = d.regulars as Record<string, Record<string, unknown>>;
        regulars["1"] = { fp: 1, visits: 1, scenesDone: 0, choices: {}, ending: null };
        d.pendingEvening = ["scene-1-1", "scene-1-3"];
      }),
    );
    expect(profile.pendingEvening).toEqual(["scene-1-1"]);
  });

  it("drops unknown choice ids and bad option values", () => {
    const profile = ok(
      edit((d) => {
        const regulars = d.regulars as Record<string, Record<string, unknown>>;
        regulars["1"] = {
          fp: 0,
          visits: 0,
          scenesDone: 0,
          choices: { "no-such-choice": "a", "other-regular": "b" },
          ending: null,
        };
      }),
    );
    expect(profile.regulars[1]?.choices).toEqual({});
  });

  it("only keeps an ending when the story is finished", () => {
    const profile = ok(
      edit((d) => {
        const regulars = d.regulars as Record<string, Record<string, unknown>>;
        regulars["3"] = { fp: 8, visits: 5, scenesDone: 5, choices: {}, ending: "b" };
        regulars["4"] = { fp: 8, visits: 5, scenesDone: 2, choices: {}, ending: "a" };
      }),
    );
    expect(profile.regulars[3]?.ending).toBe("b");
    expect(profile.regulars[4]?.ending).toBeNull();
  });
});

describe("sanitizeProfile rejects wrong types", () => {
  const bad: Array<[string, unknown]> = [
    ["null", null],
    ["a string", "profile"],
    ["an array", []],
    ["a number", 12],
  ];
  for (const [label, value] of bad) {
    it(`rejects ${label}`, () => expect(sanitizeProfile(value)).toBeNull());
  }

  const fields: Array<[string, unknown]> = [
    ["coins", "lots"],
    ["day", "one"],
    ["daysDone", []],
    ["owned", {}],
    ["stock", 4],
    ["regulars", []],
    ["pendingEvening", "x"],
    ["diary", {}],
    ["late", "now"],
    ["flags", []],
    ["settings", true],
    ["stats", "many"],
  ];
  for (const [field, value] of fields) {
    it(`rejects a wrong-typed ${field}`, () => {
      expect(sanitizeProfile(edit((d) => (d[field] = value)))).toBeNull();
    });
  }

  it("rejects a wrong-typed setting and a bad regular row", () => {
    expect(
      sanitizeProfile(edit((d) => ((d.settings as Record<string, unknown>).relaxed = "yes"))),
    ).toBeNull();
    expect(
      sanitizeProfile(edit((d) => ((d.regulars as Record<string, unknown>)["2"] = "nope"))),
    ).toBeNull();
  });

  it("fills missing fields from defaults", () => {
    expect(sanitizeProfile({})).toEqual(defaultProfile());
    expect(sanitizeProfile({ coins: 12 })?.coins).toBe(12);
  });

  it("never lets coins go negative from any numeric input", () => {
    for (const coins of [-1, -1e12, -0.5, 0]) {
      expect(ok(edit((d) => (d.coins = coins))).coins).toBeGreaterThanOrEqual(0);
    }
    expect(sanitizeProfile(edit((d) => (d.coins = Number.NaN)))).toBeNull();
    expect(sanitizeProfile(edit((d) => (d.coins = Number.POSITIVE_INFINITY)))).toBeNull();
  });

  it("keeps only valid flags and limits their number", () => {
    const flags: Record<string, unknown> = {
      tutorial: true,
      "first-rain": true,
      off: false,
      "": true,
    };
    for (let i = 0; i < 100; i++) flags[`f${i}`] = true;
    const profile = ok(edit((d) => (d.flags = flags)));
    expect(profile.flags.tutorial).toBe(true);
    expect(profile.flags.off).toBeUndefined();
    expect(Object.keys(profile.flags)).toHaveLength(64);
  });
});
