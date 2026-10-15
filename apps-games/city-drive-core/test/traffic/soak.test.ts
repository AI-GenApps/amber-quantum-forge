import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { runSoak, type SoakResult } from "./soak";

const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/09/soak-report.json",
);
const SOAK_SECONDS = 600;
const MAX_RUN_SECONDS = 60;
/** Seeds 5 and 8 once deadlocked a road-end U-turn before exit capacity was checked. */
const SEEDS = [1, 5, 8, 12];

function expectHealthy(r: SoakResult): void {
  expect(r.agentMinutes, "agent-minutes").toBeGreaterThan(150);
  expect(r.aiAiOverlaps, "AI-AI OBB overlaps").toBe(0);
  expect(r.centreDistanceViolations, "centre distance < 2 m").toBe(0);
  expect(r.maxLaneDeviationM, "lane deviation (m)").toBeLessThan(0.5);
  expect(r.maxUnexplainedStuckS, "stuck outside a reserved wait (s)").toBeLessThanOrEqual(20);
  expect(r.maxReservedWaitS, "longest reserved wait (s)").toBeLessThan(45);
  expect(r.minProgressM, "least distance any agent covered in 60 s").toBeGreaterThan(20);
  expect(r.reservationViolations, "intersection entered without a reservation").toBe(0);
  expect(r.forcedStops, "safety clamp used").toBe(0);
  expect(r.runSeconds, "run time (s)").toBeLessThanOrEqual(MAX_RUN_SECONDS);
}

describe("traffic soak: 16 agents, 10 simulated minutes, district-1, player parked", () => {
  const results: SoakResult[] = [];

  for (const seed of SEEDS) {
    it(`seed ${seed}: no collisions, no stuck agent, no deadlock, on the lane`, async () => {
      const r = await runSoak(seed, SOAK_SECONDS);
      results.push(r);
      console.log(
        `soak seed ${seed}: ${r.agentMinutes.toFixed(1)} agent-min in ${r.runSeconds.toFixed(1)} s; ` +
          `min centre distance ${r.minCentreDistanceM.toFixed(2)} m; max stopped ${r.maxStoppedS.toFixed(1)} s; ` +
          `max reserved wait ${r.maxReservedWaitS.toFixed(1)} s; min 60 s progress ${r.minProgressM.toFixed(0)} m`,
      );
      expectHealthy(r);
    }, 120_000);
  }

  it("writes the report when SOAK_REPORT=1", () => {
    if (process.env.SOAK_REPORT !== "1") return;
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    const sorted = [...results].sort((a, b) => a.seed - b.seed);
    writeFileSync(REPORT_PATH, `${JSON.stringify({ map: "district-1", runs: sorted }, null, 2)}\n`);
    expect(sorted.length).toBe(SEEDS.length);
  });
});
