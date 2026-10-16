import { describe, expect, it } from "vitest";
import {
  bayMarginM,
  type DifficultyConfig,
  missionDifficulty,
  missionRouteMetrics,
  parkingTightness,
} from "../../src/index";
import { CAR_FOOTPRINT, loadMissionWorld } from "./helpers";

const CONFIG: DifficultyConfig = {
  weights: { route_ratio: 0.4, intersections: 0.25, traffic: 0.2, parking: 0.15 },
  reference_speed_mps: 10,
  max_intersections: 12,
  max_traffic_agents: 16,
  parking_margin_tight_m: 0.2,
  parking_margin_loose_m: 1.5,
};

const BASE = { routeLengthM: 0, timeLimitS: 100, intersections: 0, trafficAgents: 0 };

describe("missionDifficulty", () => {
  it("is zero for an empty mission and the weights add up to one", () => {
    expect(missionDifficulty(BASE, CONFIG)).toBe(0);
    const maxed = missionDifficulty(
      {
        routeLengthM: 1000,
        timeLimitS: 100,
        intersections: 12,
        trafficAgents: 16,
        parkingMarginM: 0.2,
      },
      CONFIG,
    );
    expect(maxed).toBeCloseTo(1, 10);
  });

  it("normalises the route-length to time-limit ratio against the reference speed", () => {
    const half = missionDifficulty({ ...BASE, routeLengthM: 500 }, CONFIG);
    expect(half).toBeCloseTo(0.4 * 0.5, 10);
    const over = missionDifficulty({ ...BASE, routeLengthM: 5000 }, CONFIG);
    expect(over).toBeCloseTo(0.4, 10);
  });

  it("scales intersections against 12 and traffic against 16, each capped at 1", () => {
    expect(missionDifficulty({ ...BASE, intersections: 6 }, CONFIG)).toBeCloseTo(0.25 * 0.5, 10);
    expect(missionDifficulty({ ...BASE, intersections: 30 }, CONFIG)).toBeCloseTo(0.25, 10);
    expect(missionDifficulty({ ...BASE, trafficAgents: 8 }, CONFIG)).toBeCloseTo(0.2 * 0.5, 10);
    expect(missionDifficulty({ ...BASE, trafficAgents: 40 }, CONFIG)).toBeCloseTo(0.2, 10);
  });

  it("gives parking 1 at a 0.2 m margin, 0 at 1.5 m, and 0 when there is no bay", () => {
    expect(parkingTightness(0.2, CONFIG)).toBe(1);
    expect(parkingTightness(0.05, CONFIG)).toBe(1);
    expect(parkingTightness(1.5, CONFIG)).toBe(0);
    expect(parkingTightness(3, CONFIG)).toBe(0);
    expect(parkingTightness(0.85, CONFIG)).toBeCloseTo(0.5, 10);
    expect(missionDifficulty({ ...BASE, parkingMarginM: 0.2 }, CONFIG)).toBeCloseTo(0.15, 10);
    expect(missionDifficulty(BASE, CONFIG)).toBe(0);
  });

  it("measures the bay margin on the tighter axis", () => {
    const bay = { lane_point: { edgeId: "x", s: 0 }, lateral_offset_m: 3 };
    expect(bayMarginM({ ...bay, width_m: 2.6, length_m: 5.6 }, CAR_FOOTPRINT)).toBeCloseTo(
      0.45,
      10,
    );
    expect(bayMarginM({ ...bay, width_m: 3.4, length_m: 4.6 }, CAR_FOOTPRINT)).toBeCloseTo(0.2, 10);
  });
});

describe("missionRouteMetrics", () => {
  it("adds up the legs and counts the junctions passed", () => {
    const { graph, laneIndex, catalog } = loadMissionWorld();
    const delivery = catalog.find((m) => m.id === "d1-m01");
    if (!delivery) throw new Error("fixture d1-m01 missing");
    const metrics = missionRouteMetrics(graph, laneIndex, delivery);
    expect(metrics.routeLengthM).toBeGreaterThan(100);
    expect(Number.isInteger(metrics.intersections)).toBe(true);
    expect(metrics.intersections).toBeGreaterThan(0);
  });

  it("is zero for a drop on the same stretch of lane as the start", () => {
    const { graph, laneIndex, catalog } = loadMissionWorld();
    const base = catalog.find((m) => m.type === "time_trial");
    if (base?.type !== "time_trial") throw new Error("trial fixture missing");
    const start = base.start.lane_point;
    const there = {
      ...base,
      params: {
        ...base.params,
        checkpoints: [
          { lane_point: { edgeId: start.edgeId, s: start.s + 5 } },
          { lane_point: { edgeId: start.edgeId, s: start.s + 8 } },
        ],
      },
    };
    const metrics = missionRouteMetrics(graph, laneIndex, there);
    expect(metrics.routeLengthM).toBeCloseTo(8, 5);
    expect(metrics.intersections).toBe(0);
  });
});
