import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  buildBrief,
  CLIENTS,
  closetFor,
  DAILY_BRIEF_MAX,
  DAILY_FALLBACKS,
  DAILY_TIERS,
  type DailyChallenge,
  fallbackFor,
  generateDaily,
  hashString,
  isComplete,
  PIECES,
  parseRuleCode,
  RULE_FAMILY,
  type Rule,
  SLOT_SETS,
  scoreLook,
  tierFor,
  validateChallenge,
  weekdayOfKey,
} from "../src/index";

const START = "2026-01-01";
const CLOSET_3 = closetFor(3);

function seedFor(dateKey: string): number {
  return hashString(`dress-rehearsal|daily|${dateKey}`);
}

function generate(dateKey: string, closet = CLOSET_3): DailyChallenge {
  return generateDaily(
    { seed: seedFor(dateKey), weekday: weekdayOfKey(dateKey), closet, dateKey },
    { strict: true },
  );
}

function families(rules: readonly Rule[]): string[] {
  return rules.map((rule) => RULE_FAMILY[rule.kind]);
}

describe("determinism", () => {
  it("the same seed gives an identical challenge", () => {
    for (let day = 0; day < 14; day += 1) {
      const key = addDaysToKey(START, day);
      expect(generate(key)).toEqual(generate(key));
    }
  });

  it("different dates give different challenges", () => {
    const signatures = new Set<string>();
    for (let day = 0; day < 60; day += 1) {
      const out = generate(addDaysToKey(START, day));
      signatures.add(JSON.stringify([out.slotSet, out.rules, out.reference, out.clientId]));
    }
    expect(signatures.size).toBeGreaterThanOrEqual(58);
  });

  it("the same date gives different challenges for different closets", () => {
    const small = generate("2026-02-10", closetFor(1));
    const large = generate("2026-02-10", closetFor(5));
    expect(JSON.stringify(small.reference)).not.toBe(JSON.stringify(large.reference));
  });

  it("uses the date key in the id and the fixed daily name", () => {
    const out = generate("2026-10-23");
    expect(out.id).toBe("daily-2026-10-23");
    expect(out.name).toBe("Daily Fitting");
    expect(out.chapterIndex).toBe(-1);
    expect(CLIENTS.map((client) => client.id)).toContain(out.clientId);
  });

  it("falls back to a seed id without a date key", () => {
    const out = generateDaily({ seed: 77, weekday: 2, closet: CLOSET_3 });
    expect(out.id).toBe("daily-77");
  });
});

describe("tier ladder", () => {
  it("has the slot and rule counts of product.md", () => {
    expect(DAILY_TIERS.map((tier) => tier.slotCount)).toEqual([6, 6, 7, 7, 8, 8, 8]);
    expect(DAILY_TIERS.map((tier) => tier.ruleCount)).toEqual([2, 3, 3, 3, 3, 4, 4]);
    expect(DAILY_TIERS.map((tier) => tier.need)).toEqual([
      null,
      null,
      null,
      "era-or-formality",
      null,
      null,
      "budget",
    ]);
    expect(DAILY_TIERS.map((tier) => tier.slotSets.join(""))).toEqual([
      "ABC",
      "ABC",
      "DEF",
      "DEF",
      "G",
      "G",
      "G",
    ]);
  });

  it("every slot set of a tier really has the tier's slot count", () => {
    for (const tier of DAILY_TIERS) {
      for (const set of tier.slotSets)
        expect(SLOT_SETS[set].length, tier.name).toBe(tier.slotCount);
    }
  });

  it("rejects weekdays outside 0 to 6", () => {
    expect(() => tierFor(7)).toThrow(RangeError);
    expect(() => tierFor(-1)).toThrow(RangeError);
    expect(() => tierFor(1.5)).toThrow(RangeError);
  });

  it("generated challenges follow the ladder for a full year", () => {
    for (let day = 0; day < 365; day += 1) {
      const key = addDaysToKey(START, day);
      const out = generate(key);
      const tier = tierFor(weekdayOfKey(key));
      expect(out.rules.length, key).toBe(tier.ruleCount);
      expect(tier.slotSets, key).toContain(out.slotSet);
      expect(SLOT_SETS[out.slotSet].length, key).toBe(tier.slotCount);
      const kinds = families(out.rules);
      expect(new Set(kinds).size, key).toBe(kinds.length);
      if (tier.need === "budget") expect(kinds, key).toContain("budget");
      if (tier.need === "era-or-formality") {
        expect(
          kinds.some((kind) => kind === "era" || kind === "formality"),
          key,
        ).toBe(true);
      }
    }
  });

  it("covers every weekday exactly once in a week", () => {
    const weekdays = Array.from({ length: 7 }, (_, day) => weekdayOfKey(addDaysToKey(START, day)));
    expect([...weekdays].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOfKey("2026-01-05")).toBe(0);
    expect(weekdayOfKey("2026-01-11")).toBe(6);
  });
});

describe("generated challenges", () => {
  it("pass the structural checks of validateChallenge", () => {
    for (let day = 0; day < 120; day += 1) {
      const out = generate(addDaysToKey(START, day));
      expect(validateChallenge(out, CLOSET_3, { briefMax: DAILY_BRIEF_MAX }), out.id).toEqual([]);
    }
  });

  it("have a complete reference look that scores three stars", () => {
    for (let day = 0; day < 120; day += 1) {
      const out = generate(addDaysToKey(START, day));
      expect(isComplete(out.slotSet, out.reference)).toBe(true);
      expect(scoreLook(out, CLOSET_3, out.reference).stars).toBe(3);
      expect(scoreLook(out, CLOSET_3, {}).stars).toBe(0);
    }
  });

  it("draw the reference only from the closet", () => {
    const closet = closetFor(2);
    const ids = new Set(closet.map((piece) => piece.id));
    for (let day = 0; day < 60; day += 1) {
      const out = generate(addDaysToKey(START, day), closet);
      for (const id of Object.values(out.reference)) expect(ids.has(id)).toBe(true);
    }
  });

  it("report generated or fallback honestly", () => {
    const out = generate("2026-04-04");
    expect(["generated", "fallback"]).toContain(out.source);
    expect(out.attempts).toBeGreaterThanOrEqual(1);
    expect(out.attempts).toBeLessThanOrEqual(12);
    if (out.source === "generated") expect(out.sampledShare).toBeLessThanOrEqual(0.1);
  });
});

describe("briefs", () => {
  it("never exceed 120 characters and name the client", () => {
    for (let day = 0; day < 365; day += 1) {
      const out = generate(addDaysToKey(START, day));
      expect(out.brief.length, out.id).toBeLessThanOrEqual(DAILY_BRIEF_MAX);
      expect(out.brief.endsWith("."), out.id).toBe(true);
      const client = CLIENTS.find((item) => item.id === out.clientId);
      expect(out.brief.startsWith(client?.name.split(" ")[0] ?? "?"), out.id).toBe(true);
    }
  });

  it("stay within 120 characters in the worst case", () => {
    const longest = [...PIECES].sort((a, b) => b.name.length - a.name.length)[0];
    const ottoline = CLIENTS.find((client) => client.id === "ottoline");
    if (longest === undefined || ottoline === undefined) throw new Error("fixtures");
    const rules = [
      parseRuleCode(`include-piece:${longest.id}`),
      parseRuleCode("formality-min:4"),
      parseRuleCode("warmth-max:12"),
      parseRuleCode("max-spend:1000"),
    ];
    expect(buildBrief(ottoline, rules).length).toBeLessThanOrEqual(DAILY_BRIEF_MAX);
  });

  it("read as a sentence built from the rule chips", () => {
    const mireille = CLIENTS.find((client) => client.id === "mireille");
    if (mireille === undefined) throw new Error("fixtures");
    const rules = [parseRuleCode("palette-warm"), parseRuleCode("max-spend:330")];
    expect(buildBrief(mireille, rules)).toBe(
      "Mireille Vasseur: warm colours only and spend at most $330.",
    );
  });
});

describe("fallback templates", () => {
  const starting = closetFor(1);

  it("are seven, one per weekday, with unique ids", () => {
    expect(DAILY_FALLBACKS).toHaveLength(7);
    expect(new Set(DAILY_FALLBACKS.map((def) => def.id)).size).toBe(7);
    DAILY_FALLBACKS.forEach((def, weekday) => {
      expect(fallbackFor(weekday)).toBe(def);
    });
  });

  it("validate on their own like campaign challenges", () => {
    for (const def of DAILY_FALLBACKS) {
      expect(validateChallenge(def, starting, { briefMax: DAILY_BRIEF_MAX }), def.id).toEqual([]);
    }
  });

  it("follow the tier ladder", () => {
    DAILY_FALLBACKS.forEach((def, weekday) => {
      const tier = tierFor(weekday);
      expect(def.rules.length, def.id).toBe(tier.ruleCount);
      expect(SLOT_SETS[def.slotSet].length, def.id).toBe(tier.slotCount);
      expect(tier.slotSets, def.id).toContain(def.slotSet);
      const kinds = families(def.rules);
      expect(new Set(kinds).size, def.id).toBe(kinds.length);
      if (tier.need === "budget") expect(kinds).toContain("budget");
      if (tier.need === "era-or-formality") {
        expect(kinds.some((kind) => kind === "era" || kind === "formality")).toBe(true);
      }
    });
  });

  it("score three stars with the 16-piece starting closet and with every larger closet", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      for (const def of DAILY_FALLBACKS) {
        expect(scoreLook(def, closetFor(level), def.reference).stars, `${def.id} ${level}`).toBe(3);
      }
    }
  });

  it("use only starting-closet pieces", () => {
    const ids = new Set(starting.map((piece) => piece.id));
    for (const def of DAILY_FALLBACKS) {
      for (const id of Object.values(def.reference)) expect(ids.has(id), def.id).toBe(true);
    }
  });

  it("are returned when no attempt can succeed, with the date id", () => {
    const bare = closetFor(1).filter((piece) => piece.category !== "hat");
    const out = generateDaily({ seed: 5, weekday: 4, closet: bare, dateKey: "2026-06-05" });
    expect(out.source).toBe("fallback");
    expect(out.id).toBe("daily-2026-06-05");
    expect(out.attempts).toBe(12);
    expect(out.rules).toEqual(DAILY_FALLBACKS[4]?.rules);
  });
});
