import { createMemoryAdapter, localDateKey, type MemoryAdapter } from "@web-games/kit";
import {
  canonicalLink,
  leadClueIds,
  PEOPLE,
  PROFILE_KEY,
  type Profile,
} from "@web-games/lost-parcel-desk-core";
import { type AccuseOutcome, createGameStore, type GameStore } from "../../src/state/game";
import { createProfileStore } from "../../src/state/saveStores";
import type { TickSource } from "../../src/state/ticker";

export interface Rig {
  adapter: MemoryAdapter;
  game: GameStore;
  setNow(value: Date): void;
  emitTick(deltaMs: number): void;
}

export function makeRig(adapter: MemoryAdapter = createMemoryAdapter(), start = "2026-10-23T09:00:00"): Rig {
  let now = new Date(start);
  const listeners = new Set<(deltaMs: number) => void>();
  const tick: TickSource = (listener) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };
  const game = createGameStore({
    store: createProfileStore(adapter),
    clock: () => now,
    localDateKey,
    tick,
  });
  return {
    adapter,
    game,
    setNow: (value) => {
      now = value;
    },
    emitTick: (deltaMs) => {
      for (const listener of [...listeners]) listener(deltaMs);
    },
  };
}

export function envelope(profile: unknown, version = 1): string {
  return JSON.stringify({ v: version, data: profile });
}

export function seedProfile(adapter: MemoryAdapter, profile: Profile): void {
  adapter.entries.set(PROFILE_KEY, envelope(profile));
}

export function storedProfile(adapter: MemoryAdapter): Profile {
  const raw = adapter.entries.get(PROFILE_KEY);
  if (raw === undefined) throw new Error("nothing stored");
  return (JSON.parse(raw) as { data: Profile }).data;
}

export async function openEverything(game: GameStore): Promise<void> {
  const active = game.getState().active;
  if (active === null) throw new Error("no active case");
  for (const object of active.def.objects) {
    await game.inspect(object.id);
    await game.flip(object.id);
  }
  for (const clue of active.def.clues) {
    if (clue.face === "zoom") await game.zoom(clue.id);
  }
  const found = game.getState().active?.state.foundClueIds ?? [];
  for (const clueId of found) await game.pin(clueId);
}

export async function linkCanonical(game: GameStore): Promise<void> {
  const active = game.getState().active;
  if (active === null) throw new Error("no active case");
  for (const clueId of leadClueIds(active.def)) {
    for (const personId of active.def.candidateIds) {
      const kind = canonicalLink(active.def, PEOPLE, clueId, personId);
      if (kind !== null) await game.link(clueId, personId, kind);
    }
  }
}

/** Plays the active case through the store: all clues, canonical links, `wrong` slips, then the owner. */
export async function solveActive(game: GameStore, wrong = 0): Promise<AccuseOutcome> {
  const active = game.getState().active;
  if (active === null) throw new Error("no active case");
  await openEverything(game);
  await linkCanonical(game);
  const decoys = active.def.candidateIds.filter((id) => id !== active.def.ownerId);
  for (const decoyId of decoys.slice(0, wrong)) {
    for (const clueId of leadClueIds(active.def)) await game.link(clueId, decoyId, "fits");
    const slip = await game.accuse(decoyId);
    if (!slip.ok) throw new Error(`slip rejected ${slip.reason}`);
    if (slip.closed) return slip;
  }
  return game.accuse(active.def.ownerId);
}
