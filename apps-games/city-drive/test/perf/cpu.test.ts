// @vitest-environment node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { assetsDir } from "../assets/helpers";
import {
  BENCH_AGENTS,
  BENCH_DISTRICT,
  BENCH_RUNS,
  BENCH_STEPS,
  type BenchResult,
  calibrateMachine,
  medianCpuBench,
} from "./cpuBench";

const BASELINE_PATH = join(__dirname, "../fixtures/perf-baseline.json");
const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/15/cpu-report.json",
);
/** The run may be this many times slower than the recorded baseline before the gate fails. */
const REGRESSION_FACTOR = 2;
/** Hard ceiling on this server, ms per fixed step. A phone is 5 to 10 times slower. */
const SERVER_CEILING_MS = 2;
/** The on-device target from the task: at most 4 ms of simulation per frame. */
const DEVICE_TARGET_MS = 4;
const RECORD = process.env.PERF_RECORD === "1";

interface Baseline {
  meanStepMs: number;
  p99StepMs: number;
  /** `calibrateMachine()` on the machine that recorded the baseline, ms. */
  calibrationMs: number;
}

function readBaseline(): Baseline {
  return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
}

let cached: Promise<BenchResult> | undefined;
const bench = (): Promise<BenchResult> => {
  cached ??= medianCpuBench(assetsDir);
  return cached;
};

describe(`core simulation CPU, ${BENCH_DISTRICT}, ${BENCH_AGENTS} traffic agents, ${BENCH_STEPS} steps`, () => {
  it.skipIf(!RECORD)("records the baseline (PERF_RECORD=1 only)", async () => {
    const { median, runs } = await bench();
    const baseline = {
      note: `Median of ${BENCH_RUNS} runs of ${BENCH_STEPS} fixed steps on ${BENCH_DISTRICT} (player car, ${BENCH_AGENTS} traffic agents, delivery mission accepted). Written only by scripts/record-perf-baseline.ts.`,
      district: BENCH_DISTRICT,
      steps: BENCH_STEPS,
      runs: BENCH_RUNS,
      agents: BENCH_AGENTS,
      meanStepMs: Number(median.meanMs.toFixed(4)),
      p99StepMs: Number(median.p99Ms.toFixed(4)),
      calibrationMs: Number(calibrateMachine().toFixed(3)),
      recordedAt: new Date().toISOString(),
      runtime: `node ${process.versions.node}`,
      allRunsMeanMs: runs.map((r) => Number(r.meanMs.toFixed(4))),
    };
    mkdirSync(dirname(BASELINE_PATH), { recursive: true });
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  });

  it.skipIf(RECORD)(
    "does real work: the car drives, traffic is alive, a mission is active",
    async () => {
      const { runs } = await bench();
      for (const run of runs) {
        expect(run.agents).toBeGreaterThanOrEqual(8);
        expect(run.travelledM).toBeGreaterThan(100);
        expect(run.activeSteps).toBeGreaterThan(BENCH_STEPS * 0.95);
      }
    },
  );

  it.skipIf(RECORD)(
    "is at most 2x the recorded baseline and under the 2 ms server ceiling",
    async () => {
      const { median, runs } = await bench();
      const baseline = readBaseline();
      const calibrationMs = calibrateMachine();
      const slowdown = Math.max(1, calibrationMs / baseline.calibrationMs);
      const allowedMs = REGRESSION_FACTOR * baseline.meanStepMs * slowdown;
      const line = `median ${median.meanMs.toFixed(4)} ms/step (runs ${runs
        .map((r) => r.meanMs.toFixed(3))
        .join(
          ", ",
        )}); baseline ${baseline.meanStepMs} ms/step; this machine is ${slowdown.toFixed(2)}x the baseline machine (calibration ${calibrationMs.toFixed(1)} vs ${baseline.calibrationMs} ms)`;
      expect(
        median.meanMs,
        `CPU budget: ${line}; allowed ${REGRESSION_FACTOR}x baseline x machine factor = ${allowedMs.toFixed(4)} ms. Re-record with scripts/record-perf-baseline.ts only if the slowdown is intended.`,
      ).toBeLessThanOrEqual(allowedMs);
      expect(
        median.meanMs,
        `CPU budget: ${line}; server ceiling ${SERVER_CEILING_MS} ms`,
      ).toBeLessThanOrEqual(SERVER_CEILING_MS);
      expect(median.p99Ms, "p99 step").toBeLessThanOrEqual(SERVER_CEILING_MS * 2);
      if (process.env.BUDGET_REPORT === "1") {
        const report = {
          method: `Median of ${BENCH_RUNS} runs; each is ${BENCH_STEPS} timed fixed steps (after 300 warm-up steps) of GameSession on ${BENCH_DISTRICT} with ${BENCH_AGENTS} traffic agents, the mission evaluator running a delivery mission, and a scripted driver that resets every 7 s. Rendering excluded.`,
          runtime: `node ${process.versions.node}`,
          baseline,
          thisMachine: { calibrationMs, slowdownVsBaseline: slowdown, allowedMs },
          gate: {
            regressionFactor: REGRESSION_FACTOR,
            serverCeilingMs: SERVER_CEILING_MS,
            deviceTargetMs: DEVICE_TARGET_MS,
          },
          median,
          runs,
          deviceEstimate: {
            note: "A phone is 5 to 10x slower than this server, so the simulation share of a frame is estimated as below; the target is at most 4 ms.",
            lowMs: Number((median.meanMs * 5).toFixed(3)),
            highMs: Number((median.meanMs * 10).toFixed(3)),
          },
        };
        mkdirSync(dirname(REPORT_PATH), { recursive: true });
        writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
      }
    },
  );
});
