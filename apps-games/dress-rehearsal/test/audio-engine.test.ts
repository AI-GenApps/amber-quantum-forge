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
  ctx: FakeContext;
  requests: string[];
  target: EventTarget;
}

function makeRig(): Rig {
  const ctx = createFakeAudioContext();
  const requests: string[] = [];
  const fetchBuffer = async (url: string): Promise<ArrayBuffer> => {
    requests.push(url);
    return new ArrayBuffer(16);
  };
  const manager: AudioManager = createAudioManager({ createContext: () => ctx, fetchBuffer });
  return { engine: createAudioEngine({ manager }), ctx, requests, target: new EventTarget() };
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
  it("plays nothing before the first gesture", () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    expect(rig.engine.play("ui-tap")).toBe(false);
    rig.engine.setScene("menu");
    expect(rig.ctx.sources).toHaveLength(0);
    expect(rig.ctx.resumeCalls).toBe(0);
    expect(rig.requests).toHaveLength(0);
    expect(rig.engine.progress).toBe(0);
  });

  it("unlocks and loads every file once on the first gesture", async () => {
    const rig = await unlocked();
    expect(rig.ctx.state).toBe("running");
    const expected = loadableSlots().map((slot) => `/audio/${slot.file}`);
    expect([...rig.requests].sort()).toEqual([...expected].sort());
    expect(rig.ctx.decoded).toHaveLength(26);
    expect(rig.engine.progress).toBe(1);
    await gesture(rig);
    expect(rig.requests).toHaveLength(26);
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
    expect(seen).toHaveLength(28);
  });

  it("plays a sound effect at its slot gain and refuses the music slots", async () => {
    const rig = await unlocked();
    expect(rig.engine.play("item-place")).toBe(true);
    expect(rig.ctx.sources.at(-1)?.started).toHaveLength(1);
    expect(rig.ctx.gains.at(-1)?.gain.value).toBe(
      AUDIO_SLOTS.find((s) => s.id === "item-place")?.gain,
    );
    expect(rig.engine.play("music-menu")).toBe(false);
  });

  it("cross-fades the music between the menu and the styling board", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    expect(rig.engine.manager.currentMusic).toBe("music-menu");
    const menu = rig.ctx.sources.at(-1);
    expect(menu?.loop).toBe(true);
    rig.engine.setScene("style");
    expect(rig.engine.manager.currentMusic).toBe("music-style");
    const style = rig.ctx.sources.at(-1);
    expect(style).not.toBe(menu);
    expect(menu?.stopped.length).toBe(1);
    expect(style?.started).toHaveLength(1);
    rig.engine.setScene("menu");
    expect(rig.engine.manager.currentMusic).toBe("music-menu");
    rig.engine.setScene("off");
    expect(rig.engine.manager.currentMusic).toBeNull();
  });

  it("starts the music chosen before the unlock as soon as the gesture arrives", async () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    rig.engine.setScene("menu");
    await gesture(rig);
    expect(rig.engine.manager.currentMusic).toBe("music-menu");
  });

  it("follows the sound and music switches and the volumes", async () => {
    const rig = await unlocked();
    rig.engine.setScene("menu");
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.play("ui-tap")).toBe(false);
    expect(rig.engine.manager.currentMusic).toBe("music-menu");
    rig.engine.syncSettings({ sound: true, music: false });
    expect(rig.engine.play("ui-tap")).toBe(true);
    expect(rig.engine.manager.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.manager.currentMusic).toBe("music-menu");
    rig.engine.manager.setVolume("sfx", 0.25);
    expect(rig.engine.manager.getVolume("sfx")).toBe(0.25);
  });

  it("suspends on pause and resumes afterwards", async () => {
    const rig = await unlocked();
    rig.engine.setScene("style");
    await rig.engine.suspend();
    expect(rig.ctx.suspendCalls).toBe(1);
    expect(rig.ctx.state).toBe("suspended");
    await rig.engine.resume();
    expect(rig.ctx.state).toBe("running");
    expect(rig.engine.manager.currentMusic).toBe("music-style");
  });

  it("survives a platform without WebAudio", async () => {
    const engine = createAudioEngine({
      manager: createAudioManager({ createContext: () => null }),
    });
    const target = new EventTarget();
    cleanups.push(engine.start(target));
    target.dispatchEvent(new Event("pointerdown"));
    await settle();
    expect(engine.progress).toBe(1);
    expect(engine.play("ui-tap")).toBe(false);
    engine.setScene("style");
    await engine.suspend();
  });
});
