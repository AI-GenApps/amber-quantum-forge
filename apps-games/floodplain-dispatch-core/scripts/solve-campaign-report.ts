import { MAPS } from "../src/content";
import { DEFAULT_MAX_SIMS, solveMap } from "../src/daily/solver";
import { evaluate } from "../src/evaluate";
import { runSeason } from "../src/simulate";

const filter = process.argv[2] ?? "";
let solved = 0;
let total = 0;
console.log("| Map | Par | Budget | Solver cost | Stars | Sims | ms |");
console.log("|---|---|---|---|---|---|---|");
for (const map of MAPS) {
  if (!map.id.startsWith(filter)) continue;
  total++;
  const began = performance.now();
  const solution = solveMap(map, { maxSims: DEFAULT_MAX_SIMS });
  const ms = Math.round(performance.now() - began);
  if (!solution) {
    console.log(`| ${map.id} | ${map.par} | ${map.budget} | null | - | - | ${ms} |`);
    continue;
  }
  solved++;
  const stars = evaluate(map, runSeason(map, solution.placements), solution.placements).stars;
  console.log(
    `| ${map.id} | ${map.par} | ${map.budget} | ${solution.cost} | ${stars} | ${solution.sims} | ${ms} |`,
  );
}
console.log(`\nsolved ${solved} of ${total}`);
