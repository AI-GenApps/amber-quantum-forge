import { closetFor } from "./items.mjs";
import { SLOTSETS } from "./challenges.mjs";
import { harmony, checkConstraint, score, isComplete } from "./engine.mjs";
import { mulberry, candidatesFor, GROUP } from "./gen.mjs";
const TIERS = [ // Monday = 0
  { slots: ["A", "B", "C"], n: 2, need: [] },
  { slots: ["A", "B", "C"], n: 3, need: [] },
  { slots: ["D", "E", "F"], n: 3, need: [] },
  { slots: ["D", "E", "F"], n: 3, need: ["era|formality"] },
  { slots: ["G"], n: 3, need: [] },
  { slots: ["G"], n: 4, need: [] },
  { slots: ["G"], n: 4, need: ["budget"] },
];
function randomLook(slots, closet, rnd) {
  const by = (cat) => closet.filter((i) => i.category === cat);
  const pick = (cat) => { const a = by(cat); return a[Math.floor(rnd() * a.length)]; };
  const look = {};
  const open = new Set(slots);
  const useDress = open.has("dress") && (!(open.has("top") && open.has("bottom")) || rnd() < 0.3);
  if (useDress) look.dress = pick("dress"); else { look.top = pick("top"); look.bottom = pick("bottom"); }
  for (const s of slots) if (!["dress", "top", "bottom"].includes(s)) look[s] = pick(s);
  return look;
}
export function generate(seed, weekday, k, tries = 12) {
  const closet = closetFor(k); const tier = TIERS[weekday];
  const rnd = mulberry(seed);
  for (let a = 0; a < tries; a++) {
    const ss = tier.slots[Math.floor(rnd() * tier.slots.length)];
    const slots = SLOTSETS[ss];
    let seedLook = null;
    for (let t = 0; t < 200 && !seedLook; t++) { const l = randomLook(slots, closet, rnd); if (harmony(Object.values(l)).total >= 70) seedLook = l; }
    if (!seedLook) continue;
    const cands = candidatesFor(Object.values(seedLook), closet, rnd);
    // sample
    const sample = []; for (let i = 0; i < 300; i++) sample.push(Object.values(randomLook(slots, closet, rnd)));
    const nontrivial = cands.filter((c) => sample.filter((it) => !checkConstraint(c, it)).length >= 0.2 * sample.length);
    const shuffled = [...nontrivial].sort(() => rnd() - 0.5);
    const chosen = []; const used = new Set();
    const wants = tier.need.slice();
    const tryAdd = (c) => { const g = GROUP[c.k]; if (used.has(g)) return false; used.add(g); chosen.push(c); return true; };
    for (const w of wants) { const gs = w.split("|"); const c = shuffled.find((x) => gs.includes(GROUP[x.k]) && !used.has(GROUP[x.k])); if (c) tryAdd(c); }
    for (const c of shuffled) { if (chosen.length >= tier.n) break; tryAdd(c); }
    if (chosen.length < tier.n) continue;
    const share = sample.filter((it) => chosen.every((c) => checkConstraint(c, it)) && harmony(it).total >= 70).length / sample.length;
    if (share > 0.1) continue;
    const r = score(slots, chosen, seedLook);
    if (r.stars !== 3) throw new Error("seed look not 3 star");
    return { ok: true, attempts: a + 1, ss, chosen, share };
  }
  return { ok: false };
}
const start = new Date("2026-01-01T00:00:00Z");
for (const k of [1, 2, 3, 4, 5]) {
  let fb = 0, att = 0; const bad = [];
  for (let d = 0; d < 365; d++) {
    const dt = new Date(start.getTime() + d * 86400000);
    const wd = (dt.getUTCDay() + 6) % 7;
    const r = generate(1000 + d * 7919 + k, wd, k);
    if (!r.ok) { fb++; bad.push(d); } else att += r.attempts;
  }
  console.log("closet level", k, "fallbacks", fb, "avg attempts", (att / (365 - fb)).toFixed(2));
}
