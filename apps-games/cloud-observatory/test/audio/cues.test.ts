import { createAudioManager, createFakeAudioContext, type FakeContext } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  CUE_IDS,
  CUES,
  createGameAudio,
  GATHER_MAX_PER_SECOND,
  MUSIC_FADE_MS,
  MUSIC_ID,
} from "../../src/audio/cues";

interface Rig {
  readonly ctx: FakeContext;
  readonly audio: ReturnType<typeof createGameAudio>;
  readonly fetched: string[];
  readonly manager: ReturnType<typeof createAudioManager>;
  time: number;
}

function rig(options: { context?: boolean } = {}): Rig {
  const ctx = createFakeAudioContext();
  const fetched: string[] = [];
  const manager = createAudioManager({
    createContext: () => (options.context === false ? null : ctx),
    fetchBuffer: async (url) => {
      fetched.push(url);
      return new ArrayBuffer(8);
    },
  });
  const state = { time: 0 };
  const audio = createGameAudio(manager, { now: () => state.time, random: () => 0.5 });
  const out: Rig = {
    ctx,
    audio,
    fetched,
    manager,
    get time() {
      return state.time;
    },
    set time(value) {
      state.time = value;
    },
  };
  return out;
}

async function unlocked(): Promise<Rig> {
  const r = rig();
  expect(await r.audio.unlock()).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return r;
}

describe("game audio", () => {
  it("has a cue for each of the 13 ids and a music loop", () => {
    expect(CUE_IDS).toHaveLength(13);
    expect(CUE_IDS.slice().sort()).toEqual(
      [
        "gather",
        "buy",
        "upgrade",
        "star-ok",
        "star-miss",
        "chart-done",
        "lore",
        "achievement",
        "eclipse",
        "comet",
        "click",
        "back",
        "welcome",
      ].sort(),
    );
    expect(MUSIC_ID).toBe("observatory-night");
    for (const cue of Object.values(CUES)) {
      expect(cue.volume).toBeGreaterThan(0);
      expect(cue.volume).toBeLessThanOrEqual(1);
      expect(cue.rate[0]).toBeLessThanOrEqual(cue.rate[1]);
    }
  });

  it("loads nothing and plays nothing before the first gesture", async () => {
    const r = rig();
    expect(r.audio.play("click")).toBe(false);
    expect(r.fetched).toEqual([]);
    expect(r.ctx.sources).toHaveLength(0);
  });

  it("loads every cue and the loop lazily after unlock, and each cue plays", async () => {
    const r = await unlocked();
    expect(r.fetched).toHaveLength(CUE_IDS.length + 1);
    for (const id of CUE_IDS) expect(r.manager.has(id)).toBe(true);
    expect(r.manager.has(MUSIC_ID)).toBe(true);
    for (const id of CUE_IDS) {
      r.time += 5000;
      expect(r.audio.play(id), id).toBe(true);
    }
    expect(r.ctx.sources.filter((source) => !source.loop)).toHaveLength(CUE_IDS.length);
  });

  it("ignores unknown ids", async () => {
    const r = await unlocked();
    const before = r.ctx.sources.length;
    expect(r.audio.play("not-a-cue")).toBe(false);
    expect(r.audio.play("")).toBe(false);
    expect(r.audio.play("toString")).toBe(false);
    expect(r.ctx.sources).toHaveLength(before);
  });

  it("uses the cue's volume and a rate inside its jitter range", async () => {
    const r = await unlocked();
    r.audio.play("gather");
    const source = r.ctx.sources.at(-1);
    const [low, high] = CUES.gather.rate;
    expect(source?.playbackRate.value).toBeGreaterThanOrEqual(low);
    expect(source?.playbackRate.value).toBeLessThanOrEqual(high);
    expect(r.ctx.gains.at(-1)?.gain.value).toBe(CUES.gather.volume);
  });

  it("throttles gather to 8 plays per second but not other cues", async () => {
    const r = await unlocked();
    r.time = 10_000;
    let played = 0;
    for (let index = 0; index < 20; index += 1) {
      if (r.audio.play("gather")) played += 1;
    }
    expect(played).toBe(GATHER_MAX_PER_SECOND);
    expect(r.audio.play("click")).toBe(true);
    expect(r.audio.play("click")).toBe(true);
    r.time += 1000;
    expect(r.audio.play("gather")).toBe(true);
  });

  it("the sound switch silences cues and the music switch fades the loop", async () => {
    const r = await unlocked();
    expect(r.manager.currentMusic).toBe(MUSIC_ID);
    r.audio.syncSettings({ sound: false, music: true });
    expect(r.audio.play("click")).toBe(false);
    r.audio.syncSettings({ sound: true, music: false });
    expect(r.manager.currentMusic).toBeNull();
    expect(r.audio.play("click")).toBe(true);
    r.audio.syncSettings({ sound: true, music: true });
    expect(r.manager.currentMusic).toBe(MUSIC_ID);
  });

  it("starts and stops the loop with a 600 ms fade", async () => {
    const r = await unlocked();
    const loop = r.ctx.sources.find((source) => source.loop);
    expect(loop).toBeTruthy();
    const fadeIn = r.ctx.gains.flatMap((gain) => gain.gain.ramps).find((ramp) => ramp.value === 1);
    expect(fadeIn ? fadeIn.time - r.ctx.currentTime : 0).toBeCloseTo(MUSIC_FADE_MS / 1000, 5);
    r.audio.stopMusic();
    expect(r.manager.currentMusic).toBeNull();
    const fadeOut = r.ctx.gains.flatMap((gain) => gain.gain.ramps).find((ramp) => ramp.value === 0);
    expect(fadeOut ? fadeOut.time - r.ctx.currentTime : 0).toBeCloseTo(MUSIC_FADE_MS / 1000, 5);
    expect(loop?.stopped.length).toBeGreaterThan(0);
    r.audio.startMusic();
    expect(r.manager.currentMusic).toBe(MUSIC_ID);
  });

  it("suspends and resumes with the app lifecycle", async () => {
    const r = await unlocked();
    await r.audio.suspend();
    expect(r.ctx.suspendCalls).toBe(1);
    expect(r.audio.play("click")).toBe(false);
    await r.audio.resume();
    expect(r.audio.play("click")).toBe(true);
  });

  it("unlocks on the first gesture only", async () => {
    const r = rig();
    const target = new EventTarget();
    r.audio.installUnlock(target);
    expect(r.ctx.resumeCalls).toBe(0);
    target.dispatchEvent(new Event("pointerdown"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(r.ctx.resumeCalls).toBe(1);
    target.dispatchEvent(new Event("pointerdown"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(r.ctx.resumeCalls).toBe(1);
    expect(r.manager.unlocked).toBe(true);
  });

  it("a missing AudioContext is a silent no-op everywhere", async () => {
    const r = rig({ context: false });
    expect(await r.audio.unlock()).toBe(false);
    expect(r.audio.play("gather")).toBe(false);
    r.audio.startMusic();
    r.audio.stopMusic();
    r.audio.syncSettings({ sound: false, music: false });
    await r.audio.suspend();
    await r.audio.resume();
    const target = new EventTarget();
    expect(() => {
      r.audio.installUnlock(target)();
    }).not.toThrow();
    expect(r.fetched).toEqual([]);
  });

  it("a failed context creation never throws", async () => {
    const manager = createAudioManager({
      createContext: () => {
        throw new Error("no audio");
      },
    });
    const audio = createGameAudio(manager);
    expect(await audio.unlock()).toBe(false);
    expect(audio.play("click")).toBe(false);
  });
});
