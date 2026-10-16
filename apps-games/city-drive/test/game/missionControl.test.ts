// @vitest-environment node

import { parseCityManifest } from "@city-drive/core/city";
import { afterEach, describe, expect, it } from "vitest";
import { DISTRICT_1_MISSIONS } from "../../src/game/missions";
import { GameSession } from "../../src/game/session";
import { loadDistrict1 } from "../../src/render/district";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "./helpers";

let active: GameSession | undefined;
afterEach(() => {
  active?.dispose();
  active = undefined;
});

async function make(): Promise<GameSession> {
  const manifest = readManifest();
  active = await GameSession.create(
    loadDistrict1(manifest),
    parseCityManifest(manifest),
    new ScriptedInput(),
    undefined,
    { missions: DISTRICT_1_MISSIONS },
  );
  return active;
}

function distanceToMarker(session: GameSession, id: string): number {
  const marker = session.missions?.markers().find((m) => m.missionId === id);
  if (!marker) throw new Error(`no marker ${id}`);
  return Math.hypot(session.state.position.x - marker.x, session.state.position.z - marker.z);
}

describe("openMission / leaveMission (map, retry, next, pause)", () => {
  it("drives to the mission start and opens its briefing", async () => {
    const session = await make();
    session.openMission("d1-m03", false);
    expect(session.missions?.run.phase).toBe("briefing");
    expect(session.missions?.run.mission?.id).toBe("d1-m03");
    expect(distanceToMarker(session, "d1-m03")).toBeLessThan(3);
    expect(session.respawns.at(-1)?.cause).toBe("manual");
  });

  it("with start=true the mission is running at once", async () => {
    const session = await make();
    session.openMission("d1-m01", true);
    expect(session.missions?.run.phase).toBe("active");
    for (let i = 0; i < 30; i++) session.step();
    expect(session.missions?.hud().elapsedS).toBeGreaterThan(0);
  });

  it("restarts a running mission with a fresh clock at the start", async () => {
    const session = await make();
    session.openMission("d1-m01", true);
    for (let i = 0; i < 120; i++) session.step();
    const before = session.missions?.hud().elapsedS ?? 0;
    expect(before).toBeGreaterThan(1.5);
    session.openMission("d1-m01", true);
    expect(session.missions?.run.phase).toBe("active");
    expect(session.missions?.hud().elapsedS).toBe(0);
    expect(distanceToMarker(session, "d1-m01")).toBeLessThan(3);
  });

  it("leaveMission abandons a running mission without a results screen and pays nothing", async () => {
    const session = await make();
    session.openMission("d1-m01", true);
    session.leaveMission();
    expect(session.missions?.run.phase).toBe("idle");
    expect(session.missions?.run.result).toBeUndefined();
    expect(session.missionResults.at(-1)).toMatchObject({ id: "d1-m01", success: false });
  });

  it("leaveMission also closes a briefing and is a no-op in free roam", async () => {
    const session = await make();
    session.leaveMission();
    expect(session.missions?.run.phase).toBe("idle");
    session.openMission("d1-m02", false);
    session.leaveMission();
    expect(session.missions?.run.phase).toBe("idle");
  });

  it("an unknown mission id fails loudly", async () => {
    const session = await make();
    expect(() => session.openMission("d9-m99", false)).toThrow(/unknown mission "d9-m99"/);
  });

  it("missionDef finds the definition", async () => {
    const session = await make();
    expect(session.missionDef("d1-m01")?.type).toBe("delivery");
    expect(session.missionDef("nope")).toBeUndefined();
  });
});
