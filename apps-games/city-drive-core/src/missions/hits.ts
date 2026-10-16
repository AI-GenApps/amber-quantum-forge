import type { CollisionImpulse } from "../physics/world";
import { HIT_COOLDOWN_TICKS, HIT_IMPULSE_NS } from "./constants";

/**
 * Turns the physics contact stream into discrete "hits" on the player's car: a contact with a
 * building, a wall, a parked car or an AI car counts once its impulse passes the threshold, and
 * the rest of the same crash (a short cooldown) is ignored.
 */
export class HitDetector {
  private cooldownUntil = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly carCollider: number,
    private readonly threshold = HIT_IMPULSE_NS,
    private readonly cooldownTicks = HIT_COOLDOWN_TICKS,
  ) {}

  /** Number of new hits among `impulses`, which the caller drained from the physics world. */
  update(impulses: readonly CollisionImpulse[]): number {
    let hits = 0;
    for (const hit of impulses) {
      if (hit.colliderA !== this.carCollider && hit.colliderB !== this.carCollider) continue;
      if (hit.impulse < this.threshold || hit.tick < this.cooldownUntil) continue;
      this.cooldownUntil = hit.tick + this.cooldownTicks;
      hits++;
    }
    return hits;
  }

  reset(): void {
    this.cooldownUntil = Number.NEGATIVE_INFINITY;
  }
}
