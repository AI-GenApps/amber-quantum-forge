import type { RoadGraph } from "./graph";

export interface Route {
  nodeIds: string[];
  edgeIds: string[];
  /** Total length in metres. */
  length: number;
}

interface Entry {
  id: string;
  f: number;
}

/** Binary min-heap ordered by f, then node id, so equal-cost ties resolve identically every run. */
class OpenSet {
  private readonly items: Entry[] = [];

  get size(): number {
    return this.items.length;
  }

  private less(a: Entry, b: Entry): boolean {
    return a.f < b.f || (a.f === b.f && a.id < b.id);
  }

  push(entry: Entry): void {
    const items = this.items;
    items.push(entry);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(items[i] as Entry, items[parent] as Entry)) break;
      [items[i], items[parent]] = [items[parent] as Entry, items[i] as Entry];
      i = parent;
    }
  }

  pop(): Entry | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (last && items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && this.less(items[l] as Entry, items[m] as Entry)) m = l;
        if (r < items.length && this.less(items[r] as Entry, items[m] as Entry)) m = r;
        if (m === i) break;
        [items[i], items[m]] = [items[m] as Entry, items[i] as Entry];
        i = m;
      }
    }
    return top;
  }
}

/** Shortest route by length between two graph nodes (A*, straight-line heuristic). */
export function findRoute(graph: RoadGraph, fromId: string, toId: string): Route | undefined {
  const from = graph.nodes.get(fromId);
  const to = graph.nodes.get(toId);
  if (!from) throw new Error(`findRoute: unknown start node "${fromId}"`);
  if (!to) throw new Error(`findRoute: unknown goal node "${toId}"`);
  const heuristic = (id: string): number => {
    const n = graph.nodes.get(id);
    return n ? Math.sqrt((n.x - to.x) ** 2 + (n.z - to.z) ** 2) : 0;
  };
  const best = new Map<string, number>([[fromId, 0]]);
  const cameFrom = new Map<string, string>();
  const open = new OpenSet();
  const closed = new Set<string>();
  open.push({ id: fromId, f: heuristic(fromId) });
  while (open.size > 0) {
    const current = open.pop() as Entry;
    if (closed.has(current.id)) continue;
    if (current.id === toId) return reconstruct(graph, cameFrom, toId, best.get(toId) ?? 0);
    closed.add(current.id);
    const g = best.get(current.id) ?? 0;
    for (const edgeId of graph.nodes.get(current.id)?.outEdges ?? []) {
      const edge = graph.edges.get(edgeId);
      if (!edge || closed.has(edge.to)) continue;
      const next = g + edge.length;
      if (next < (best.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        best.set(edge.to, next);
        cameFrom.set(edge.to, edgeId);
        open.push({ id: edge.to, f: next + heuristic(edge.to) });
      }
    }
  }
  return undefined;
}

function reconstruct(
  graph: RoadGraph,
  cameFrom: Map<string, string>,
  goal: string,
  length: number,
): Route {
  const nodeIds = [goal];
  const edgeIds: string[] = [];
  let cursor = goal;
  for (;;) {
    const edgeId = cameFrom.get(cursor);
    if (edgeId === undefined) break;
    const edge = graph.edges.get(edgeId);
    if (!edge) break;
    edgeIds.push(edgeId);
    nodeIds.push(edge.from);
    cursor = edge.from;
  }
  return { nodeIds: nodeIds.reverse(), edgeIds: edgeIds.reverse(), length };
}
