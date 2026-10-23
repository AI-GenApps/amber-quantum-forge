import { HUES, WARM, COOL, harmony, checkConstraint, isComplete, looks, score } from "./engine.mjs";
export function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const GROUP = { warm: "palette", cool: "palette", maxHues: "palette", incColour: "palette", avoidColour: "palette",
  eraMin: "era", eraMax: "era", fMin: "formality", fMax: "formality", wMin: "weather", wMax: "weather", feature: "feature",
  maxSpend: "budget", minSpend: "budget", incPiece: "piece", avoidPiece: "piece" };
export function candidatesFor(items, closet, rnd) {
  const out = [];
  const chrom = items.filter((i) => HUES.includes(i.colour));
  const cols = [...new Set(chrom.map((i) => i.colour))];
  if (chrom.length && chrom.every((i) => WARM.includes(i.colour))) out.push({ k: "warm" });
  if (chrom.length && chrom.every((i) => COOL.includes(i.colour))) out.push({ k: "cool" });
  if (cols.length <= 2) out.push({ k: "maxHues", n: cols.length });
  for (const c of cols) out.push({ k: "incColour", c });
  const present = new Set(items.map((i) => i.colour));
  for (const c of new Set(closet.map((i) => i.colour))) if (!present.has(c)) out.push({ k: "avoidColour", c });
  const eras = items.map((i) => i.era); const emin = Math.min(...eras), emax = Math.max(...eras);
  if (emin > 0) out.push({ k: "eraMin", n: emin });
  if (emax < 3) out.push({ k: "eraMax", n: emax });
  const f = items.map((i) => i.formality); const fmin = Math.min(...f), fmax = Math.max(...f);
  if (fmin > 1) out.push({ k: "fMin", n: fmin });
  if (fmax < 5) out.push({ k: "fMax", n: fmax });
  const w = items.reduce((s, i) => s + i.warmth, 0);
  out.push({ k: "wMin", n: Math.max(1, w - (rnd() < 0.5 ? 0 : 1)) });
  out.push({ k: "wMax", n: w + (rnd() < 0.5 ? 0 : 1) });
  for (const ft of new Set(items.flatMap((i) => i.features))) out.push({ k: "feature", f: ft });
  const p = items.reduce((s, i) => s + i.price, 0);
  out.push({ k: "maxSpend", n: Math.ceil((p + 5) / 10) * 10 });
  out.push({ k: "minSpend", n: Math.floor((p - 5) / 10) * 10 });
  const ids = new Set(items.map((i) => i.id));
  for (const i of items) out.push({ k: "incPiece", id: i.id });
  for (const i of closet) if (!ids.has(i.id) && items.some((x) => x.category === i.category)) out.push({ k: "avoidPiece", id: i.id });
  return out;
}
export function pickConstraints(cands, n, rnd, avoidGroups = []) {
  const shuffled = [...cands].sort(() => rnd() - 0.5);
  const chosen = []; const used = new Set(avoidGroups);
  for (const c of shuffled) {
    const g = GROUP[c.k];
    if (used.has(g)) continue;
    used.add(g); chosen.push(c);
    if (chosen.length === n) break;
  }
  return chosen;
}
