import {
  type AudioManager,
  createAudioManager,
  createFakeAudioContext,
  type FakeContext,
} from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { type AudioEngine, createAudioEngine } from "../src/audio/engine";
import { AUDIO_SLOTS, loadableSlots } from "../src/audio/slots";

interface Rig {
  engine: AudioEngine;
  sfxCtx: FakeContext;
  ambienceCtx: FakeContext;
  requests: string[];
  target: EventTarget;
}

function makeRig(): Rig {
  const sfxCtx = createFakeAudioContext();
  const ambienceCtx = createFakeAudioContext();
  const requests: string[] = [];
  const fetchBuffer = async (url: string): Promise<ArrayBuffer> => {
    requests.push(url);
    return new ArrayBuffer(16);
  };
  const manager = (ctx: FakeContext): AudioManager =>
    createAudioManager({ createContext: () => ctx, fetchBuffer });
  const engine = createAudioEngine({ sfx: manager(sfxCtx), ambience: manager(ambienceCtx) });
  return { engine, sfxCtx, ambienceCtx, requests, target: new EventTarget() };
}

const settle = async (): Promise<void> => {
  for (let i = 0; i < 60; i++) await Promise.resolve();
};

async function gesture(rig: Rig): Promise<void> {
  rig.target.dispatchEvent(new Event("pointerdown"));
  await settle();
}

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const clean of cleanups.splice(0)) clean();
});

async function unlocked(): Promise<Rig> {
  const rig = makeRig();
  cleanups.push(rig.engine.start(rig.target));
  await gesture(rig);
  return rig;
}

describe("audio engine", () => {
  it("plays nothing before the first gesture", async () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    expect(rig.engine.play("ui-tap")).toBe(false);
    rig.engine.setScene("menu");
    expect(rig.sfxCtx.sources).toHaveLength(0);
    expect(rig.sfxCtx.resumeCalls).toBe(0);
    expect(rig.requests).toHaveLength(0);
    expect(rig.engine.progress).toBe(0);
  });

  it("unlocks both contexts and loads every file once on the first gesture", async () => {
    const rig = await unlocked();
    expect(rig.sfxCtx.state).toBe("running");
    expect(rig.ambienceCtx.state).toBe("running");
    const expected = loadableSlots().map((slot) => `/audio/${slot.file}`);
    expect([...rig.requests].sort()).toEqual([...expected].sort());
    expect(rig.sfxCtx.decoded).toHaveLength(26);
    expect(rig.ambienceCtx.decoded).toHaveLength(1);
    expect(rig.engine.progress).toBe(1);
    await gesture(rig);
    expect(rig.requests).toHaveLength(27);
  });

  it("reports load progress from 0 up to 1", async () => {
    const rig = makeRig();
    const seen: number[] = [];
    rig.engine.onProgress((value) => seen.push(value));
    cleanups.push(rig.engine.start(rig.target));
    await gesture(rig);
    expect(seen[0]).toBe(0);
    expect(seen.at(-1)).toBe(1);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    expect(seen).toHaveLength(29);
  });

  it("plays a sound effect at its slot gain", async () => {
    const rig = await unlocked();
    expect(rig.engine.play("place-pump")).toBe(true);
    const source = rig.sfxCtx.sources.at(-1);
    expect(source?.started).toHaveLength(1);
    const gain = rig.sfxCtx.gains.at(-1);
    expect(gain?.gain.value).toBe(AUDIO_SLOTS.find((s) => s.id === "place-pump")?.gain);
    expect(rig.engine.play("music-menu")).toBe(false);
    expect(rig.engine.play("water-loop")).toBe(false);
  });

  it("cross-fades the music between menu and play", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
    const menu = rig.sfxCtx.sources.at(-1);
    expect(menu?.loop).toBe(true);
    rig.engine.setScene("play");
    expect(rig.engine.sfx.currentMusic).toBe("music-play");
    const play = rig.sfxCtx.sources.at(-1);
    expect(play).not.toBe(menu);
    expect(menu?.stopped.length).toBe(1);
    expect(play?.started).toHaveLength(1);
    rig.engine.setScene("off");
    expect(rig.engine.sfx.currentMusic).toBeNull();
  });

  it("starts the music chosen before the unlock as soon as the gesture arrives", async () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    rig.engine.setScene("menu");
    await gesture(rig);
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
  });

  it("follows the sound and music switches", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.play("ui-tap")).toBe(false);
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
    rig.engine.syncSettings({ sound: true, music: false });
    expect(rig.engine.play("ui-tap")).toBe(true);
    expect(rig.engine.sfx.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
  });

  it("scales the water loop with the flow and stops it at zero", async () => {
    const rig = await unlocked();
    rig.engine.setFlow(0.5);
    expect(rig.engine.ambience.currentMusic).toBe("water-loop");
    expect(rig.engine.ambience.getVolume("music")).toBeCloseTo(0.5 * 0.45);
    rig.engine.setFlow(1);
    expect(rig.engine.ambience.getVolume("music")).toBeCloseTo(0.45);
    rig.engine.setFlow(0);
    expect(rig.engine.ambience.currentMusic).toBeNull();
    rig.engine.setFlow(1);
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.ambience.currentMusic).toBeNull();
  });

  it("suspends on pause and resumes afterwards", async () => {
    const rig = await unlocked();
    rig.engine.setScene("play");
    await rig.engine.suspend();
    expect(rig.sfxCtx.suspendCalls).toBe(1);
    expect(rig.ambienceCtx.suspendCalls).toBe(1);
    expect(rig.sfxCtx.state).toBe("suspended");
    await rig.engine.resume();
    expect(rig.sfxCtx.state).toBe("running");
    expect(rig.engine.sfx.currentMusic).toBe("music-play");
  });

  it("survives a platform without WebAudio", async () => {
    const engine = createAudioEngine({
      sfx: createAudioManager({ createContext: () => null }),
      ambience: createAudioManager({ createContext: () => null }),
    });
    const target = new EventTarget();
    cleanups.push(engine.start(target));
    target.dispatchEvent(new Event("pointerdown"));
    await settle();
    expect(engine.progress).toBe(1);
    expect(engine.play("ui-tap")).toBe(false);
    engine.setScene("play");
    engine.setFlow(1);
    await engine.suspend();
  });
});
