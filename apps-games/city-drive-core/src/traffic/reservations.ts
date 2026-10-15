import type { IntersectionPlan } from "./conflicts";

/**
 * Who holds which turn edge of which intersection. An agent reserves its turn edge before it
 * enters the intersection and releases it when it leaves the edge. Agents on the same edge share
 * it (a platoon); agents on conflicting edges never do.
 */
export class ReservationTable {
  private readonly heldBy = new Map<number, Set<string>>();

  constructor(private readonly plan: IntersectionPlan) {}

  isIntersectionEdge(edgeId: string): boolean {
    return this.plan.tileOf.has(edgeId);
  }

  conflicts(a: string, b: string): boolean {
    return this.plan.conflicts.get(a)?.has(b) ?? false;
  }

  holds(agentId: number, edgeId: string): boolean {
    return this.heldBy.get(agentId)?.has(edgeId) ?? false;
  }

  /** True when no other agent holds an edge that conflicts with `edgeId`. */
  canReserve(agentId: number, edgeId: string): boolean {
    const conflicting = this.plan.conflicts.get(edgeId);
    if (!conflicting) return true;
    for (const [other, edges] of this.heldBy) {
      if (other === agentId) continue;
      for (const held of edges) if (conflicting.has(held)) return false;
    }
    return true;
  }

  reserve(agentId: number, edgeId: string): boolean {
    if (!this.isIntersectionEdge(edgeId)) return true;
    if (!this.canReserve(agentId, edgeId)) return false;
    const set = this.heldBy.get(agentId);
    if (set) set.add(edgeId);
    else this.heldBy.set(agentId, new Set([edgeId]));
    return true;
  }

  release(agentId: number, edgeId: string): void {
    const set = this.heldBy.get(agentId);
    if (!set) return;
    set.delete(edgeId);
    if (set.size === 0) this.heldBy.delete(agentId);
  }

  releaseAll(agentId: number): void {
    this.heldBy.delete(agentId);
  }

  /** Agent ids that currently hold `edgeId`, in ascending order. */
  holders(edgeId: string): number[] {
    const out: number[] = [];
    for (const [agent, edges] of this.heldBy) if (edges.has(edgeId)) out.push(agent);
    return out.sort((a, b) => a - b);
  }

  get size(): number {
    let n = 0;
    for (const edges of this.heldBy.values()) n += edges.size;
    return n;
  }
}
