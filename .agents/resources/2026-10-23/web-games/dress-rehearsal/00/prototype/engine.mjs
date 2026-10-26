// Prototype of the Dress Rehearsal rules (scratch only, mirrors product.md).
export const HUES = ["red", "orange", "yellow", "lime", "green", "mint", "teal", "sky", "blue", "violet", "magenta", "pink"];
export const NEUTRALS = ["black", "white", "cream", "grey", "navy", "tan"];
export const WARM = ["pink", "red", "orange", "yellow"];
export const COOL = ["mint", "teal", "sky", "blue", "violet"];
export const ERAS = ["50s", "70s", "90s", "now"];
export const SLOTS = ["top", "bottom", "dress", "outer", "shoes", "bag", "hat", "accessory"];

const hueIdx = (c) => HUES.indexOf(c);
const dist = (a, b) => {
  const d = Math.abs(a - b);
  return Math.min(d, 12 - d);
};

export function schemeScore(items) {
  const hs = [...new Set(items.map((i) => i.colour).filter((c) => HUES.includes(c)))].map(hueIdx);
  if (hs.length === 0) return { name: "Neutral", pts: 34 };
  if (hs.length === 1) return { name: "Tonal", pts: 40 };
  if (hs.length === 2) {
    const d = dist(hs[0], hs[1]);
    if (d <= 2) return { name: "Analogous", pts: 40 };
    if (d === 6) return { name: "Complementary", pts: 40 };
    if (d === 4) return { name: "Triad pair", pts: 32 };
    return { name: "Awkward pair", pts: 20 };
  }
  if (hs.length === 3) {
    const ds = [dist(hs[0], hs[1]), dist(hs[0], hs[2]), dist(hs[1], hs[2])];
    if (ds.every((d) => d === 4)) return { name: "Triadic", pts: 36 };
    if (Math.max(...ds) <= 3) return { name: "Analogous trio", pts: 36 };
    return { name: "Busy", pts: 16 };
  }
  return { name: "Too many colours", pts: 4 };
}

export function harmony(items) {
  const scheme = schemeScore(items);
  const anchor = items.some((i) => NEUTRALS.includes(i.colour)) ? 10 : 0;
  const f = items.map((i) => i.formality);
  const fs = Math.max(...f) - Math.min(...f);
  const dress = fs <= 1 ? 20 : fs === 2 ? 14 : fs === 3 ? 6 : 0;
  const e = items.map((i) => i.era);
  const es = Math.max(...e) - Math.min(...e);
  const era = es <= 1 ? 15 : es === 2 ? 10 : es === 3 ? 4 : 0;
  const w = items.map((i) => i.warmth);
  const ws = Math.max(...w) - Math.min(...w);
  const season = ws <= 1 ? 15 : ws === 2 ? 10 : ws === 3 ? 4 : 0;
  return { total: scheme.pts + anchor + dress + era + season, scheme, anchor, dress, era, season };
}

export function checkConstraint(c, items) {
  const chrom = items.filter((i) => HUES.includes(i.colour));
  switch (c.k) {
    case "warm": return chrom.every((i) => WARM.includes(i.colour));
    case "cool": return chrom.every((i) => COOL.includes(i.colour));
    case "maxHues": return new Set(chrom.map((i) => i.colour)).size <= c.n;
    case "incColour": return items.some((i) => i.colour === c.c);
    case "avoidColour": return !items.some((i) => i.colour === c.c);
    case "eraMin": return items.every((i) => i.era >= c.n);
    case "eraMax": return items.every((i) => i.era <= c.n);
    case "fMin": return items.every((i) => i.formality >= c.n);
    case "fMax": return items.every((i) => i.formality <= c.n);
    case "wMin": return items.reduce((s, i) => s + i.warmth, 0) >= c.n;
    case "wMax": return items.reduce((s, i) => s + i.warmth, 0) <= c.n;
    case "feature": return items.some((i) => i.features.includes(c.f));
    case "maxSpend": return items.reduce((s, i) => s + i.price, 0) <= c.n;
    case "minSpend": return items.reduce((s, i) => s + i.price, 0) >= c.n;
    case "incPiece": return items.some((i) => i.id === c.id);
    case "avoidPiece": return !items.some((i) => i.id === c.id);
    default: throw new Error(c.k);
  }
}

export function isComplete(slots, look) {
  // look: map slot -> item
  const has = (s) => Boolean(look[s]);
  const open = new Set(slots);
  const hasDress = open.has("dress");
  const hasTB = open.has("top") && open.has("bottom");
  for (const s of slots) {
    if (s === "dress" || s === "top" || s === "bottom") continue;
    if (!has(s)) return false;
  }
  if (hasDress && hasTB) return has("dress") ? !has("top") && !has("bottom") : has("top") && has("bottom");
  if (hasDress) return has("dress");
  return has("top") && has("bottom");
}

export function score(slots, constraints, look) {
  const items = Object.values(look).filter(Boolean);
  if (!isComplete(slots, look) || items.length === 0) return { stars: 0, met: 0, h: null };
  const met = constraints.filter((c) => checkConstraint(c, items)).length;
  const h = harmony(items);
  const need = Math.ceil(constraints.length / 2);
  let stars = 0;
  if (met >= need) stars = 1;
  if (met === constraints.length) stars = 2;
  if (stars === 2 && h.total >= 70) stars = 3;
  return { stars, met, h };
}

export function* looks(slots, closet) {
  const by = (cat) => closet.filter((i) => i.category === cat);
  const open = new Set(slots);
  const dressMode = open.has("dress") && open.has("top") && open.has("bottom");
  const others = slots.filter((s) => !["top", "bottom", "dress"].includes(s));
  const baseOptions = [];
  if (dressMode) {
    for (const d of by("dress")) baseOptions.push({ dress: d });
    for (const t of by("top")) for (const b of by("bottom")) baseOptions.push({ top: t, bottom: b });
  } else if (open.has("dress")) {
    for (const d of by("dress")) baseOptions.push({ dress: d });
  } else {
    for (const t of by("top")) for (const b of by("bottom")) baseOptions.push({ top: t, bottom: b });
  }
  function* rec(i, acc) {
    if (i === others.length) {
      yield acc;
      return;
    }
    for (const it of by(others[i])) yield* rec(i + 1, { ...acc, [others[i]]: it });
  }
  for (const base of baseOptions) yield* rec(0, base);
}

export function analyse(slots, constraints, closet) {
  let total = 0;
  const hist = [0, 0, 0, 0];
  const best3 = [];
  let maxH = -1;
  for (const look of looks(slots, closet)) {
    total++;
    const r = score(slots, constraints, look);
    hist[r.stars]++;
    if (r.stars >= 2 && r.h.total > maxH) maxH = r.h.total;
    if (r.stars === 3) {
      if (best3.length < 3) best3.push(look);
    }
  }
  return { total, hist, best3, maxH };
}
