import { writeFileSync } from "node:fs";
import { renderMapAscii } from "../src/index";
import { canonicalJson, loadContent } from "./content";
import { type Measured, measureMission, withMetrics } from "./measure";
import { missionTable } from "./table";

const args = new Set(process.argv.slice(2));
const known = new Set(["--check", "--report", "--table", "--ascii", "--json"]);
for (const arg of args) {
  if (!known.has(arg)) {
    console.error(`unknown option ${arg}; use --check, --report, --table, --ascii or --json`);
    process.exit(2);
  }
}

const content = loadContent();
const writes = args.size === 0;
const stale: string[] = [];
const failed: string[] = [];
const rows: { id: string; measured: Measured }[] = [];

for (const district of content.districts) {
  for (const file of district.files) {
    const mission = district.missions.find((m) => m.id === file.raw.id);
    if (!mission) throw new Error(`${file.file}: not in the loaded catalog`);
    const measured = await measureMission(content, district, mission);
    rows.push({ id: mission.id, measured });
    if (!measured.result.success) {
      failed.push(`${mission.id}: autopilot ${measured.result.failReason ?? "failed"}`);
      continue;
    }
    const next = canonicalJson(withMetrics(file.raw, measured));
    if (next !== file.text) {
      stale.push(file.file);
      if (writes) writeFileSync(file.path, next);
    }
  }
}

if (args.has("--ascii")) {
  for (const d of content.districts) console.log(`${renderMapAscii(d.map)}\n`);
}
if (args.has("--json")) {
  const out = rows.map(({ id, measured }) => ({
    id,
    difficulty: measured.difficulty,
    ...measured.validation,
    success: measured.result.success,
    failReason: measured.result.failReason ?? null,
    comfort: measured.result.comfort,
  }));
  console.log(JSON.stringify(out, null, 2));
}
if (args.has("--table") || args.has("--report")) console.log(missionTable(content, rows));

if (failed.length > 0) {
  console.error(`autopilot could not complete:\n  ${failed.join("\n  ")}`);
  process.exit(1);
}
if (args.has("--check")) {
  if (stale.length > 0) {
    console.error(
      `stored metrics are stale in ${stale.length} file(s): ${stale.join(", ")}\nrun: bun run missions:validate`,
    );
    process.exit(1);
  }
  console.log(`all ${rows.length} missions have fresh metrics`);
} else if (writes) {
  console.log(`checked ${rows.length} missions, rewrote ${stale.length} file(s)`);
}
