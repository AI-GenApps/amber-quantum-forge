import { checkRamp, MISSION_TYPES, type MissionDef, resolveLanePoint } from "../../src/index";
import { describe, expect, it } from "vitest";
import { allMissions, content, starTimeS } from "./support";

describe("shipped districts", () => {
  it("has three districts between 12x12 and 16x16 tiles", () => {
    const c = content();
    expect(c.districts.map((d) => d.info.id)).toEqual(["district-1", "district-2", "district-3"]);
    for (const d of c.districts) {
      expect(d.map.id).toBe(d.info.id);
      expect(d.map.width).toBeGreaterThanOrEqual(12);
      expect(d.map.width).toBeLessThanOrEqual(16);
      expect(d.map.height).toBeGreaterThanOrEqual(12);
      expect(d.map.height).toBeLessThanOrEqual(16);
    }
  });

  it("uses traffic of 8, 12 and 16 agents", () => {
    expect(content().districts.map((d) => d.info.traffic_agents)).toEqual([8, 12, 16]);
  });

  it("has a strongly connected lane graph in every district", () => {
    for (const d of content().districts) {
      const reached = new Set<string>();
      const stack = [d.graph.nodeList[0]?.id as string];
      while (stack.length > 0) {
        const id = stack.pop() as string;
        if (reached.has(id)) continue;
        reached.add(id);
        for (const e of d.graph.nodes.get(id)?.outEdges ?? []) {
          stack.push(d.graph.edges.get(e)?.to as string);
        }
      }
      expect(reached.size, d.info.id).toBe(d.graph.nodeList.length);
    }
  });
});

describe("shipped missions", () => {
  it("has exactly 24 missions, 8 per district, 2 of each type per district", () => {
    expect(allMissions()).toHaveLength(24);
    for (const d of content().districts) {
      expect(d.missions, d.info.id).toHaveLength(8);
      for (const type of MISSION_TYPES) {
        expect(d.missions.filter((m) => m.type === type), `${d.info.id} ${type}`).toHaveLength(2);
      }
    }
  });

  it("numbers them d{n}-m01 to d{n}-m08 in order, one file each", () => {
    for (const [i, d] of content().districts.entries()) {
      const ids = d.missions.map((m) => m.id);
      expect(ids).toEqual(Array.from({ length: 8 }, (_, k) => `d${i + 1}-m0${k + 1}`));
      expect(d.files.map((f) => f.file)).toEqual(ids.map((id) => `${id}.json`));
      for (const m of d.missions) expect(m.district).toBe(d.info.id);
    }
  });

  it("gives every mission an original title and brief, with no duplicate titles", () => {
    const titles = allMissions().map((m) => m.title);
    expect(new Set(titles).size).toBe(24);
    for (const m of allMissions()) {
      expect(m.title).not.toMatch(/^mission\s*\d*$/i);
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.brief.length).toBeGreaterThan(20);
      expect(m.brief.length).toBeLessThan(220);
    }
  });

  it("puts the start markers at least 30 m apart so each one opens its own briefing", () => {
    for (const d of content().districts) {
      const spots = d.missions.map((m) => resolveLanePoint(d.graph, m.start.lane_point));
      spots.forEach((a, i) => {
        spots.slice(i + 1).forEach((b, j) => {
          const gap = Math.hypot(a.x - b.x, a.z - b.z);
          expect(gap, `${d.missions[i]?.id} vs ${d.missions[i + j + 1]?.id}`).toBeGreaterThan(30);
        });
      });
    }
  });

  it("stores canonical JSON (two-space indent, trailing newline)", () => {
    for (const d of content().districts) {
      for (const f of d.files) expect(f.text).toBe(`${JSON.stringify(f.raw, null, 2)}\n`);
    }
  });
});

describe("difficulty ramp", () => {
  it("rises within each district and each district starts easier than the last ended", () => {
    const c = content();
    const issues = checkRamp(
      c.districts.map((d) => ({ id: d.info.id, missions: d.missions })),
      c.progression.validation.max_inversions,
      2,
    );
    expect(issues).toEqual([]);
  });

  it("starts district 1 with a short, generous, mostly straight delivery", () => {
    const first = content().districts[0]?.missions[0] as MissionDef;
    expect(first.type).toBe("delivery");
    expect(first.validation?.route_length_m).toBeLessThan(200);
    const limit = first.params.time_limit_s;
    expect(limit).toBeGreaterThanOrEqual(3 * (first.validation?.autopilot_time_s ?? limit));
    const difficulties = allMissions().map((m) => m.difficulty ?? 0);
    expect(first.difficulty).toBe(Math.min(...difficulties));
  });
});

describe("autopilot proof", () => {
  it("stores metrics for every mission and the autopilot earned at least one star", () => {
    for (const m of allMissions()) {
      expect(m.validation, m.id).toBeDefined();
      expect(m.difficulty, m.id).toBeGreaterThan(0);
      expect(m.validation?.autopilot_stars, m.id).toBeGreaterThanOrEqual(1);
      expect(m.validation?.autopilot_time_s, m.id).toBeGreaterThan(0);
      expect(m.validation?.traffic_seed, m.id).toBe(content().progression.validation.traffic_seed);
    }
  });

  it("ran each mission with its district's traffic density", () => {
    for (const d of content().districts) {
      for (const m of d.missions) {
        expect(m.validation?.traffic_agents, m.id).toBe(d.info.traffic_agents);
      }
    }
  });

  it("keeps the 3-star time at 85% of the autopilot's time or more, so it is never impossible", () => {
    const { three_star_min_ratio: ratio } = content().progression.validation;
    for (const m of allMissions()) {
      const t3 = starTimeS(m, "3");
      const best = m.validation?.autopilot_time_s ?? 0;
      expect(t3, m.id).toBeGreaterThanOrEqual(ratio * best);
    }
  });

  it("is stricter than the autopilot at 3 stars for at least half the missions", () => {
    const { strict_fraction: fraction } = content().progression.validation;
    const strict = allMissions().filter((m) => (m.validation?.autopilot_stars ?? 3) < 3);
    expect(strict.length).toBeGreaterThanOrEqual(Math.ceil(fraction * 24));
  });

  it("asks for time-only 3-star improvements the autopilot can see (strict ones are within 15%)", () => {
    for (const m of allMissions()) {
      if ((m.validation?.autopilot_stars ?? 3) >= 3) continue;
      const t3 = starTimeS(m, "3");
      expect(t3, m.id).toBeLessThan(m.validation?.autopilot_time_s ?? 0);
    }
  });
});
