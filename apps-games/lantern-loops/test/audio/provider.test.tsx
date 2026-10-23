import { createAudioManager } from "@web-games/kit";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MUSIC_ID, SOUND_IDS } from "../../src/audio/sounds";
import {
  createTestEnv,
  flush,
  mountApp,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "../helpers/env";

type Mounted = Awaited<ReturnType<typeof mountApp>>;
let mounted: Mounted | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.replaceChildren();
  removeAnimate();
  vi.unstubAllGlobals();
});

async function open(options: TestEnvOptions = {}): Promise<TestEnv> {
  const test = await createTestEnv({ fixture: "mid", ...options });
  mounted = await mountApp(test.env);
  return test;
}

async function change(
  test: TestEnv,
  patch: Parameters<TestEnv["env"]["services"]["settings"]["set"]>[0],
) {
  await act(async () => {
    await test.env.services.settings.set(patch);
  });
  await flush(4);
}

async function gesture(type = "pointerdown"): Promise<void> {
  document.dispatchEvent(new Event(type));
  await flush(8);
}

const started = (test: TestEnv) => test.context.sources.filter((s) => s.started.length > 0);

describe("AudioProvider with the fake AudioContext", () => {
  it("stays locked and loads nothing before the first gesture", async () => {
    const test = await open();
    expect(test.env.audio.available).toBe(true);
    expect(test.env.audio.unlocked).toBe(false);
    expect(test.fetched).toEqual([]);
    test.feedback.emit("ui-tap");
    expect(started(test)).toHaveLength(0);
  });

  it("unlocks on the first gesture, preloads the 17 effects and the music, and starts the music", async () => {
    const test = await open();
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.unlocked).toBe(true));
    await vi.waitFor(() => expect(test.fetched).toHaveLength(SOUND_IDS.length + 1));
    expect(test.context.resumeCalls).toBe(1);
    expect(test.fetched).toContain("/audio/calm-loop.mp3");
    expect(test.fetched).toContain("/audio/win-3.mp3");
    for (const id of SOUND_IDS) expect(test.env.audio.has(id), id).toBe(true);
    await vi.waitFor(() => expect(test.env.audio.currentMusic).toBe(MUSIC_ID));
    expect(started(test).some((source) => source.loop)).toBe(true);
    await gesture("keydown");
    expect(test.context.resumeCalls).toBe(1);
  });

  it("plays a sound by id once loaded", async () => {
    const test = await open();
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.has("tile-place")).toBe(true));
    const before = started(test).length;
    test.feedback.emit("tile-place");
    expect(started(test)).toHaveLength(before + 1);
    expect(test.events).toContain("tile-place");
  });

  it("is silent for effects when Sound is off and for the music when Music is off", async () => {
    const test = await open({ settings: { sound: false } });
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.has("tile-place")).toBe(true));
    const before = started(test).length;
    test.feedback.emit("tile-place");
    expect(started(test)).toHaveLength(before);
    await change(test, { sound: true, music: false });
    expect(test.env.audio.currentMusic).toBeNull();
    test.feedback.emit("tile-place");
    expect(started(test)).toHaveLength(before + 1);
    await change(test, { music: true });
    expect(test.env.audio.currentMusic).toBe(MUSIC_ID);
  });

  it("follows the master volume and mutes with it", async () => {
    const test = await open();
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.unlocked).toBe(true));
    test.env.audio.setVolume("master", 0);
    expect(test.context.gains[0]?.gain.value).toBe(0);
    test.env.audio.setVolume("master", 0.5);
    expect(test.context.gains[0]?.gain.value).toBe(0.5);
    expect(test.env.audio.getVolume("music")).toBe(1);
  });

  it("silences haptics with the Haptics setting while sound keeps playing", async () => {
    const test = await open({ settings: { haptics: false } });
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.has("loop-close")).toBe(true));
    test.feedback.emit("loop-close");
    test.feedback.emit("win-3");
    expect(test.buzzes).toEqual([]);
    await change(test, { haptics: true });
    test.feedback.emit("loop-close");
    expect(test.buzzes).toEqual(["impact:medium"]);
  });

  it("suspends with the app and resumes with it", async () => {
    const test = await open();
    await gesture();
    await vi.waitFor(() => expect(test.env.audio.unlocked).toBe(true));
    test.lifecycle.pause();
    await flush(4);
    expect(test.context.suspendCalls).toBe(1);
    test.lifecycle.resume();
    await flush(4);
    expect(test.context.resumeCalls).toBe(2);
    expect(test.env.audio.unlocked).toBe(true);
  });
});

describe("AudioProvider without AudioContext", () => {
  it("is a safe no-op", async () => {
    const test = await createTestEnv({ fixture: "mid" });
    const audio = createAudioManager({ createContext: () => null });
    const env = { ...test.env, audio };
    mounted = await mountApp(env);
    expect(audio.available).toBe(false);
    document.dispatchEvent(new Event("pointerdown"));
    await flush(6);
    expect(audio.unlocked).toBe(false);
    expect(() => {
      test.feedback.emit("ui-tap");
      test.feedback.emit("win-3");
    }).not.toThrow();
    expect(audio.play("ui-tap")).toBe(false);
    expect(audio.currentMusic).toBeNull();
    expect(test.fetched).toEqual([]);
  });
});
