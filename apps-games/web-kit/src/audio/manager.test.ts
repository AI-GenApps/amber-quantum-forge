import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeContext, type FakeContext } from "./fake-context";
import { createAudioManager, defaultCreateContext } from "./manager";

function setup(initialState = "suspended") {
  const ctx = createFakeContext(initialState);
  const fetchBuffer = vi.fn(async (url: string) => new ArrayBuffer(url.length));
  const audio = createAudioManager({ createContext: () => ctx, fetchBuffer });
  return { ctx, audio, fetchBuffer };
}

const runningSources = (ctx: FakeContext) => ctx.sources.filter((s) => s.started.length > 0);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("missing AudioContext", () => {
  it("is a safe no-op everywhere", async () => {
    const audio = createAudioManager({ createContext: () => null });
    expect(audio.available).toBe(false);
    expect(audio.unlocked).toBe(false);
    expect(await audio.unlock()).toBe(false);
    expect(await audio.load("a", "/a.ogg")).toBe(false);
    audio.addBuffer("a", {});
    expect(audio.play("a")).toBe(false);
    expect(() => {
      audio.playMusic("m");
      audio.stopMusic();
      audio.setVolume("master", 0.3);
      audio.syncSettings({ sound: false, music: false });
    }).not.toThrow();
    await audio.suspend();
    await audio.resume();
    expect(audio.getVolume("master")).toBe(0.3);
  });

  it("is a no-op when the factory throws", async () => {
    const audio = createAudioManager({
      createContext: () => {
        throw new Error("denied");
      },
    });
    expect(audio.available).toBe(false);
    expect(await audio.unlock()).toBe(false);
  });

  it("detects the global constructors", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    expect(defaultCreateContext()).toBeNull();
    const made: string[] = [];
    vi.stubGlobal(
      "webkitAudioContext",
      class {
        constructor() {
          made.push("webkit");
        }
      },
    );
    expect(defaultCreateContext()).not.toBeNull();
    expect(made).toEqual(["webkit"]);
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          made.push("standard");
        }
      },
    );
    defaultCreateContext();
    expect(made).toEqual(["webkit", "standard"]);
  });

  it("works without any WebAudio in the happy-dom global", () => {
    const audio = createAudioManager();
    expect(audio.available).toBe(false);
  });
});

describe("unlock", () => {
  it("does not play before unlock and plays after", async () => {
    const { ctx, audio } = setup();
    audio.addBuffer("tap", { id: 1 });
    expect(audio.available).toBe(true);
    expect(audio.unlocked).toBe(false);
    expect(audio.play("tap")).toBe(false);
    expect(await audio.unlock()).toBe(true);
    expect(audio.unlocked).toBe(true);
    expect(ctx.resumeCalls).toBe(1);
    expect(audio.play("tap")).toBe(true);
    expect(runningSources(ctx)).toHaveLength(1);
  });

  it("does not resume a context that already runs", async () => {
    const { ctx, audio } = setup("running");
    expect(await audio.unlock()).toBe(true);
    expect(ctx.resumeCalls).toBe(0);
  });

  it("reports failure when resume is blocked", async () => {
    const { ctx, audio } = setup();
    ctx.failResume = true;
    expect(await audio.unlock()).toBe(false);
    expect(audio.unlocked).toBe(false);
  });

  it("unlocks once on the first gesture and then removes its listeners", async () => {
    const { ctx, audio } = setup();
    const target = new EventTarget();
    audio.installUnlock(target);
    target.dispatchEvent(new Event("pointerdown"));
    await vi.waitFor(() => expect(audio.unlocked).toBe(true));
    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("keydown"));
    await Promise.resolve();
    expect(ctx.resumeCalls).toBe(1);
  });

  it("keeps listening if the first gesture could not unlock", async () => {
    const { ctx, audio } = setup();
    ctx.failResume = true;
    const target = new EventTarget();
    audio.installUnlock(target, ["tap"]);
    target.dispatchEvent(new Event("tap"));
    await vi.waitFor(() => expect(ctx.resumeCalls).toBe(1));
    ctx.failResume = false;
    target.dispatchEvent(new Event("tap"));
    await vi.waitFor(() => expect(audio.unlocked).toBe(true));
  });

  it("returns a remover and tolerates a missing target", () => {
    const { audio } = setup();
    const target = new EventTarget();
    const remove = audio.installUnlock(target, ["tap"]);
    remove();
    target.dispatchEvent(new Event("tap"));
    vi.stubGlobal("document", undefined);
    expect(audio.installUnlock(undefined)).toBeTypeOf("function");
  });
});

describe("sound effects", () => {
  it("loads and decodes by id and reports failures", async () => {
    const { ctx, audio, fetchBuffer } = setup();
    expect(await audio.load("tap", "/sfx/tap.ogg")).toBe(true);
    expect(audio.has("tap")).toBe(true);
    expect(ctx.decoded).toHaveLength(1);
    fetchBuffer.mockRejectedValueOnce(new Error("404"));
    expect(await audio.load("bad", "/missing.ogg")).toBe(false);
    expect(audio.has("bad")).toBe(false);
    ctx.decodeAudioData = async () => {
      throw new Error("corrupt");
    };
    expect(await audio.load("broken", "/broken.ogg")).toBe(false);
  });

  it("returns false for unknown ids", async () => {
    const { audio } = setup("running");
    await audio.unlock();
    expect(audio.play("nope")).toBe(false);
  });

  it("applies per-play volume and rate through the sfx bus", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("pop", {});
    audio.play("pop", { volume: 0.4, rate: 1.5 });
    const source = runningSources(ctx)[0];
    expect(source?.playbackRate.value).toBe(1.5);
    const voiceGain = ctx.gains[3];
    expect(voiceGain?.gain.value).toBe(0.4);
    expect(voiceGain?.connectedTo[0]).toBe(ctx.gains[1]);
  });

  it("cleans up a voice when it ends", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("pop", {});
    audio.play("pop");
    const source = runningSources(ctx)[0];
    source?.onended?.();
    expect(source?.disconnected).toBe(true);
  });

  it("cuts the oldest voice beyond the voice limit", async () => {
    const ctx = createFakeContext("running");
    const audio = createAudioManager({ createContext: () => ctx, maxVoices: 2 });
    await audio.unlock();
    audio.addBuffer("pop", {});
    audio.play("pop");
    audio.play("pop");
    audio.play("pop");
    expect(ctx.sources[0]?.stopped).toHaveLength(1);
    expect(ctx.sources[0]?.disconnected).toBe(true);
    expect(ctx.sources[2]?.stopped).toHaveLength(0);
  });

  it("is muted when the sound setting is off", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("pop", {});
    audio.syncSettings({ sound: false, music: true });
    expect(audio.play("pop")).toBe(false);
    expect(runningSources(ctx)).toHaveLength(0);
    audio.syncSettings({ sound: true, music: true });
    expect(audio.play("pop")).toBe(true);
  });

  it("stops playing effects when sound is switched off", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("pop", {});
    audio.play("pop");
    audio.syncSettings({ sound: false, music: true });
    expect(ctx.sources[0]?.stopped).toHaveLength(1);
  });
});

describe("volumes", () => {
  it("clamps and applies volumes to the buses", async () => {
    const { ctx, audio } = setup();
    audio.setVolume("master", 2);
    expect(audio.getVolume("master")).toBe(1);
    audio.setVolume("sfx", -3);
    expect(audio.getVolume("sfx")).toBe(0);
    audio.setVolume("music", Number.NaN);
    expect(audio.getVolume("music")).toBe(0);
    expect(audio.available).toBe(true);
    audio.setVolume("master", 0.5);
    audio.setVolume("sfx", 0.25);
    audio.setVolume("music", 0.75);
    expect(ctx.gains[0]?.gain.value).toBe(0.5);
    expect(ctx.gains[1]?.gain.value).toBe(0.25);
    expect(ctx.gains[2]?.gain.value).toBe(0.75);
  });

  it("starts from initial volumes", () => {
    const ctx = createFakeContext();
    const audio = createAudioManager({ createContext: () => ctx, volumes: { music: 0.3 } });
    expect(audio.available).toBe(true);
    expect(ctx.gains[2]?.gain.value).toBe(0.3);
    expect(audio.getVolume("sfx")).toBe(1);
  });
});

describe("music", () => {
  it("loops one track with a fade in", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("theme", {});
    audio.playMusic("theme", { fadeMs: 500 });
    const source = runningSources(ctx)[0];
    expect(source?.loop).toBe(true);
    expect(audio.currentMusic).toBe("theme");
    const trackGain = ctx.gains[3];
    expect(trackGain?.gain.ramps.at(-1)).toEqual({ value: 1, time: 10.5 });
    audio.playMusic("theme");
    expect(runningSources(ctx)).toHaveLength(1);
  });

  it("cross-fades to another track and fades the old one out", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("a", {});
    audio.addBuffer("b", {});
    audio.playMusic("a", { fadeMs: 1000 });
    audio.playMusic("b", { fadeMs: 1000 });
    expect(audio.currentMusic).toBe("b");
    const [first, second] = runningSources(ctx);
    expect(ctx.gains[3]?.gain.ramps.at(-1)?.value).toBe(0);
    expect(first?.stopped[0]).toBeCloseTo(11.02);
    first?.onended?.();
    expect(first?.disconnected).toBe(true);
    expect(second?.loop).toBe(true);
  });

  it("stopMusic fades out and clears the current track", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("a", {});
    audio.playMusic("a");
    audio.stopMusic({ fadeMs: 100 });
    expect(audio.currentMusic).toBeNull();
    expect(ctx.gains[3]?.gain.ramps.at(-1)).toEqual({ value: 0, time: 10.1 });
    audio.stopMusic();
  });

  it("waits for the first gesture and for the buffer", async () => {
    const { ctx, audio } = setup();
    audio.playMusic("theme");
    expect(runningSources(ctx)).toHaveLength(0);
    await audio.unlock();
    expect(runningSources(ctx)).toHaveLength(0);
    audio.addBuffer("theme", {});
    expect(audio.currentMusic).toBe("theme");
    expect(runningSources(ctx)).toHaveLength(1);
  });

  it("starts pending music when unlock succeeds", async () => {
    const { ctx, audio } = setup();
    audio.addBuffer("theme", {});
    audio.playMusic("theme");
    expect(runningSources(ctx)).toHaveLength(0);
    await audio.unlock();
    expect(runningSources(ctx)).toHaveLength(1);
  });

  it("mutes with the music setting and resumes the requested track when re-enabled", async () => {
    const { ctx, audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("theme", {});
    audio.playMusic("theme");
    audio.syncSettings({ sound: true, music: false });
    expect(audio.currentMusic).toBeNull();
    audio.playMusic("theme");
    expect(audio.currentMusic).toBeNull();
    audio.syncSettings({ sound: true, music: true });
    expect(audio.currentMusic).toBe("theme");
    expect(runningSources(ctx)).toHaveLength(2);
  });

  it("keeps music running when only sound is muted", async () => {
    const { audio } = setup("running");
    await audio.unlock();
    audio.addBuffer("theme", {});
    audio.playMusic("theme");
    audio.syncSettings({ sound: false, music: true });
    expect(audio.currentMusic).toBe("theme");
  });
});

describe("suspend and resume", () => {
  it("suspends and resumes only after a first unlock", async () => {
    const { ctx, audio } = setup();
    audio.playMusic("x");
    await audio.suspend();
    await audio.resume();
    expect(ctx.suspendCalls).toBe(0);
    expect(ctx.resumeCalls).toBe(0);
    await audio.unlock();
    await audio.suspend();
    expect(ctx.suspendCalls).toBe(1);
    expect(audio.unlocked).toBe(false);
    await audio.resume();
    expect(audio.unlocked).toBe(true);
  });

  it("restarts the requested music after resume", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    audio.addBuffer("theme", {});
    audio.playMusic("theme");
    ctx.state = "suspended";
    await audio.resume();
    expect(audio.currentMusic).toBe("theme");
  });

  it("survives a context that cannot suspend or resume", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    ctx.suspend = async () => {
      throw new Error("no");
    };
    await expect(audio.suspend()).resolves.toBeUndefined();
    ctx.failResume = true;
    await expect(audio.resume()).resolves.toBeUndefined();
    delete ctx.suspend;
    await expect(audio.suspend()).resolves.toBeUndefined();
  });
});
