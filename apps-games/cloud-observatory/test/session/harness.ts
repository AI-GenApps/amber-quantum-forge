import {
  createProfile,
  type Profile,
  type Tutorial,
  withLoreUnlocked,
} from "@web-games/cloud-observatory-core";
import {
  createMemoryAdapter,
  createRng,
  createSettingsStore,
  type MemoryAdapter,
  type StorageAdapter,
} from "@web-games/kit";
import { createProfileStore, PROFILE_KEY } from "../../src/save/profile-store";
import { createFakeClock, type FakeClock } from "../../src/session/clock";
import { createGameSession, type GameSession } from "../../src/session/game-session";
import type { Toast } from "../../src/session/types";
import { createFakeScheduler, type FakeScheduler } from "./helpers";

export const START_MS = Date.UTC(2026, 9, 23, 12, 0, 0);

export interface ProfileSeed {
  game?: Partial<Profile["game"]>;
  stats?: Partial<Profile["stats"]>;
  tutorial?: Partial<Tutorial>;
  profile?: Partial<Omit<Profile, "game" | "stats" | "tutorial">>;
  derivedLore?: boolean;
}

export function seedProfile(seed: ProfileSeed, nowMs = START_MS): Profile {
  const base = createProfile(nowMs);
  const built: Profile = {
    ...base,
    ...seed.profile,
    game: { ...base.game, ...seed.game },
    stats: { ...base.stats, ...seed.stats },
    tutorial: { ...base.tutorial, ...seed.tutorial },
  };
  return seed.derivedLore === false ? built : withLoreUnlocked(built);
}

export interface Harness {
  readonly adapter: MemoryAdapter;
  readonly clock: FakeClock;
  readonly scheduler: FakeScheduler;
  readonly session: GameSession;
  readonly toasts: Toast[];
  pause(): void;
  saved(): Profile;
  savedText(): string | undefined;
}

export interface HarnessOptions {
  readonly seed?: ProfileSeed;
  readonly adapter?: MemoryAdapter;
  readonly storage?: StorageAdapter;
  readonly raw?: string;
  readonly load?: boolean;
  readonly startMs?: number;
}

export async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const adapter = options.adapter ?? createMemoryAdapter();
  if (options.seed) {
    adapter.entries.set(PROFILE_KEY, JSON.stringify({ v: 1, data: seedProfile(options.seed) }));
  }
  if (options.raw !== undefined) adapter.entries.set(PROFILE_KEY, options.raw);
  const storage = options.storage ?? adapter;
  const clock = createFakeClock(options.startMs ?? START_MS);
  const scheduler = createFakeScheduler();
  let pauseListener: (() => void) | null = null;
  const session = createGameSession({
    store: createProfileStore(storage, { now: clock.now }),
    settings: createSettingsStore(storage, "cloud-observatory"),
    clock,
    rng: createRng,
    schedule: scheduler.schedule,
    onPause: (listener) => {
      pauseListener = listener;
      return () => undefined;
    },
  });
  const toasts: Toast[] = [];
  session.subscribe((_snapshot, batch) => void toasts.push(...batch));
  if (options.load !== false) await session.load();
  const savedText = () => adapter.entries.get(PROFILE_KEY);
  return {
    adapter,
    clock,
    scheduler,
    session,
    toasts,
    pause: () => pauseListener?.(),
    saved: () => JSON.parse(savedText() ?? "{}").data as Profile,
    savedText,
  };
}

export function toastKinds(batch: readonly Toast[]): string[] {
  return batch.map((toast) =>
    toast.kind === "chapter"
      ? `chapter:${toast.chapter}`
      : toast.kind === "lore"
        ? `lore:${toast.id}`
        : `achievement:${toast.id}`,
  );
}
