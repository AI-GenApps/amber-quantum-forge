import {
  BOONS,
  CONSTELLATIONS,
  INSTRUMENTS,
  pendingShards,
  UPGRADES,
} from "@web-games/cloud-observatory-core";
import type { Harness } from "../session/harness";

export interface BotTally {
  eclipses: number;
  charts: number;
  comets: number;
  boons: number;
  purchases: number;
}

export const newTally = (): BotTally => ({
  eclipses: 0,
  charts: 0,
  comets: 0,
  boons: 0,
  purchases: 0,
});

const ECLIPSE_AT_SHARDS = 25;
const BOONS_BY_COST = [...BOONS].sort((a, b) => a.cost - b.cost);
const INSTRUMENTS_DESCENDING = [...INSTRUMENTS].reverse();

function shop(h: Harness, tally: BotTally): void {
  for (const upgrade of UPGRADES) {
    if (h.session.buyUpgrade(upgrade.id).ok) tally.purchases += 1;
  }
  for (const instrument of INSTRUMENTS_DESCENDING) {
    if (h.session.buyInstrument(instrument.id, "max").ok) tally.purchases += 1;
  }
}

function chartEverything(h: Harness, tally: BotTally): void {
  for (const constellation of CONSTELLATIONS) {
    if (h.session.snapshot().profile.game.charted.includes(constellation.id)) continue;
    if (!h.session.startChart(constellation.id).ok) continue;
    constellation.stars.forEach((_star, index) => void h.session.tapStar(index));
    if (h.session.finishChart().ok) tally.charts += 1;
    else h.session.abandonChart();
  }
}

function buyBoons(h: Harness, tally: BotTally): void {
  for (const boon of BOONS_BY_COST) {
    if (h.session.buyBoon(boon.id).ok) tally.boons += 1;
  }
}

/**
 * Plays like a steady player: ticks 30 s at a time, taps now and then, shops, charts, claims the
 * Comet, and falls into an Eclipse once 25 shards are pending.
 */
export function playFor(h: Harness, seconds: number, tally: BotTally = newTally()): BotTally {
  const step = 30;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    h.clock.advance(step * 1000);
    h.session.tick(step);
    h.session.gather();
    shop(h, tally);
    chartEverything(h, tally);
    if (h.session.cometStatus() === "ready" && h.session.claimComet().ok) tally.comets += 1;
    if (pendingShards(h.session.snapshot().profile.game.cycleStarlight) >= ECLIPSE_AT_SHARDS) {
      if (!h.session.eclipse().ok) continue;
      tally.eclipses += 1;
      buyBoons(h, tally);
    }
  }
  return tally;
}
