import { describe, expect, it } from "vitest";
import { ALL_COLOURS, ERA_ORDER, FEATURES, RULE_KINDS } from "../src/constants";
import {
  checkRule,
  chromaticColours,
  parseRuleCode,
  RULE_FAMILY,
  RuleCodeError,
  ruleChipText,
  ruleCode,
  ruleDetail,
} from "../src/rules";
import type { Piece, Rule } from "../src/types";
import { makePiece } from "./fixtures/starter-pieces";

const p = (id: string, overrides: Partial<Piece> = {}): Piece => makePiece({ id, ...overrides });

describe("checkRule: palette", () => {
  it("palette-warm: pink, red, orange, yellow pass, neutrals are free", () => {
    const rule: Rule = { kind: "palette-warm" };
    for (const colour of ["pink", "red", "orange", "yellow"] as const) {
      expect(checkRule(rule, [p("a", { colour }), p("b", { colour: "navy" })])).toBe(true);
    }
    for (const colour of [
      "lime",
      "green",
      "magenta",
      "mint",
      "teal",
      "sky",
      "blue",
      "violet",
    ] as const) {
      expect(checkRule(rule, [p("a", { colour })])).toBe(false);
    }
    expect(checkRule(rule, [p("a", { colour: "black" }), p("b", { colour: "tan" })])).toBe(true);
  });

  it("palette-cool: mint, teal, sky, blue, violet pass", () => {
    const rule: Rule = { kind: "palette-cool" };
    for (const colour of ["mint", "teal", "sky", "blue", "violet"] as const) {
      expect(checkRule(rule, [p("a", { colour }), p("b", { colour: "white" })])).toBe(true);
    }
    for (const colour of ["lime", "green", "magenta", "red", "orange", "yellow", "pink"] as const) {
      expect(checkRule(rule, [p("a", { colour })])).toBe(false);
    }
  });

  it("lime, green and magenta are neither warm nor cool", () => {
    for (const colour of ["lime", "green", "magenta"] as const) {
      const pieces = [p("a", { colour })];
      expect(checkRule({ kind: "palette-warm" }, pieces)).toBe(false);
      expect(checkRule({ kind: "palette-cool" }, pieces)).toBe(false);
    }
  });

  it("max-hues counts distinct chromatic colours at 0, 1, 2 and 3", () => {
    const neutrals = [p("a", { colour: "black" }), p("b", { colour: "cream" })];
    const one = [...neutrals, p("c", { colour: "red" }), p("d", { colour: "red" })];
    const two = [...one, p("e", { colour: "blue" })];
    const three = [...two, p("f", { colour: "mint" })];
    const cases: [number, Piece[], boolean][] = [
      [0, neutrals, true],
      [0, one, false],
      [1, neutrals, true],
      [1, one, true],
      [1, two, false],
      [2, two, true],
      [2, three, false],
      [3, three, true],
    ];
    for (const [max, pieces, expected] of cases) {
      expect(checkRule({ kind: "max-hues", max: max as 0 | 1 | 2 | 3 }, pieces)).toBe(expected);
    }
  });

  it("neutrals never count as colours", () => {
    const all = ["black", "white", "cream", "grey", "navy", "tan"] as const;
    const pieces = all.map((colour, i) => p(`n${i}`, { colour }));
    expect(chromaticColours(pieces)).toEqual([]);
    expect(checkRule({ kind: "max-hues", max: 0 }, pieces)).toBe(true);
  });

  it("include-colour and avoid-colour match any of the 18 colours", () => {
    for (const colour of ALL_COLOURS) {
      const pieces = [p("a", { colour })];
      expect(checkRule({ kind: "include-colour", colour }, pieces)).toBe(true);
      expect(checkRule({ kind: "avoid-colour", colour }, pieces)).toBe(false);
      expect(checkRule({ kind: "include-colour", colour }, [])).toBe(false);
      expect(checkRule({ kind: "avoid-colour", colour }, [])).toBe(true);
    }
    expect(checkRule({ kind: "avoid-colour", colour: "navy" }, [p("a", { colour: "black" })])).toBe(
      true,
    );
  });
});

describe("checkRule: era", () => {
  const at = (era: (typeof ERA_ORDER)[number]) => p(`e-${era}`, { era });

  it("era-min uses the order 50s < 70s < 90s < now", () => {
    ERA_ORDER.forEach((limit, limitIndex) => {
      ERA_ORDER.forEach((era, eraIndex) => {
        expect(checkRule({ kind: "era-min", era: limit }, [at(era)])).toBe(eraIndex >= limitIndex);
      });
    });
  });

  it("era-max uses the same order", () => {
    ERA_ORDER.forEach((limit, limitIndex) => {
      ERA_ORDER.forEach((era, eraIndex) => {
        expect(checkRule({ kind: "era-max", era: limit }, [at(era)])).toBe(eraIndex <= limitIndex);
      });
    });
  });

  it("every piece must pass, one violation fails the rule", () => {
    expect(checkRule({ kind: "era-min", era: "90s" }, [at("90s"), at("now"), at("70s")])).toBe(
      false,
    );
    expect(checkRule({ kind: "era-max", era: "70s" }, [at("50s"), at("70s"), at("90s")])).toBe(
      false,
    );
  });
});

describe("checkRule: formality, warmth, budget", () => {
  it("formality-min and formality-max at the edge", () => {
    const pieces = [p("a", { formality: 2 }), p("b", { formality: 4 })];
    expect(checkRule({ kind: "formality-min", value: 2 }, pieces)).toBe(true);
    expect(checkRule({ kind: "formality-min", value: 3 }, pieces)).toBe(false);
    expect(checkRule({ kind: "formality-max", value: 4 }, pieces)).toBe(true);
    expect(checkRule({ kind: "formality-max", value: 3 }, pieces)).toBe(false);
  });

  it("warmth sum at the limit and one over", () => {
    const pieces = [p("a", { warmth: 3 }), p("b", { warmth: 2 }), p("c", { warmth: 2 })];
    expect(checkRule({ kind: "warmth-max", value: 7 }, pieces)).toBe(true);
    expect(checkRule({ kind: "warmth-max", value: 6 }, pieces)).toBe(false);
    expect(checkRule({ kind: "warmth-min", value: 7 }, pieces)).toBe(true);
    expect(checkRule({ kind: "warmth-min", value: 8 }, pieces)).toBe(false);
  });

  it("spend sum at the limit and one over", () => {
    const pieces = [p("a", { price: 100 }), p("b", { price: 230 })];
    expect(checkRule({ kind: "max-spend", amount: 330 }, pieces)).toBe(true);
    expect(checkRule({ kind: "max-spend", amount: 329 }, pieces)).toBe(false);
    expect(checkRule({ kind: "min-spend", amount: 330 }, pieces)).toBe(true);
    expect(checkRule({ kind: "min-spend", amount: 331 }, pieces)).toBe(false);
  });
});

describe("checkRule: features and pieces", () => {
  it("needs-feature for each feature", () => {
    for (const feature of FEATURES) {
      expect(checkRule({ kind: "needs-feature", feature }, [p("a", { features: [feature] })])).toBe(
        true,
      );
      expect(checkRule({ kind: "needs-feature", feature }, [p("a", { features: [] })])).toBe(false);
    }
    const two = [p("a", { features: ["sturdy", "waterproof"] })];
    expect(checkRule({ kind: "needs-feature", feature: "waterproof" }, two)).toBe(true);
    expect(checkRule({ kind: "needs-feature", feature: "shade" }, two)).toBe(false);
  });

  it("include-piece and avoid-piece match the exact id", () => {
    const pieces = [p("item-a"), p("item-b")];
    expect(checkRule({ kind: "include-piece", pieceId: "item-a" }, pieces)).toBe(true);
    expect(checkRule({ kind: "include-piece", pieceId: "item-c" }, pieces)).toBe(false);
    expect(checkRule({ kind: "avoid-piece", pieceId: "item-a" }, pieces)).toBe(false);
    expect(checkRule({ kind: "avoid-piece", pieceId: "item-c" }, pieces)).toBe(true);
    expect(checkRule({ kind: "include-piece", pieceId: "item" }, pieces)).toBe(false);
  });
});

const ONE_OF_EACH: Rule[] = [
  { kind: "palette-warm" },
  { kind: "palette-cool" },
  { kind: "max-hues", max: 0 },
  { kind: "max-hues", max: 3 },
  { kind: "include-colour", colour: "sky" },
  { kind: "avoid-colour", colour: "navy" },
  { kind: "era-min", era: "now" },
  { kind: "era-min", era: "90s" },
  { kind: "era-max", era: "70s" },
  { kind: "formality-min", value: 2 },
  { kind: "formality-max", value: 4 },
  { kind: "warmth-min", value: 6 },
  { kind: "warmth-max", value: 7 },
  { kind: "needs-feature", feature: "waterproof" },
  { kind: "max-spend", amount: 330 },
  { kind: "min-spend", amount: 600 },
  { kind: "include-piece", pieceId: "item-riviera-4" },
  { kind: "avoid-piece", pieceId: "item-rainy-city-1" },
];

describe("rule codes", () => {
  it("covers all 16 kinds in the fixture list", () => {
    expect(new Set(ONE_OF_EACH.map((rule) => rule.kind))).toEqual(new Set(RULE_KINDS));
  });

  it("serialises to the codes in product.md", () => {
    expect(ONE_OF_EACH.map(ruleCode)).toEqual([
      "palette-warm",
      "palette-cool",
      "max-hues:0",
      "max-hues:3",
      "include-colour:sky",
      "avoid-colour:navy",
      "era-min:now",
      "era-min:90s",
      "era-max:70s",
      "formality-min:2",
      "formality-max:4",
      "warmth-min:6",
      "warmth-max:7",
      "needs-feature:waterproof",
      "max-spend:330",
      "min-spend:600",
      "include-piece:item-riviera-4",
      "avoid-piece:item-rainy-city-1",
    ]);
  });

  it("round-trips every kind", () => {
    for (const rule of ONE_OF_EACH) expect(parseRuleCode(ruleCode(rule))).toEqual(rule);
  });

  it("round-trips every colour, era and feature argument", () => {
    for (const colour of ALL_COLOURS) {
      expect(parseRuleCode(`include-colour:${colour}`)).toEqual({ kind: "include-colour", colour });
      expect(parseRuleCode(`avoid-colour:${colour}`)).toEqual({ kind: "avoid-colour", colour });
    }
    for (const era of ERA_ORDER) {
      expect(parseRuleCode(`era-min:${era}`)).toEqual({ kind: "era-min", era });
      expect(parseRuleCode(`era-max:${era}`)).toEqual({ kind: "era-max", era });
    }
    for (const feature of FEATURES) {
      expect(parseRuleCode(`needs-feature:${feature}`)).toEqual({ kind: "needs-feature", feature });
    }
  });

  const reasonOf = (code: string): string => {
    try {
      parseRuleCode(code);
    } catch (error) {
      if (error instanceof RuleCodeError) return error.reason;
      throw error;
    }
    return "ACCEPTED";
  };

  it("rejects unknown kinds", () => {
    for (const code of ["", "nope", "palette-warmish", "Palette-Warm", "max-hue:1", ":1"]) {
      expect(reasonOf(code)).toBe("UNKNOWN_KIND");
    }
  });

  it("rejects missing arguments", () => {
    for (const code of ["max-hues", "max-hues:", "include-colour", "era-min:", "include-piece:"]) {
      expect(reasonOf(code)).toBe("MISSING_ARGUMENT");
    }
  });

  it("rejects arguments on argument-free kinds", () => {
    expect(reasonOf("palette-warm:1")).toBe("UNEXPECTED_ARGUMENT");
    expect(reasonOf("palette-cool:")).toBe("UNEXPECTED_ARGUMENT");
  });

  it("rejects bad arguments", () => {
    const bad = [
      "max-hues:4",
      "max-hues:-1",
      "max-hues:one",
      "max-hues:01",
      "include-colour:purple",
      "avoid-colour:Red",
      "era-min:80s",
      "era-max:2020",
      "formality-min:0",
      "formality-max:6",
      "formality-min:2.5",
      "warmth-min:-1",
      "warmth-max:1e2",
      "warmth-max:100001",
      "needs-feature:fast",
      "max-spend: 5",
      "min-spend:5 ",
      "max-spend:007",
      "include-piece:bad id",
      "avoid-piece:a:b",
    ];
    for (const code of bad) expect(reasonOf(code)).toBe("BAD_ARGUMENT");
  });

  it("throws RuleCodeError instances that carry the code", () => {
    try {
      parseRuleCode("max-hues:9");
      throw new Error("expected a throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RuleCodeError);
      expect((error as RuleCodeError).code).toBe("max-hues:9");
    }
  });

  it("accepts the boundary numbers", () => {
    expect(parseRuleCode("formality-min:1")).toEqual({ kind: "formality-min", value: 1 });
    expect(parseRuleCode("formality-max:5")).toEqual({ kind: "formality-max", value: 5 });
    expect(parseRuleCode("warmth-min:0")).toEqual({ kind: "warmth-min", value: 0 });
    expect(parseRuleCode("max-spend:0")).toEqual({ kind: "max-spend", amount: 0 });
    expect(parseRuleCode("min-spend:100000")).toEqual({ kind: "min-spend", amount: 100000 });
  });
});

describe("rule families", () => {
  it("maps every kind to its family", () => {
    expect(RULE_FAMILY).toEqual({
      "palette-warm": "palette",
      "palette-cool": "palette",
      "max-hues": "palette",
      "include-colour": "palette",
      "avoid-colour": "palette",
      "era-min": "era",
      "era-max": "era",
      "formality-min": "formality",
      "formality-max": "formality",
      "warmth-min": "weather",
      "warmth-max": "weather",
      "needs-feature": "feature",
      "max-spend": "budget",
      "min-spend": "budget",
      "include-piece": "piece",
      "avoid-piece": "piece",
    });
  });
});

describe("ruleChipText", () => {
  it("uses the exact chip strings of product.md", () => {
    const chips = ONE_OF_EACH.map((rule) => ruleChipText(rule, "Orange Wrap Skirt"));
    expect(chips).toEqual([
      "Warm colours only",
      "Cool colours only",
      "Neutrals only",
      "Three colours at most",
      "Include something sky",
      "Nothing navy",
      "Only modern pieces",
      "Nothing older than the 90s",
      "Nothing newer than the 70s",
      "Every piece formality 2 or more",
      "Every piece formality 4 or less",
      "Total warmth at least 6",
      "Total warmth at most 7",
      "A waterproof piece",
      "Spend at most $330",
      "Spend at least $600",
      "Wear the Orange Wrap Skirt",
      "Leave out the Orange Wrap Skirt",
    ]);
  });

  it("names the one and two colour limits", () => {
    expect(ruleChipText({ kind: "max-hues", max: 1 })).toBe("One colour at most");
    expect(ruleChipText({ kind: "max-hues", max: 2 })).toBe("Two colours at most");
  });

  it("covers era edge cases", () => {
    expect(ruleChipText({ kind: "era-min", era: "70s" })).toBe("Nothing older than the 70s");
    expect(ruleChipText({ kind: "era-max", era: "now" })).toBe("Nothing newer than now");
    expect(ruleChipText({ kind: "era-max", era: "90s" })).toBe("Nothing newer than the 90s");
  });

  it("falls back when no piece name is given", () => {
    expect(ruleChipText({ kind: "include-piece", pieceId: "x" })).toBe("Wear the chosen piece");
    expect(ruleChipText({ kind: "avoid-piece", pieceId: "x" })).toBe("Leave out the chosen piece");
  });
});

describe("ruleDetail", () => {
  const red = p("r", {
    name: "Red Coat",
    colour: "red",
    warmth: 3,
    price: 200,
    formality: 4,
    era: "50s",
  });
  const blue = p("b", {
    name: "Blue Shirt",
    colour: "blue",
    warmth: 2,
    price: 90,
    formality: 2,
    era: "now",
  });
  const mint = p("m", {
    name: "Mint Bag",
    colour: "mint",
    warmth: 0,
    price: 40,
    formality: 3,
    era: "90s",
    features: ["waterproof"],
  });
  const black = p("k", {
    name: "Black Boots",
    colour: "black",
    warmth: 4,
    price: 10,
    formality: 5,
    era: "70s",
    features: ["sturdy"],
  });

  it("palette details name the colours", () => {
    expect(ruleDetail({ kind: "palette-warm" }, [red, black])).toBe("Colours used: red");
    expect(ruleDetail({ kind: "palette-warm" }, [black])).toBe("Colours used: none");
    expect(ruleDetail({ kind: "palette-warm" }, [red, blue, mint])).toBe("Not warm: mint, blue");
    expect(ruleDetail({ kind: "palette-cool" }, [blue, mint])).toBe("Colours used: mint, blue");
    expect(ruleDetail({ kind: "palette-cool" }, [red, blue])).toBe("Not cool: red");
  });

  it("max-hues lists the colours in wheel order", () => {
    expect(ruleDetail({ kind: "max-hues", max: 2 }, [red, blue, mint])).toBe(
      "Colours used: red, mint, blue",
    );
    expect(ruleDetail({ kind: "max-hues", max: 0 }, [black])).toBe("Colours used: none");
  });

  it("colour include and avoid details", () => {
    expect(ruleDetail({ kind: "include-colour", colour: "blue" }, [red, blue])).toBe(
      "Has blue: Blue Shirt",
    );
    expect(ruleDetail({ kind: "include-colour", colour: "sky" }, [red, blue])).toBe(
      "Missing: something sky",
    );
    expect(ruleDetail({ kind: "avoid-colour", colour: "sky" }, [red, blue])).toBe("No sky pieces");
    expect(ruleDetail({ kind: "avoid-colour", colour: "red" }, [red, blue])).toBe(
      "Found red: Red Coat",
    );
  });

  it("era details", () => {
    expect(ruleDetail({ kind: "era-min", era: "70s" }, [blue, black])).toBe(
      "Oldest piece is from the 70s",
    );
    expect(ruleDetail({ kind: "era-min", era: "70s" }, [blue, red])).toBe("Too old: Red Coat");
    expect(ruleDetail({ kind: "era-max", era: "90s" }, [mint, black])).toBe(
      "Newest piece is from the 90s",
    );
    expect(ruleDetail({ kind: "era-max", era: "90s" }, [blue, black])).toBe("Too new: Blue Shirt");
    expect(ruleDetail({ kind: "era-min", era: "now" }, [blue])).toBe("Oldest piece is modern");
    expect(ruleDetail({ kind: "era-min", era: "70s" }, [])).toBe("No pieces yet");
    expect(ruleDetail({ kind: "era-max", era: "70s" }, [])).toBe("No pieces yet");
  });

  it("formality details show the value next to the limit", () => {
    expect(ruleDetail({ kind: "formality-min", value: 3 }, [red, blue])).toBe(
      "Lowest formality is 2, the minimum is 3",
    );
    expect(ruleDetail({ kind: "formality-max", value: 4 }, [red, black])).toBe(
      "Highest formality is 5, the limit is 4",
    );
    expect(ruleDetail({ kind: "formality-min", value: 3 }, [])).toBe("No pieces yet");
    expect(ruleDetail({ kind: "formality-max", value: 3 }, [])).toBe("No pieces yet");
  });

  it("warmth and spend details show the value next to the limit", () => {
    expect(ruleDetail({ kind: "warmth-max", value: 7 }, [red, blue, black])).toBe(
      "Total warmth is 9, the limit is 7",
    );
    expect(ruleDetail({ kind: "warmth-min", value: 12 }, [red, blue])).toBe(
      "Total warmth is 5, the minimum is 12",
    );
    expect(ruleDetail({ kind: "max-spend", amount: 300 }, [red, blue])).toBe(
      "Spend is $290, the limit is $300",
    );
    expect(ruleDetail({ kind: "min-spend", amount: 600 }, [red, blue])).toBe(
      "Spend is $290, the minimum is $600",
    );
  });

  it("feature details", () => {
    expect(ruleDetail({ kind: "needs-feature", feature: "waterproof" }, [red, mint])).toBe(
      "Has waterproof: Mint Bag",
    );
    expect(ruleDetail({ kind: "needs-feature", feature: "waterproof" }, [red, blue])).toBe(
      "Missing: something waterproof",
    );
  });

  it("piece details use the supplied name", () => {
    const include: Rule = { kind: "include-piece", pieceId: "r" };
    const avoid: Rule = { kind: "avoid-piece", pieceId: "r" };
    expect(ruleDetail(include, [red], "Red Coat")).toBe("Wearing the Red Coat");
    expect(ruleDetail(include, [blue], "Red Coat")).toBe("Missing: the Red Coat");
    expect(ruleDetail(include, [blue])).toBe("Missing: the required piece");
    expect(ruleDetail(avoid, [blue], "Red Coat")).toBe("Left out the Red Coat");
    expect(ruleDetail(avoid, [red], "Red Coat")).toBe("Still wearing the Red Coat");
    expect(ruleDetail(avoid, [red])).toBe("Still wearing the Red Coat");
    expect(ruleDetail(avoid, [blue])).toBe("Left out the piece");
  });

  it("returns a non-empty string for every kind, met or unmet", () => {
    for (const rule of ONE_OF_EACH) {
      for (const pieces of [[], [red], [red, blue, mint, black]]) {
        expect(ruleDetail(rule, pieces).length).toBeGreaterThan(0);
      }
    }
  });
});
