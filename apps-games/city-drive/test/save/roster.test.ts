import { describe, expect, it } from "vitest";
import { validateManifest } from "../../src/assets/manifest";
import { carEntry, ROSTER } from "../../src/save";
import { readManifest } from "../assets/helpers";

describe("car roster in the app", () => {
  it("every roster model is a shipped car in the asset manifest", () => {
    const manifest = readManifest();
    expect(validateManifest(manifest)).toEqual([]);
    const cars = new Map(manifest.models.filter((m) => m.kind === "car").map((m) => [m.id, m]));
    for (const entry of ROSTER.cars) expect(cars.has(entry.model_id), entry.model_id).toBe(true);
  });

  it("looks cars up by id and fails loudly on an unknown one", () => {
    expect(carEntry("racer").name).toBe("Apex Racer");
    expect(() => carEntry("missing")).toThrow(/unknown car "missing"/);
  });

  it("starts with the sedan, which the player car already used", () => {
    expect(ROSTER.starter).toBe("sedan");
    expect(carEntry("sedan").model_id).toBe("car-sedan");
  });
});
