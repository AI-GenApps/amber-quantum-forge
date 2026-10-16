import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCityManifest } from "@city-drive/core/city";
import { DISTRICT_MISSIONS } from "../../src/game/missions";
import { GameSession } from "../../src/game/session";
import { type InputSource, NO_INPUT, type PlayerInput } from "../../src/input";
import { loadDistrict } from "../../src/render/district";

export const BENCH_DISTRICT = "district-3";
export const BENCH_STEPS = 3600;
export const BENCH_WARMUP_STEPS = 300;
export const BENCH_RUNS = 5;
export const BENCH_AGENTS = 16;

export interface BenchRun {
  /** Mean wall time of one fixed step, in ms. */
  meanMs: number;
  /** Slowest single step, in ms. */
  maxMs: number;
  /** 99th-percentile step, in ms. */
  p99Ms: number;
  /** Respawns during the run (the scripted driver resets every 7 s). */
  respawns: number;
  /** Traffic agents alive at the end. */
  agents: number;
  /** Steps (of the timed ones) during which a mission was active, so the evaluator was working. */
  activeSteps: number;
  /** Metres the car travelled in total, so a run that never moved is visible. */
  travelledM: number;
}

export interface BenchResult {
  runs: BenchRun[];
  /** The run with the median mean step time. */
  median: BenchRun;
}

/** Ticks between the driver's resets (a manual respawn on the nearest lane, facing along it). */
const RESET_EVERY_TICKS = 420;

/**
 * A fixed, deterministic driver: throttle with a slight weave, and a reset every 7 s so the car
 * keeps rolling along the roads instead of sitting against the first wall it meets.
 */
class WeaveInput implements InputSource {
  private tick = 0;
  read(): PlayerInput {
    this.tick++;
    return {
      ...NO_INPUT,
      throttle: 0.8,
      steer: 0.05 * Math.sin(this.tick / 90),
      reset: this.tick % RESET_EVERY_TICKS === 0,
    };
  }
  dispose(): void {}
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * One timed run of the core simulation as the game runs it on district-3: the player car, 16
 * traffic agents, the mission evaluator with a delivery mission accepted, 3600 fixed steps (one
 * minute of play). Rendering is not included.
 */
export async function runCpuBench(assetsDir: string): Promise<BenchRun> {
  const manifest = readJson(join(assetsDir, "manifest.json"));
  const map = loadDistrict(BENCH_DISTRICT, manifest);
  const session = await GameSession.create(
    map,
    parseCityManifest(manifest),
    new WeaveInput(),
    undefined,
    {
      traffic: { seed: 1, maxAgents: BENCH_AGENTS },
      missions: DISTRICT_MISSIONS[BENCH_DISTRICT],
    },
  );
  try {
    const first = session.missions?.markers()[0];
    if (!first) throw new Error("cpu bench: district-3 has no mission marker");
    session.openMission(first.missionId, true);
    const keepActive = (): void => {
      if (session.missions?.run.phase !== "active") session.openMission(first.missionId, true);
    };
    for (let i = 0; i < BENCH_WARMUP_STEPS; i++) session.step();
    const times = new Float64Array(BENCH_STEPS);
    let travelled = 0;
    let last = session.state.position;
    let activeSteps = 0;
    for (let i = 0; i < BENCH_STEPS; i++) {
      keepActive();
      const start = performance.now();
      session.step();
      times[i] = performance.now() - start;
      const now = session.state.position;
      const moved = Math.hypot(now.x - last.x, now.z - last.z);
      if (moved < 2) travelled += moved;
      last = now;
      if (session.missions?.run.phase === "active") activeSteps++;
    }
    const sorted = [...times].sort((a, b) => a - b);
    const total = times.reduce((sum, t) => sum + t, 0);
    return {
      meanMs: total / BENCH_STEPS,
      maxMs: sorted[BENCH_STEPS - 1] ?? 0,
      p99Ms: sorted[Math.floor(BENCH_STEPS * 0.99)] ?? 0,
      respawns: session.respawns.length,
      agents: session.traffic?.list.length ?? 0,
      activeSteps,
      travelledM: travelled,
    };
  } finally {
    session.dispose();
  }
}

/** Five runs; the median by mean step time is the number that is compared and recorded. */
export async function medianCpuBench(assetsDir: string): Promise<BenchResult> {
  const runs: BenchRun[] = [];
  for (let i = 0; i < BENCH_RUNS; i++) runs.push(await runCpuBench(assetsDir));
  const ordered = [...runs].sort((a, b) => a.meanMs - b.meanMs);
  const median = ordered[Math.floor(BENCH_RUNS / 2)];
  if (!median) throw new Error("cpu bench: no runs");
  return { runs, median };
}

const CALIBRATION_ITERATIONS = 3_000_000;

/**
 * How fast this machine runs a fixed pure-JS loop (ms, median of 5). The CPU gate scales its
 * allowance by how much slower the machine is than the one that recorded the baseline, so a
 * slow CI runner does not fail a gate that is meant to catch code regressions.
 */
export function calibrateMachine(): number {
  const samples: number[] = [];
  let sink = 0;
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    let x = 1;
    for (let i = 0; i < CALIBRATION_ITERATIONS; i++) x = x * 1.0000001 + Math.sin(i) * 1e-9;
    sink += x;
    samples.push(performance.now() - start);
  }
  if (!Number.isFinite(sink)) throw new Error("cpu bench: calibration produced a bad number");
  samples.sort((a, b) => a - b);
  return samples[2] ?? 0;
}
