import type { RoadGraph } from "./graph";

function reach(graph: RoadGraph, startId: string, forward: boolean): Set<string> {
  const seen = new Set<string>([startId]);
  const stack = [startId];
  while (stack.length > 0) {
    const node = graph.nodes.get(stack.pop() as string);
    if (!node) continue;
    for (const edgeId of forward ? node.outEdges : node.inEdges) {
      const edge = graph.edges.get(edgeId);
      const next = edge ? (forward ? edge.to : edge.from) : undefined;
      if (next !== undefined && !seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen;
}

/** True when every node can reach every other node. An empty graph counts as connected. */
export function isStronglyConnected(graph: RoadGraph): boolean {
  const first = graph.nodeList[0];
  if (!first) return true;
  const total = graph.nodeList.length;
  return (
    reach(graph, first.id, true).size === total && reach(graph, first.id, false).size === total
  );
}

/** Nodes with no way in or no way out: lanes that traffic could not enter or leave. */
export function findDeadEnds(graph: RoadGraph): string[] {
  return graph.nodeList
    .filter((n) => n.inEdges.length === 0 || n.outEdges.length === 0)
    .map((n) => n.id);
}
