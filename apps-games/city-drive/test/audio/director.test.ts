import type { ObjectiveKind } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { type FeelContext, FeelDirector } from "../../src/audio/director";
import { EventDeriver } from "../../src/audio/events";
import type { AudioPort, MusicId } from "../../src/audio/manager";
import type { SoundId } from "../../src/audio/manifest";
import type { EngineParams } from "../../src/audio/mapping";
import { COLLISION_COOLDOWN_TICKS } from "../../src/audio/mapping";
import type { StepReport } from "../../src/game/stepReport";
import type { HapticEvent } from "../../src/haptics";
import { hud, playState } from "../ui/fakes";

class FakeAudio implements AudioPort {
  played: [SoundId, number | undefined][] = [];
  engine: (EngineParams | undefined)[] = [];
  skid: number[] = [];
  music: (MusicId | undefined)[] = [];
  ducked: boolean[] = [];
  async unlock(): Promise<void> {}
  setToggles(): void {}
  play(id: SoundId, gain?: number): boolean {
    this.played.push([id, gain]);
    return true;
  }
  setEngine(params: EngineParams | undefined): void {
    this.engine.push(params);
  }
  setSkid(gain: number): void {
    this.skid.push(gain);
  }
  playMusic(id: MusicId | undefined): void {
    this.music.push(id);
  }
  setDucked(ducked: boolean): void {
    this.ducked.push(ducked);
  }
}

const report = (over: Partial<StepReport> = {}): StepReport => ({
  input: { throttle: 0, steer: 0, handbrake: false, reset: false },
  speedKmh: 0,
  slipMps: 0,
  impactNs: 0,
  topSpeedKmh: 115,
  ...over,
});

const LIVE: FeelContext = { driving: true, engineOn: true, missionActive: false };

function setup() {
  const audio = new FakeAudio();
  const buzzes: HapticEvent[] = [];
  const feel = new FeelDirector(audio, { trigger: (e) => void buzzes.push(e) });
  return { audio, buzzes, feel };
}

const active = (done: number, kind: ObjectiveKind = "checkpoint") =>
  playState({
    hud: hud({
      phase: "active",
      missionId: "d1-m01",
      progress: { done, total: 3 },
      objective: { kind, label: "x", x: 0, z: 0, radius: 3, lane: { edgeId: "e", s: 0 } },
    }),
  });

const phase = (p: "briefing" | "success" | "fail" | "results", done = 0) =>
  playState({ hud: hud({ phase: p, missionId: "d1-m01", progress: { done, total: 3 } }) });

describe("engine and skid per step", () => {
  it("drives the engine from speed and throttle while the car is live", () => {
    const { audio, feel } = setup();
    feel.onFrame(undefined, LIVE);
    feel.onStep(
      report({ speedKmh: 60, input: { throttle: 1, steer: 0, handbrake: false, reset: false } }),
    );
    const params = audio.engine.at(-1);
    expect(params?.rpm).toBeGreaterThan(0.5);
    feel.onStep(report({ speedKmh: 60, slipMps: 9 }));
    expect(audio.skid.at(-1)).toBe(1);
  });

  it("silences engine and skid when the car stops being live (menu, pause), and stays quiet", () => {
    const { audio, feel } = setup();
    feel.onFrame(undefined, LIVE);
    feel.onFrame(undefined, { ...LIVE, engineOn: false });
    expect(audio.engine.at(-1)).toBeUndefined();
    expect(audio.skid.at(-1)).toBe(0);
    const before = audio.engine.length;
    feel.onStep(report({ speedKmh: 80 }));
    expect(audio.engine).toHaveLength(before);
  });
});

describe("collisions", () => {
  it("plays a thud sized by impulse and buzzes once", () => {
    const { audio, buzzes, feel } = setup();
    feel.onFrame(undefined, LIVE);
    feel.onStep(report({ impactNs: 3000 }));
    expect(audio.played).toEqual([["collision_heavy", expect.any(Number)]]);
    expect(buzzes).toEqual(["collision"]);
  });

  it("ignores soft touches", () => {
    const { audio, buzzes, feel } = setup();
    feel.onStep(report({ impactNs: 20 }));
    expect(audio.played).toEqual([]);
    expect(buzzes).toEqual([]);
  });

  it("treats a crash that lasts several steps as one thud", () => {
    const { audio, buzzes, feel } = setup();
    for (let i = 0; i < COLLISION_COOLDOWN_TICKS; i++) feel.onStep(report({ impactNs: 1500 }));
    expect(audio.played).toHaveLength(1);
    feel.onStep(report({ impactNs: 1500 }));
    expect(audio.played).toHaveLength(2);
    expect(buzzes).toEqual(["collision", "collision"]);
  });
});

describe("mission events", () => {
  it("sounds and buzzes a checkpoint, a pickup and the end of a mission", () => {
    const { audio, buzzes, feel } = setup();
    feel.onFrame(phase("briefing"), LIVE);
    feel.onFrame(active(0, "pickup"), LIVE);
    feel.onFrame(active(1, "dropoff"), LIVE);
    feel.onFrame(active(2, "checkpoint"), LIVE);
    feel.onFrame(phase("success", 3), LIVE);
    expect(audio.played.map(([id]) => id)).toEqual(["pickup", "checkpoint", "success"]);
    expect(buzzes).toEqual(["pickup", "checkpoint", "success"]);
  });

  it("plays the fail sting with the error buzz", () => {
    const { audio, buzzes, feel } = setup();
    feel.onFrame(active(0), LIVE);
    feel.onFrame(phase("fail"), LIVE);
    expect(audio.played.map(([id]) => id)).toEqual(["fail"]);
    expect(buzzes).toEqual(["fail"]);
  });

  it("does not repeat an event while the state holds", () => {
    const { audio, feel } = setup();
    feel.onFrame(active(0), LIVE);
    for (let i = 0; i < 20; i++) feel.onFrame(active(1), LIVE);
    feel.onFrame(phase("success", 3), LIVE);
    for (let i = 0; i < 20; i++) feel.onFrame(phase("results", 3), LIVE);
    expect(audio.played.map(([id]) => id)).toEqual(["checkpoint", "success"]);
  });
});

describe("music", () => {
  it("plays menu music outside the drive and drive music in it, ducked during a mission", () => {
    const { audio, feel } = setup();
    feel.onFrame(undefined, { driving: false, engineOn: false, missionActive: false });
    expect(audio.music.at(-1)).toBe("music_menu");
    expect(audio.ducked.at(-1)).toBe(false);
    feel.onFrame(playState(), LIVE);
    expect(audio.music.at(-1)).toBe("music_drive");
    expect(audio.ducked.at(-1)).toBe(false);
    feel.onFrame(active(0), { ...LIVE, missionActive: true });
    expect(audio.ducked.at(-1)).toBe(true);
    feel.onFrame(active(0), { driving: true, engineOn: false, missionActive: true });
    expect(audio.music.at(-1)).toBe("music_drive");
  });
});

describe("horn and UI taps", () => {
  it("play their own sounds", () => {
    const { audio, feel } = setup();
    feel.horn();
    feel.uiTap();
    expect(audio.played.map(([id]) => id)).toEqual(["horn", "ui_tap"]);
  });
});

describe("EventDeriver", () => {
  it("emits nothing for a new mission's first frame, a paused HUD or no HUD at all", () => {
    const events = new EventDeriver();
    expect(events.next(undefined)).toEqual([]);
    expect(events.next(active(2).hud)).toEqual([]);
    expect(events.next(active(2).hud)).toEqual([]);
  });

  it("does not turn a restart into a checkpoint", () => {
    const events = new EventDeriver();
    events.next(active(2).hud);
    const restarted = { ...active(0).hud, missionId: "d1-m02" };
    expect(events.next(restarted)).toEqual([]);
    expect(events.next(active(1).hud)).toEqual([]);
  });
});
