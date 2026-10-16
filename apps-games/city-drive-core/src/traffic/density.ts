import type { TrafficAgent } from "./agent";
import { VIEW_HALF_COS } from "./constants";
import { inView, type TrafficPlayer } from "./player";

/**
 * The agent to remove when the cap has been lowered below the live count. Cars the player cannot
 * see go first, then the farthest, then the lowest id, so the choice is deterministic and a car in
 * front of the player is the last to vanish. Undefined while the count fits the cap.
 */
export function surplusAgent(
  agents: readonly TrafficAgent[],
  player: TrafficPlayer,
  cap: number,
): TrafficAgent | undefined {
  if (agents.length <= cap) return undefined;
  let worst: TrafficAgent | undefined;
  let worstKey = Number.NEGATIVE_INFINITY;
  for (const agent of agents) {
    const hidden = !inView(player, agent.x, agent.z, VIEW_HALF_COS);
    const key = (hidden ? 1e6 : 0) + Math.hypot(agent.x - player.x, agent.z - player.z);
    if (key > worstKey || (key === worstKey && worst && agent.id < worst.id)) {
      worst = agent;
      worstKey = key;
    }
  }
  return worst;
}
