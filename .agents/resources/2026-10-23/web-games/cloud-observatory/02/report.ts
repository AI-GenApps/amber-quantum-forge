// Prints the balance report recorded in simulator-output.txt. Run: bun report.ts
import { CATALOG, simulate } from "../../../../../../apps-games/cloud-observatory-core/src/index";
const ids = CATALOG.constellations.slice(0, 11).map((c) => c.id);
const fmt = (s: number | null) => (s === null ? "never" : `${s} s (${(s / 60).toFixed(1)} min, ${(s / 3600).toFixed(2)} h)`);
const full = simulate(CATALOG, { cycles: 3 });
console.log("## sequential run, boons bought by ascending cost between cycles");
for (const c of full.cycles) {
  console.log(`cycle ${c.cycle}: boons at start [${c.boonsAtStart.join(", ")}]; first chart ${fmt(c.firstChartSeconds)}; 5 shards ${fmt(c.secondsToShards)}; longest gap ${c.longestGap} s; charted at Eclipse ${c.chartedAtEclipse}; purchases ${c.purchases}; shards gained ${c.shardsGained}; boons bought after [${c.boonsBought.join(", ")}]`);
}
const one = full.cycles[0]!.secondsToShards!;
console.log("## pinned scenarios (11 constellations charted, as after a first cycle)");
for (const boons of [
  ["dark-adapted", "brass-polish"],
  ["dark-adapted", "brass-polish", "clear-glass", "apprentice"],
  ["dark-adapted", "brass-polish", "clear-glass", "apprentice", "atlas-ink", "corona"],
]) {
  const c = simulate(CATALOG, { cycles: 1, startBoons: boons, startCharted: ids }).cycles[0]!;
  console.log(`${boons.length} boons [${boons.join(", ")}]: 5 shards ${fmt(c.secondsToShards)}; ratio to cycle 1 ${(c.secondsToShards! / one).toFixed(3)}; longest gap ${c.longestGap} s; charted at Eclipse ${c.chartedAtEclipse}`);
}
console.log("cycle2/cycle1", (full.cycles[1]!.secondsToShards! / one).toFixed(3), "cycle3/cycle1", (full.cycles[2]!.secondsToShards! / one).toFixed(3));
