import { MAP_BY_ID } from "../../../../../../../apps-games/floodplain-dispatch-core/src";
import { solve } from "./solver";

const id = process.argv[2] as string;
const runs = Number(process.argv[3] ?? 8), iters = Number(process.argv[4] ?? 60000);
const map = MAP_BY_ID.get(id)!;
let best = map.par, found = 0;
for (let r = 0; r < runs; r++) {
  const o = r % 2 === 1 ? { init: map.reference.map((p) => ({ ...p })), t0: 0.9 } : {};
  const res = solve(map, { iters, seed: Number(process.env.SEED ?? 9000) + r, ...o });
  if (res && res.cost < best) { best = res.cost; found++; }
}
console.log(`${id} par ${map.par} searchMin ${best} runs ${runs} iters ${iters}`);
