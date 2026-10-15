/**
 * Regenerates test/fixtures/determinism.json. Run explicitly:
 *   bun run fixture:determinism
 * Never edit the fixture by hand to make a test pass.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPerSecond, SCENARIO_SECONDS } from "../test/physics/scenario";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "test", "fixtures", "determinism.json");
const hashes = await hashPerSecond();
if (hashes.length !== SCENARIO_SECONDS)
  throw new Error(`expected ${SCENARIO_SECONDS} hashes, got ${hashes.length}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  `${JSON.stringify({ scenario: "scripted-30s", step: "1/60", rapier: "0.21.0", hashes }, null, 2)}\n`,
);
console.log(`wrote ${hashes.length} hashes to ${out}`);
