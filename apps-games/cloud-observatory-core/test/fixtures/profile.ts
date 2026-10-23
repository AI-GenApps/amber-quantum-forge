import { CATALOG } from "../../src/content/catalog";
import { LORE } from "../../src/content/lore";
import { createProfile, type Profile } from "../../src/profile";
import type { Stats } from "../../src/progression";
import type { GameState } from "../../src/types";

export interface ProfilePatch {
  readonly game?: Partial<GameState>;
  readonly stats?: Partial<Stats>;
  readonly profile?: Partial<Omit<Profile, "game" | "stats">>;
}

export function profileWith(patch: ProfilePatch = {}): Profile {
  const base = createProfile(1_000_000, CATALOG);
  return {
    ...base,
    ...patch.profile,
    game: { ...base.game, ...patch.game },
    stats: { ...base.stats, ...patch.stats },
  };
}

export const ALL_LORE_IDS: readonly string[] = LORE.map((entry) => entry.id);

export const ALL_CONSTELLATION_IDS: readonly string[] = CATALOG.constellations.map((c) => c.id);

export const HOUR_MS = 3_600_000;
