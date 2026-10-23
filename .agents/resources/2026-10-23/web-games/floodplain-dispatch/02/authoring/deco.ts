import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";

export function decorate(rec: { layout: string[]; ref: { x: number; y: number }[] }, seed: number): string[] {
  const rows = rec.layout.map((r) => r.split(" "));
  const h = rows.length, w = (rows[0] as string[]).length;
  const rng = createPrng(seed * 2654435 + 17);
  const keep = new Set(rec.ref.map((p) => p.y * w + p.x));
  const dist = new Array(w * h).fill(99);
  let q: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = (rows[y] as string[])[x]!.charAt(0);
    if (ch !== "." && ch !== "T") { dist[y * w + x] = 0; q.push(y * w + x); }
    if (keep.has(y * w + x)) { dist[y * w + x] = 0; q.push(y * w + x); }
  }
  while (q.length) {
    const nq: number[] = [];
    for (const i of q) {
      const x = i % w, y = Math.floor(i / w);
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (dist[j] > (dist[i] as number) + 1) { dist[j] = (dist[i] as number) + 1; nq.push(j); }
      }
    }
    q = nq;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tok = (rows[y] as string[])[x] as string;
    if (tok.charAt(0) !== "." || keep.has(y * w + x)) continue;
    const d = dist[y * w + x] as number;
    const p = d >= 4 ? 0.28 : d === 3 ? 0.16 : d === 2 ? 0.05 : 0;
    if (rng.next() < p) (rows[y] as string[])[x] = `T${tok.charAt(1)}`;
  }
  return rows.map((r) => r.join(" "));
}
