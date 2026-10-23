import type { Point } from "../../src/types";

function orientation(a: Point, b: Point, c: Point): number {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (value === 0) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    b.x <= Math.max(a.x, c.x) &&
    b.x >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) &&
    b.y >= Math.min(a.y, c.y)
  );
}

export function segmentsTouch(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  return o4 === 0 && onSegment(p2, q1, q2);
}

export function pathCrossings(stars: readonly Point[], closed: boolean): string[] {
  const edges: [number, number][] = [];
  for (let i = 0; i + 1 < stars.length; i++) edges.push([i, i + 1]);
  if (closed && stars.length > 2) edges.push([stars.length - 1, 0]);
  const found: string[] = [];
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const first = edges[i];
      const second = edges[j];
      if (first === undefined || second === undefined) continue;
      const adjacent = first[1] === second[0] || second[1] === first[0];
      const wraps = closed && i === 0 && j === edges.length - 1;
      if (adjacent || wraps) continue;
      const [a, b] = first;
      const [c, d] = second;
      const pa = stars[a];
      const pb = stars[b];
      const pc = stars[c];
      const pd = stars[d];
      if (pa && pb && pc && pd && segmentsTouch(pa, pb, pc, pd)) {
        found.push(`edge ${a}-${b} touches edge ${c}-${d}`);
      }
    }
  }
  return found;
}

export function boundingBox(stars: readonly Point[]): { long: number; short: number } {
  const xs = stars.map((s) => s.x);
  const ys = stars.map((s) => s.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return { long: Math.max(width, height), short: Math.min(width, height) };
}
