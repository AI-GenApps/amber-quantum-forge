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
    rig.engine.setScene("desk");
    rig.engine.setTyping(true);
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
    expect(rig.sfxCtx.decoded).toHaveLength(28);
    expect(rig.ambienceCtx.decoded).toHaveLength(1);
    expect(rig.engine.progress).toBe(1);
    await gesture(rig);
    expect(rig.requests).toHaveLength(29);
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
    expect(seen).toHaveLength(31);
  });

  it("plays a sound effect at its slot gain and refuses loops and music", async () => {
    const rig = await unlocked();
    expect(rig.engine.play("clue-pin")).toBe(true);
    const source = rig.sfxCtx.sources.at(-1);
    expect(source?.started).toHaveLength(1);
    expect(rig.sfxCtx.gains.at(-1)?.gain.value).toBe(
      AUDIO_SLOTS.find((slot) => slot.id === "clue-pin")?.gain,
    );
    expect(rig.engine.play("music-desk")).toBe(false);
    expect(rig.engine.play("typewriter")).toBe(false);
  });

  it("cross-fades the music between the desk and the case", async () => {
    const rig = await unlocked();
    rig.engine.setScene("desk");
    expect(rig.engine.sfx.currentMusic).toBe("music-desk");
    const desk = rig.sfxCtx.sources.at(-1);
    expect(desk?.loop).toBe(true);
    rig.engine.setScene("case");
    expect(rig.engine.sfx.currentMusic).toBe("music-case");
    const board = rig.sfxCtx.sources.at(-1);
    expect(board).not.toBe(desk);
    expect(desk?.stopped.length).toBe(1);
    expect(board?.started).toHaveLength(1);
    rig.engine.setScene("off");
    expect(rig.engine.sfx.currentMusic).toBeNull();
  });

  it("starts the music chosen before the unlock as soon as the gesture arrives", async () => {
    const rig = makeRig();
    cleanups.push(rig.engine.start(rig.target));
    rig.engine.setScene("desk");
    await gesture(rig);
    expect(rig.engine.sfx.currentMusic).toBe("music-desk");
  });

  it("runs the typewriter loop only while the reveal is typing", async () => {
    const rig = await unlocked();
    expect(rig.engine.ambience.currentMusic).toBeNull();
    rig.engine.setTyping(true);
    expect(rig.engine.ambience.currentMusic).toBe("typewriter");
    const loop = rig.ambienceCtx.sources.at(-1);
    expect(loop?.loop).toBe(true);
    rig.engine.setTyping(true);
    expect(rig.ambienceCtx.sources).toHaveLength(1);
    rig.engine.setTyping(false);
    expect(rig.engine.ambience.currentMusic).toBeNull();
    expect(loop?.stopped.length).toBe(1);
    rig.engine.setTyping(true);
    expect(rig.engine.ambience.currentMusic).toBe("typewriter");
    expect(rig.engine.typing).toBe(true);
  });

  it("follows the sound and music switches", async () => {
    const rig = await unlocked();
    rig.engine.setScene("desk");
    rig.engine.syncSettings({ sound: false, music: true });
    expect(rig.engine.play("ui-tap")).toBe(false);
    expect(rig.engine.sfx.currentMusic).toBe("music-desk");
    rig.engine.syncSettings({ sound: true, music: false });
    expect(rig.engine.play("ui-tap")).toBe(true);
    expect(rig.engine.sfx.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.sfx.currentMusic).toBe("music-desk");
  });

  it("silences the typewriter loop with the sound switch", async () => {
    const rig = await unlocked();
    rig.engine.syncSettings({ sound: false, music: true });
    rig.engine.setTyping(true);
    expect(rig.engine.ambience.currentMusic).toBeNull();
    rig.engine.syncSettings({ sound: true, music: true });
    expect(rig.engine.ambience.currentMusic).toBe("typewriter");
  });

  it("suspends on pause and resumes afterwards", async () => {
    const rig = await unlocked();
    rig.engine.setScene("case");
    await rig.engine.suspend();
    expect(rig.sfxCtx.suspendCalls).toBe(1);
    expect(rig.ambienceCtx.suspendCalls).toBe(1);
    expect(rig.sfxCtx.state).toBe("suspended");
    await rig.engine.resume();
    expect(rig.sfxCtx.state).toBe("running");
    expect(rig.engine.sfx.currentMusic).toBe("music-case");
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
    engine.setScene("case");
    engine.setTyping(true);
    await engine.suspend();
  });
});
