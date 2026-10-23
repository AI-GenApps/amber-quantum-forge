import { closetFor } from "./items.mjs";
import { SLOTSETS } from "./challenges.mjs";
import { analyse } from "./engine.mjs";
const [,, k, ss, ...rest] = process.argv;
for (const js of rest) {
  const cons = JSON.parse(js);
  const r = analyse(SLOTSETS[ss], cons, closetFor(Number(k)));
  console.log(r.hist.join("/"), "of", r.total, "maxH", r.maxH, js);
}
