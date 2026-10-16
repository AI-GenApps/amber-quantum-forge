import { spawnSync } from "node:child_process";
import { join } from "node:path";

/**
 * Records the CPU baseline that test/perf/cpu.test.ts compares against, by running that test file
 * in record mode (Node, the same runtime the gate runs in). Run it deliberately, on an otherwise
 * idle machine, after a change that is meant to move the number:
 *   bun scripts/record-perf-baseline.ts
 * Nothing else writes test/fixtures/perf-baseline.json.
 */
const app = join(import.meta.dirname, "..");
const run = spawnSync("bunx", ["vitest", "run", "test/perf/cpu.test.ts", "-t", "records"], {
  cwd: app,
  env: { ...process.env, PERF_RECORD: "1" },
  stdio: "inherit",
});
process.exit(run.status ?? 1);
