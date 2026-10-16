import { describe, expect, it } from "vitest";
import { defaultSave, parseSave, SAVE_SCHEMA_VERSION, SaveCorruptError } from "../../src/index";
import { v1Fixture } from "./support";

describe("parseSave", () => {
  it("accepts the v1 fixture unchanged", () => {
    expect(parseSave(v1Fixture())).toEqual(v1Fixture());
  });

  it("accepts a brand-new player's defaults", () => {
    const save = defaultSave("sedan");
    expect(parseSave(save)).toEqual(save);
    expect(save).toMatchObject({ coins: 0, owned_cars: ["sedan"], selected_car: "sedan" });
    expect(save.schema_version).toBe(SAVE_SCHEMA_VERSION);
  });

  it("round-trips through JSON", () => {
    const save = v1Fixture();
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
    ["wrong version", (s) => (s.schema_version = 2), /schema_version must be 1/],
  ];

  for (const [name, mutate, message] of broken) {
    it(`rejects ${name}`, () => {
      const save = JSON.parse(JSON.stringify(v1Fixture())) as Record<string, unknown>;
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
      parseSave({ schema_version: 1, coins: -1, owned_cars: [], selected_car: "", missions: 3 });
    } catch (error) {
      expect((error as SaveCorruptError).problems.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("does not carry unknown fields into the clean copy", () => {
    const parsed = parseSave({ ...v1Fixture(), cheat: true }) as unknown as Record<string, unknown>;
    expect(parsed.cheat).toBeUndefined();
  });
});
