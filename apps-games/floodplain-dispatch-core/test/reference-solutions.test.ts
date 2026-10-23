import { describe, expect, it } from "vitest";
import {
  EXPECTED_FIELDS,
  EXPECTED_HOUSES,
  evaluate,
  MAP_BY_ID,
  MAPS,
  runSeason,
  totalCost,
  validateContent,
} from "../src";

describe("reference solutions", () => {
  it("ships 40 maps with 120 stars, 193 houses and 133 fields", () => {
    expect(MAPS).toHaveLength(40);
    const houses = MAPS.reduce((sum, map) => sum + map.houseKinds.length, 0);
    expect(houses).toBe(EXPECTED_HOUSES);
    const fields = MAPS.reduce((sum, map) => {
      const result = runSeason(map, []);
      return sum + result.metrics.fields.length;
    }, 0);
    expect(fields).toBe(EXPECTED_FIELDS);
  });

  it("passes the whole-content validator without issues", () => {
    expect(validateContent()).toEqual([]);
  });

  describe("mechanic usage", () => {
    const count = (id: string, kind: string): number =>
      (MAP_BY_ID.get(id)?.reference ?? []).filter((piece) => piece.kind === kind).length;

    it("uses the piece a region introduces in its first maps", () => {
      expect(count("v03", "barrier")).toBeGreaterThanOrEqual(1);
      expect(count("v06", "pump")).toBeGreaterThanOrEqual(1);
      expect(count("d01", "gate")).toBeGreaterThanOrEqual(1);
      expect(count("h01", "reservoir")).toBeGreaterThanOrEqual(1);
    });

    it("sets explicit open and close weeks on every reference gate", () => {
      for (const map of MAPS) {
        for (const piece of map.reference.filter((entry) => entry.kind === "gate")) {
          expect(piece.opensWeek, map.id).toBeDefined();
          expect(piece.closesWeek, map.id).toBeDefined();
        }
      }
    });

    it("gives every Delta map a gate and every Highland map a reservoir", () => {
      for (const map of MAPS.filter((entry) => entry.region === "delta")) {
        expect(count(map.id, "gate"), map.id).toBeGreaterThanOrEqual(1);
      }
      for (const map of MAPS.filter((entry) => entry.region === "highland")) {
        expect(count(map.id, "reservoir"), map.id).toBeGreaterThanOrEqual(1);
      }
    });

    it("needs two reservoirs on h08 and a barrier on every tide map", () => {
      expect(count("h08", "reservoir")).toBe(2);
      for (const map of MAPS.filter((entry) => entry.region === "estuary")) {
        expect(count(map.id, "barrier"), map.id).toBeGreaterThanOrEqual(1);
      }
    });
  });

  for (const map of MAPS) {
    describe(`${map.id} ${map.name}`, () => {
      const result = runSeason(map, map.reference);
      const evaluation = evaluate(map, result, map.reference);

      it("earns three stars at exactly par", () => {
        expect(evaluation.stars).toBe(3);
        expect(totalCost(map.reference)).toBe(map.par);
        expect(evaluation.spend).toBe(map.par);
        expect(map.budget).toBe(map.par + 3);
      });

      it("supplies every house, irrigates every field and floods nothing", () => {
        expect(evaluation.housesFlooded).toBe(0);
        expect(evaluation.housesSupplied).toBe(evaluation.housesTotal);
        expect(evaluation.fieldsIrrigated).toBe(evaluation.fieldsTotal);
      });

      it("needs every piece (removing any one loses a star)", () => {
        map.reference.forEach((piece, index) => {
          const rest = map.reference.filter((_, at) => at !== index);
          const stars = evaluate(map, runSeason(map, rest), rest).stars;
          expect(stars, `${piece.kind}@${piece.x},${piece.y}`).toBeLessThan(3);
        });
      });

      it("is not cleared by the empty placement", () => {
        expect(evaluate(map, runSeason(map, []), []).cleared).toBe(false);
      });
    });
  }
});
