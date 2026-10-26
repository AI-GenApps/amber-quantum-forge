import { closetFor, ITEMS, THEMES } from "./items.mjs";
import { CHALLENGES, SLOTSETS } from "./challenges.mjs";
import { looks, score, harmony, ERAS } from "./engine.mjs";
import { writeFileSync } from "node:fs";
const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const text = (c) => {
  switch (c.k) {
    case "warm": return "Warm colours only";
    case "cool": return "Cool colours only";
    case "maxHues": return c.n === 0 ? "Neutrals only" : c.n === 1 ? "One colour at most" : `At most ${c.n === 2 ? "two" : "three"} colours`;
    case "incColour": return `Include something ${c.c}`;
    case "avoidColour": return `Nothing ${c.c}`;
    case "eraMin": return c.n === 3 ? "Only modern pieces" : `Nothing older than the ${ERAS[c.n]}`;
    case "eraMax": return `Nothing newer than the ${ERAS[c.n]}`;
    case "fMin": return `Every piece formality ${c.n}+`;
    case "fMax": return `Every piece formality ${c.n} or less`;
    case "wMin": return `Total warmth at least ${c.n}`;
    case "wMax": return `Total warmth at most ${c.n}`;
    case "feature": return `A ${c.f} piece`;
    case "maxSpend": return `Spend at most $${c.n}`;
    case "minSpend": return `Spend at least $${c.n}`;
    case "incPiece": return `Wear the ${byId[c.id].name}`;
    case "avoidPiece": return `Leave out the ${byId[c.id].name}`;
  }
};
const out = [];
const json = [];
for (const [id, name, ch, client, ss, cons] of CHALLENGES) {
  const closet = closetFor(Math.max(1, ch));
  let total = 0, three = 0, best = null, bestKey = null;
  for (const l of looks(SLOTSETS[ss], closet)) {
    total++;
    const r = score(SLOTSETS[ss], cons, l);
    if (r.stars === 3) {
      three++;
      const price = Object.values(l).reduce((s, i) => s + i.price, 0);
      const tcount = Object.values(l).filter((i) => i.theme === THEMES[ch]).length;
      const key = [tcount * 1000 + r.h.total, -price];
      if (!bestKey || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) { bestKey = key; best = { look: l, h: r.h.total, price }; }
    }
  }
  const empty = score(SLOTSETS[ss], cons, {}).stars;
  if (!best) { out.push(`${id} | ${name} | NO 3-STAR LOOK (${total} looks) ${cons.map(text).join('; ')}`); continue; }
  json.push({ id, name, ch, client, ss, slots: SLOTSETS[ss], cons, total, three, empty, ref: Object.fromEntries(Object.entries(best.look).map(([s, i]) => [s, i.id])), refH: best.h, refPrice: best.price });
  out.push(`${id} | ${name} | ${client} | ${SLOTSETS[ss].length} | ${cons.map(text).join("; ")} | looks ${total} | 3* ${three} (${((three / total) * 100).toFixed(2)}%) | ref ${Object.values(best.look).map((i) => i.id.replace("item-", "")).join(",")} H${best.h} $${best.price} | empty ${empty}`);
}
writeFileSync("report.txt", out.join("\n"));
writeFileSync("report.json", JSON.stringify(json, null, 1));
console.log(out.join("\n"));
