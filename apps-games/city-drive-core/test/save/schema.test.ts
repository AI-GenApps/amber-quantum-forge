import { describe, expect, it } from "vitest";
import { defaultSave, parseSave, SAVE_SCHEMA_VERSION, SaveCorruptError } from "../../src/index";
import { v2Fixture } from "./support";

describe("parseSave", () => {
  it("accepts the v1 fixture unchanged", () => {
    expect(parseSave(v2Fixture())).toEqual(v2Fixture());
  });

  it("accepts a brand-new player's defaults", () => {
    const save = defaultSave("sedan");
    expect(parseSave(save)).toEqual(save);
    expect(save).toMatchObject({ coins: 0, owned_cars: ["sedan"], selected_car: "sedan" });
    expect(save.schema_version).toBe(SAVE_SCHEMA_VERSION);
  });

  it("round-trips through JSON", () => {
    const save = v2Fixture();
    expect(parseSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  const broken: [string, (s: Record<string, unknown>) => void, RegExp][] = [
    ["negative coins", (s) => (s.coins = -1), /coins must be a non-negative integer/],
    ["fractional coins", (s) => (s.coins = 1.5), /coins must be a non-negative integer/],
    ["NaN coins", (s) => (s.coins = Number.NaN), /coins/],
    ["no owned cars", (s) => (s.owned_cars = []), /owned_cars must be a non-empty array/],
    ["repeated car", (s) => (s.owned_cars = ["sedan", "sedan"]), /must not repeat/],
    ["selected car not owned", (s) => (s.selected_car = "racer"), /selected_car must be one of/],
    ["bad stars", (s) => (s.missions = { x: { stars: 4, best_time_s: 1 } }), /missions.x.stars/],
    ["bad time", (s) => (s.missions = { x: { stars: 1, best_time_s: -2 } }), /best_time_s/],
    ["missions not an object", (s) => (s.missions = []), /missions must be an object/],
    [
      "unknown layout",
      (s) => ((s.settings as Record<string, unknown>).control_layout = "x"),
      /control_layout/,
    ],
    [
      "non-boolean audio",
      (s) => ((s.settings as Record<string, unknown>).audio = 1),
      /settings.audio/,
    ],
    ["onboarding flag type", (s) => (s.onboarding = { a: "yes" }), /onboarding.a/],
    ["wrong version", (s) => (s.schema_version = 3), /schema_version must be 2/],
    ["upgrades not an object", (s) => (s.upgrades = []), /upgrades must be an object/],
    [
      "upgrade for an unowned car",
      (s) => (s.upgrades = { racer: { power: 1, grip: 0, brakes: 0 } }),
      /upgrades.racer is not an owned car/,
    ],
    [
      "upgrade for an unknown car",
      (s) => (s.upgrades = { ghost: { power: 0, grip: 0, brakes: 0 } }),
      /upgrades.ghost is not an owned car/,
    ],
    [
      "upgrade level above 3",
      (s) => (s.upgrades = { sedan: { power: 4, grip: 0, brakes: 0 } }),
      /upgrades.sedan needs levels 0 to 3/,
    ],
    [
      "negative upgrade level",
      (s) => (s.upgrades = { sedan: { power: 0, grip: -1, brakes: 0 } }),
      /upgrades.sedan needs levels/,
    ],
    [
      "fractional upgrade level",
      (s) => (s.upgrades = { sedan: { power: 0.5, grip: 0, brakes: 0 } }),
      /upgrades.sedan needs levels/,
    ],
    [
      "upgrade track missing",
      (s) => (s.upgrades = { sedan: { power: 1, grip: 0 } }),
      /upgrades.sedan needs levels/,
    ],
    ["daily not an object", (s) => (s.daily = null), /daily must be an object/],
    [
      "daily date not real",
      (s) => (s.daily = { last_claim_date: "2026-02-30", streak: 1 }),
      /daily.last_claim_date/,
    ],
    [
      "daily date wrong shape",
      (s) => (s.daily = { last_claim_date: "10/14/2026", streak: 1 }),
      /daily.last_claim_date/,
    ],
    [
      "daily streak without a date",
      (s) => (s.daily = { last_claim_date: null, streak: 2 }),
      /daily.streak/,
    ],
    [
      "daily date with a zero streak",
      (s) => (s.daily = { last_claim_date: "2026-10-14", streak: 0 }),
      /daily.streak/,
    ],
    [
      "daily negative streak",
      (s) => (s.daily = { last_claim_date: "2026-10-14", streak: -1 }),
      /daily.streak/,
    ],
  ];

  for (const [name, mutate, message] of broken) {
    it(`rejects ${name}`, () => {
      const save = JSON.parse(JSON.stringify(v2Fixture())) as Record<string, unknown>;
      mutate(save);
      expect(() => parseSave(save)).toThrow(SaveCorruptError);
      expect(() => parseSave(save)).toThrow(message);
    });
  }

  it("rejects non-objects and lists every problem at once", () => {
    for (const input of [null, "text", 5, [], undefined]) {
      expect(() => parseSave(input)).toThrow(SaveCorruptError);
    }
    try {
      parseSave({ schema_version: 2, coins: -1, owned_cars: [], selected_car: "", missions: 3 });
    } catch (error) {
      expect((error as SaveCorruptError).problems.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("does not carry unknown fields into the clean copy", () => {
    const parsed = parseSave({ ...v2Fixture(), cheat: true }) as unknown as Record<string, unknown>;
    expect(parsed.cheat).toBeUndefined();
  });
});
