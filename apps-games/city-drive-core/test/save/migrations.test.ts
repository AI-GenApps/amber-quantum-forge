import { describe, expect, it } from "vitest";
import {
  decodeSave,
  MIGRATIONS,
  type MigrationTable,
  migrateSave,
  parseSave,
  SAVE_SCHEMA_VERSION,
  SaveCorruptError,
} from "../../src/index";
import { v1Fixture } from "./support";

const V0_TO_V1: MigrationTable = {
  0: (raw) => {
    const { money, cars, car, ...rest } = raw as Record<string, unknown>;
    return {
      ...rest,
      coins: money,
      owned_cars: cars,
      selected_car: car,
      missions: {},
      settings: {
        audio: true,
        haptics: true,
        control_layout: "standard",
        graphics_quality: "auto",
      },
      onboarding: {},
    };
  },
};

describe("migrateSave", () => {
  it("the real table is empty while v1 is the first release", () => {
    expect(SAVE_SCHEMA_VERSION).toBe(1);
    expect(Object.keys(MIGRATIONS)).toEqual([]);
  });

  it("leaves a current-version save untouched", () => {
    expect(migrateSave(v1Fixture())).toEqual(v1Fixture());
  });

  it("migrates a synthetic v0 save to v1 and the result passes validation", () => {
    const v0 = { schema_version: 0, money: 120, cars: ["sedan"], car: "sedan" };
    const migrated = migrateSave(v0, V0_TO_V1, 1);
    expect(migrated).toMatchObject({ schema_version: 1, coins: 120, owned_cars: ["sedan"] });
    expect(parseSave(migrated).selected_car).toBe("sedan");
  });

  it("chains several migrations in order", () => {
    const calls: number[] = [];
    const table: MigrationTable = {
      0: (raw) => {
        calls.push(0);
        return { ...raw, a: 1 };
      },
      1: (raw) => {
        calls.push(1);
        return { ...raw, b: 2 };
      },
      2: (raw) => {
        calls.push(2);
        return { ...raw, c: 3 };
      },
    };
    expect(migrateSave({ schema_version: 0 }, table, 3)).toEqual({
      schema_version: 3,
      a: 1,
      b: 2,
      c: 3,
    });
    expect(calls).toEqual([0, 1, 2]);
  });

  it("stamps the new version even if a migration forgets to", () => {
    const table: MigrationTable = { 0: () => ({ schema_version: 99 }) };
    expect(migrateSave({ schema_version: 0 }, table, 1)).toEqual({ schema_version: 1 });
  });

  it("refuses a save from a newer app", () => {
    expect(() => migrateSave({ schema_version: 2 }, {}, 1)).toThrow(/reads up to version 1/);
  });

  it("refuses a gap in the table, a missing version and non-objects", () => {
    expect(() => migrateSave({ schema_version: 0 }, {}, 1)).toThrow(/no migration from version 0/);
    expect(() => migrateSave({ coins: 1 })).toThrow(SaveCorruptError);
    expect(() => migrateSave({ schema_version: "1" })).toThrow(SaveCorruptError);
    expect(() => migrateSave({ schema_version: -1 })).toThrow(SaveCorruptError);
    expect(() => migrateSave(null)).toThrow(SaveCorruptError);
  });

  it("refuses a migration that returns something that is not an object", () => {
    const table: MigrationTable = { 0: () => null };
    expect(() => migrateSave({ schema_version: 0 }, table, 1)).toThrow(/returned no object/);
  });
});

describe("decodeSave", () => {
  it("decodes valid text and reports whether it was migrated", () => {
    const text = JSON.stringify(v1Fixture());
    expect(decodeSave(text)).toEqual({ data: v1Fixture(), migrated: false });
    const v0 = JSON.stringify({ schema_version: 0, money: 5, cars: ["sedan"], car: "sedan" });
    expect(decodeSave(v0, V0_TO_V1)?.migrated).toBe(true);
  });

  it("returns undefined for truncated, wrong or unmigratable text", () => {
    expect(decodeSave('{"schema_version":1,"coins":')).toBeUndefined();
    expect(decodeSave("[]")).toBeUndefined();
    expect(decodeSave(JSON.stringify({ schema_version: 0 }))).toBeUndefined();
    expect(decodeSave("")).toBeUndefined();
  });
});
