import {
  type DailyChallenge,
  type GraphicsQuality,
  MemorySaveStore,
  type MissionDef,
  type MissionHud,
  type MissionResult,
  parseProgression,
  SaveManager,
} from "@city-drive/core";
import { allMissionDefs } from "../../src/game/daily";
import { DISTRICT_MISSIONS, PROGRESSION_RAW } from "../../src/game/missions";
import { LastDistrict, Profile, ROSTER } from "../../src/save";
import { AppController } from "../../src/ui/controller";
import { type MissionSummary, summarizeMission } from "../../src/ui/model/districts";
import type { MinimapModel } from "../../src/ui/model/minimap";
import { OnboardingFlow } from "../../src/ui/onboarding";
import type { PlayState, UiContent, UiGame } from "../../src/ui/types";

export const progression = parseProgression(PROGRESSION_RAW);

export const missionSummaries: Record<string, MissionSummary[]> = Object.fromEntries(
  Object.entries(DISTRICT_MISSIONS).map(([id, files]) => [id, files.map(summarizeMission)]),
);

export function missionOfType(type: MissionDef["type"]): MissionDef {
  const found = Object.values(DISTRICT_MISSIONS)
    .flat()
    .find((m) => (m as MissionDef).type === type);
  if (!found) throw new Error(`no ${type} mission`);
  return found as MissionDef;
}

export function hud(over: Partial<MissionHud> = {}): MissionHud {
  return {
    phase: "idle",
    missionId: undefined,
    title: undefined,
    objective: undefined,
    progress: { done: 0, total: 0 },
    elapsedS: 0,
    timeLeftS: 0,
    damage: 0,
    comfort: null,
    paused: false,
    ...over,
  };
}

export function result(over: Partial<MissionResult> = {}): MissionResult {
  return {
    id: "d1-m01",
    success: true,
    stars: 2,
    time: 61.5,
    damage: 1,
    comfort: null,
    coins: 80,
    ...over,
  };
}

export function playState(over: Partial<PlayState> = {}): PlayState {
  return {
    speedKmh: 42.4,
    hud: hud(),
    mission: undefined,
    result: undefined,
    payout: undefined,
    daily: undefined,
    dailyPayout: undefined,
    parkHold: undefined,
    player: { position: { x: 0, z: 0 }, forward: { x: 0, z: 1 } },
    markers: [],
    ...over,
  };
}

export const MINIMAP: MinimapModel = {
  roads: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
  ],
  tileSize: 10,
  minX: -5,
  maxX: 15,
  minZ: -5,
  maxZ: 5,
};

/** A UiGame that records what the UI asked and serves a scripted PlayState. */
export class FakeGame implements UiGame {
  id: string | undefined;
  loads: string[] = [];
  calls: string[] = [];
  previews: string[] = [];
  graphics: GraphicsQuality[] = [];
  paused = true;
  garageOpen = false;
  state: PlayState = playState();
  failLoad: Error | undefined;

  districtId(): string | undefined {
    return this.id;
  }

  async loadDistrict(id: string): Promise<void> {
    if (this.failLoad) throw this.failLoad;
    this.id = id;
    this.loads.push(id);
  }

  snapshot(): PlayState | undefined {
    return this.id === undefined ? undefined : this.state;
  }

  minimapModel(): MinimapModel | undefined {
    return this.id === undefined ? undefined : MINIMAP;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setGarageOpen(open: boolean): void {
    this.garageOpen = open;
  }

  async previewCar(carId: string): Promise<void> {
    this.previews.push(carId);
  }

  applyGraphics(quality: GraphicsQuality): void {
    this.graphics.push(quality);
  }

  mission = {
    accept: () => void this.calls.push("accept"),
    decline: () => void this.calls.push("decline"),
    leave: () => void this.calls.push("leave"),
    open: (id: string, start: boolean) => void this.calls.push(`open:${id}:${start}`),
    openDaily: (challenge: DailyChallenge, start: boolean) => {
      this.calls.push(`daily:${challenge.missionId}:${start}`);
      this.dailyOpened.push(challenge);
    },
  };
  dailyOpened: DailyChallenge[] = [];
}

export async function makeApp(
  options: { coins?: number; stars?: number; onboarding?: boolean; today?: string } = {},
) {
  const clock = { date: options.today ?? "2026-10-15" };
  const store = new MemorySaveStore();
  const manager = new SaveManager(store, { starterCarId: ROSTER.starter, debounceMs: 1 });
  const profile = await Profile.load(manager, ROSTER);
  if (options.coins !== undefined || options.stars !== undefined) {
    const stars = options.stars ?? 0;
    const missions = Object.fromEntries(
      (missionSummaries["district-1"] ?? [])
        .slice(0, Math.ceil(stars / 3))
        .map((m, i, all) => [
          m.id,
          { stars: i === all.length - 1 ? stars - i * 3 || 3 : 3, best_time_s: 30 },
        ]),
    );
    manager.commit({
      ...manager.data,
      coins: options.coins ?? 0,
      missions: missions as never,
    });
  }
  const game = new FakeGame();
  const lastDistrict = new LastDistrict(store, "district-1");
  const horns = { count: 0 };
  const firstMissionId = missionSummaries["district-1"]?.[0]?.id ?? "d1-m01";
  const onboarding = options.onboarding
    ? new OnboardingFlow({
        flag: (name) => profile.flag(name),
        setFlag: (name, value) => profile.setFlag(name, value),
        hasProgress: () => profile.hasMissionRecords(),
        openMission: (id) => game.mission.open(id, false),
        firstMissionId,
      })
    : undefined;
  const controller = new AppController({
    game,
    profile,
    roster: ROSTER,
    progression,
    missions: missionSummaries,
    lastDistrict,
    onboarding,
    horn: () => void horns.count++,
    daily: { missions: allMissionDefs(), today: () => clock.date },
  });
  const content: UiContent = {
    roster: ROSTER,
    progression,
    missions: missionSummaries,
    showTouch: true,
  };
  return {
    controller,
    game,
    profile,
    manager,
    store,
    lastDistrict,
    content,
    onboarding,
    horns,
    clock,
  };
}

/** Lets Preact flush its queued renders and any pending promises. */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
