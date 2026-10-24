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
  for (let i = 0; i < 80; i++) await Promise.resolve();
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
  it("plays nothing before the first gesture", () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    expect(rig.engine.play("ui-tap")).toBe(false);
    rig.engine.setScene("menu");
    rig.engine.setRain(true);
    expect(rig.sfxCtx.sources).toHaveLength(0);
    expect(rig.ambienceCtx.sources).toHaveLength(0);
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
    expect(rig.sfxCtx.decoded).toHaveLength(35);
    expect(rig.ambienceCtx.decoded).toHaveLength(1);
    expect(rig.engine.progress).toBe(1);
    await gesture(rig);
    expect(rig.requests).toHaveLength(36);
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
    expect(seen).toHaveLength(38);
  });

  it("plays sound effects at their slot gain and refuses loops and music", async () => {
    const rig = await unlocked();
    expect(rig.engine.play("serve")).toBe(true);
    expect(rig.sfxCtx.sources.at(-1)?.started).toHaveLength(1);
    expect(rig.sfxCtx.gains.at(-1)?.gain.value).toBe(
      AUDIO_SLOTS.find((slot) => slot.id === "serve")?.gain,
    );
    expect(rig.engine.play("music-menu")).toBe(false);
    expect(rig.engine.play("rain-loop")).toBe(false);
  });

  it("switches the music between menu, shift and story", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
    const menu = rig.sfxCtx.sources.at(-1);
    expect(menu?.loop).toBe(true);
    rig.engine.setScene("shift");
    expect(rig.engine.sfx.currentMusic).toBe("music-shift");
    expect(menu?.stopped.length).toBe(1);
    rig.engine.setScene("story");
    expect(rig.engine.sfx.currentMusic).toBe("music-story");
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

  it("follows the rain: loops while raining, stops when it clears", async () => {
    const rig = await unlocked();
    rig.engine.setRain(true);
    expect(rig.engine.ambience.currentMusic).toBe("rain-loop");
    expect(rig.ambienceCtx.sources.at(-1)?.loop).toBe(true);
    rig.engine.setRain(false);
    expect(rig.engine.ambience.currentMusic).toBeNull();
    rig.engine.setRain(true);
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.ambience.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.ambience.currentMusic).toBe("rain-loop");
  });

  it("follows the sound and music switches and keeps music below the effects", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    expect(rig.engine.sfx.getVolume("music")).toBeLessThan(rig.engine.sfx.getVolume("sfx"));
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.play("ui-tap")).toBe(false);
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
    rig.engine.syncSettings({ sound: true, music: false });
    expect(rig.engine.play("ui-tap")).toBe(true);
    expect(rig.engine.sfx.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.sfx.currentMusic).toBe("music-menu");
  });

  it("suspends on pause and resumes afterwards", async () => {
    const rig = await unlocked();
    rig.engine.setScene("shift");
    rig.engine.setRain(true);
    await rig.engine.suspend();
    expect(rig.sfxCtx.suspendCalls).toBe(1);
    expect(rig.ambienceCtx.suspendCalls).toBe(1);
    expect(rig.sfxCtx.state).toBe("suspended");
    await rig.engine.resume();
    expect(rig.sfxCtx.state).toBe("running");
    expect(rig.engine.sfx.currentMusic).toBe("music-shift");
    expect(rig.engine.ambience.currentMusic).toBe("rain-loop");
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
    engine.setScene("shift");
    engine.setRain(true);
    await engine.suspend();
  });
});
