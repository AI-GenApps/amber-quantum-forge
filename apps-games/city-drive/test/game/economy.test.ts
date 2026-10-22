// @vitest-environment node
import {
  dailyChallenge,
  MAX_LEVELS,
  MemorySaveStore,
  quatFromForward,
  SaveManager,
  upgradedSpec,
} from "@city-drive/core";
import { parseCityManifest } from "@city-drive/core/city";
import { afterEach, describe, expect, it } from "vitest";
import { Autopilot } from "../../../city-drive-core/test/support/autopilot";
import { allMissionDefs } from "../../src/game/daily";
import { DISTRICT_1_MISSIONS } from "../../src/game/missions";
import { GameSession } from "../../src/game/session";
import { loadDistrict1 } from "../../src/render/district";
import { Profile, ROSTER } from "../../src/save";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "./helpers";

let active: GameSession | undefined;
afterEach(() => {
  active?.dispose();
  active = undefined;
});

async function make(store = new MemorySaveStore(), selected?: string) {
  const manager = new SaveManager(store, { starterCarId: ROSTER.starter, debounceMs: 1 });
  const profile = await Profile.load(manager, ROSTER);
  if (selected)
    manager.commit({ ...manager.data, owned_cars: ["sedan", selected], selected_car: selected });
  const input = new ScriptedInput();
  const manifest = readManifest();
  const session = await GameSession.create(
    loadDistrict1(manifest),
    parseCityManifest(manifest),
    input,
    undefined,
    { missions: DISTRICT_1_MISSIONS, profile },
  );
  active = session;
  return { session, input, profile, manager, store };
}

function play(session: GameSession, input: ScriptedInput, id: string) {
  const sys = session.missions;
  const marker = sys?.markers().find((m) => m.missionId === id);
  if (!sys || !marker) throw new Error(`no marker ${id}`);
  session.car.respawn({ position: { x: marker.x + 300, y: 1.1, z: marker.z } });
  session.step();
  session.car.respawn({
    position: { x: marker.x, y: 1.1, z: marker.z },
    rotation: quatFromForward(-1, 0),
  });
  for (let i = 0; i < 60; i++) session.step();
  sys.accept();
  const pilot = new Autopilot();
  for (let i = 0; i < 60 * 100 && sys.run.phase === "active"; i++) {
    const drive = pilot.drive(session.state, sys.route, sys.objective);
    input.set({ throttle: drive.throttle, steer: drive.steer, handbrake: drive.handbrake });
    session.step();
  }
}

describe("session economy", () => {
  it("spawns the starter car for a new player", async () => {
    const { session } = await make();
    expect(session.car.spec.id).toBe("sedan");
  });

  it("spawns the selected car with its own handling", async () => {
    const { session } = await make(undefined, "racer");
    expect(session.car.spec).toMatchObject({ id: "racer", mass: 1000 });
  });

  it("spawns the selected car with its upgrades applied", async () => {
    const store = new MemorySaveStore();
    const manager = new SaveManager(store, { starterCarId: ROSTER.starter, debounceMs: 1 });
    const profile = await Profile.load(manager, ROSTER);
    manager.commit({ ...manager.data, upgrades: { sedan: { power: 3, grip: 3, brakes: 3 } } });
    const manifest = readManifest();
    const session = await GameSession.create(
      loadDistrict1(manifest),
      parseCityManifest(manifest),
      new ScriptedInput(),
      undefined,
      { profile },
    );
    active = session;
    const stock = profile.roster.cars[0];
    if (!stock) throw new Error("empty roster");
    expect(session.car.spec).toMatchObject({
      id: "sedan",
      engineForce: upgradedSpec(stock, MAX_LEVELS).engineForce,
      brakeForce: upgradedSpec(stock, MAX_LEVELS).brakeForce,
    });
    expect(session.car.spec.engineForce).toBeGreaterThan(6000);
  });

  it("an explicit spec still wins over the profile", async () => {
    const manager = new SaveManager(new MemorySaveStore(), { starterCarId: "sedan" });
    const profile = await Profile.load(manager, ROSTER);
    const manifest = readManifest();
    const { BASELINE_CAR } = await import("@city-drive/core");
    const session = await GameSession.create(
      loadDistrict1(manifest),
      parseCityManifest(manifest),
      new ScriptedInput(),
      BASELINE_CAR,
      { profile },
    );
    active = session;
    expect(session.car.spec.id).toBe("baseline");
  });

  it("credits coins the moment a mission succeeds, and saves them", async () => {
    const { session, input, profile, manager, store } = await make();
    play(session, input, "d1-m01");
    expect(session.missions?.run.phase).toBe("success");
    const reward = session.missions?.run.result?.coins ?? 0;
    expect(reward).toBeGreaterThan(0);
    expect(profile.coins).toBe(reward);
    expect(session.lastPayout).toMatchObject({
      missionId: "d1-m01",
      coins: reward,
      firstClear: true,
    });
    expect(profile.save.missions["d1-m01"]?.stars).toBe(session.missions?.run.result?.stars);

    session.advanceMission();
    session.advanceMission();
    expect(profile.coins).toBe(reward);

    await manager.flush();
    const again = await make(store);
    expect(again.profile.coins).toBe(reward);
  });

  it("a replay pays only the bonus when the stars do not improve", async () => {
    const { session, input, profile } = await make();
    play(session, input, "d1-m01");
    const first = profile.coins;
    session.advanceMission();
    session.advanceMission();
    play(session, input, "d1-m01");
    const gained = profile.coins - first;
    expect(gained).toBe(session.lastPayout?.coins);
    expect(gained).toBeLessThanOrEqual(4 + 56);
    expect(session.lastPayout?.firstClear).toBe(false);
  });

  it("a quit mission pays nothing and does not touch the save", async () => {
    const { session, profile, manager } = await make();
    const marker = session.missions?.markers()[0];
    if (!marker) throw new Error("no marker");
    session.car.respawn({
      position: { x: marker.x, y: 1.1, z: marker.z },
      rotation: quatFromForward(-1, 0),
    });
    for (let i = 0; i < 60; i++) session.step();
    session.missions?.accept();
    session.missions?.quit();
    session.step();
    expect(profile.coins).toBe(0);
    expect(session.lastPayout?.coins).toBe(0);
    expect(manager.hasUnsavedChanges).toBe(false);
  });

  it("works without a profile, as before", async () => {
    const manifest = readManifest();
    const session = await GameSession.create(
      loadDistrict1(manifest),
      parseCityManifest(manifest),
      new ScriptedInput(),
      undefined,
      { missions: DISTRICT_1_MISSIONS },
    );
    active = session;
    expect(session.car.spec.id).toBe("baseline");
    expect(session.lastPayout).toBeUndefined();
    for (let i = 0; i < 10; i++) session.step();
  });

  describe("daily challenge", () => {
    const mission = allMissionDefs().find((m) => m.id === "d1-m01");

    function challengeFor(date: string, daily: { last_claim_date: string | null; streak: number }) {
      if (!mission) throw new Error("no d1-m01");
      return dailyChallenge(date, [mission], daily);
    }

    function drive(session: GameSession, input: ScriptedInput) {
      const sys = session.missions;
      if (!sys) throw new Error("no missions");
      for (let i = 0; i < 60; i++) session.step();
      const pilot = new Autopilot();
      for (let i = 0; i < 60 * 100 && sys.run.phase === "active"; i++) {
        const move = pilot.drive(session.state, sys.route, sys.objective);
        input.set({ throttle: move.throttle, steer: move.steer, handbrake: move.handbrake });
        session.step();
      }
    }

    it("pays the daily reward for the stars earned and leaves the mission record alone", async () => {
      const { session, input, profile } = await make();
      session.openDaily(challengeFor("2026-10-15", profile.save.daily), true);
      expect(session.dailyRun).toEqual({ date: "2026-10-15", missionId: "d1-m01" });
      drive(session, input);
      expect(session.missions?.run.phase).toBe("success");
      const stars = session.missions?.run.result?.stars ?? 0;
      expect(stars).toBeGreaterThan(0);
      expect(session.lastDaily).toMatchObject({ claimed: true, streak: 1, stars });
      expect(profile.coins).toBe(session.lastDaily?.coins);
      expect(profile.coins).toBe([0, 40, 80, 150][stars]);
      expect(profile.save.missions["d1-m01"]).toBeUndefined();
      expect(profile.save.daily).toEqual({ last_claim_date: "2026-10-15", streak: 1 });
      expect(session.lastPayout).toBeUndefined();
    });

    it("a quit daily pays nothing and leaves the day open", async () => {
      const { session, profile } = await make();
      session.openDaily(challengeFor("2026-10-15", profile.save.daily), true);
      for (let i = 0; i < 30; i++) session.step();
      session.leaveMission();
      expect(session.dailyRun).toBeUndefined();
      expect(profile.coins).toBe(0);
      expect(profile.save.daily.last_claim_date).toBeNull();
    });

    it("opening the plain mission afterwards ends the daily run", async () => {
      const { session, profile } = await make();
      session.openDaily(challengeFor("2026-10-15", profile.save.daily), false);
      session.openMission("d1-m01", false);
      expect(session.dailyRun).toBeUndefined();
    });

    it("refuses a daily mission from another district", async () => {
      const { session, profile } = await make();
      const other = allMissionDefs().find((m) => m.district === "district-2");
      if (!other) throw new Error("no district-2 mission");
      const challenge = dailyChallenge("2026-10-15", [other], profile.save.daily);
      expect(() => session.openDaily(challenge, false)).toThrow(/not in this district/);
    });
  });
});
