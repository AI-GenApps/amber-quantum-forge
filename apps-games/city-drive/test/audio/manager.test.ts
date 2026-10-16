import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioManager } from "../../src/audio/manager";
import { type AudioManifest, SOUND_IDS, type SoundId } from "../../src/audio/manifest";
import { engineParams, MUSIC_DUCK_LEVEL, MUSIC_LEVEL } from "../../src/audio/mapping";
import { FakeContext, type FakeGain, type FakeSource } from "./fakeContext";

const SHIPPED = SOUND_IDS.filter((id) => id !== "skid");

function manifestOf(ids: readonly SoundId[]): AudioManifest {
  return {
    version: 1,
    totalBytes: ids.length,
    procedural: [],
    sounds: ids.map((id, i) => ({
      id,
      file: `${id}.mp3`,
      kind: id.startsWith("music") ? "music" : "sfx",
      bytes: 1,
      sha256: "0".repeat(64),
      durationS: 1,
      source: `byte${i}`,
    })),
  };
}

function setup(ids: readonly SoundId[] = SHIPPED, ctx = new FakeContext()) {
  const loaded: string[] = [];
  const manager = new AudioManager({
    createContext: () => ctx,
    loadBytes: async (file) => {
      loaded.push(file);
      return new Uint8Array([ids.findIndex((id) => `${id}.mp3` === file), 1, 2]);
    },
    manifest: manifestOf(ids),
  });
  return { ctx, manager, loaded };
}

const sourceOf = (ctx: FakeContext, since = 0): FakeSource[] => ctx.sources.slice(since);

afterEach(() => vi.restoreAllMocks());

describe("AudioManager unlock", () => {
  it("makes no sound and creates nothing before the first gesture", () => {
    const { ctx, manager } = setup();
    expect(manager.play("ui_tap")).toBe(false);
    manager.playMusic("music_menu");
    manager.setEngine(engineParams(0, 0, 115));
    expect(ctx.sources).toHaveLength(0);
    expect(ctx.resumed).toBe(0);
  });

  it("resumes the context and decodes every shipped sound once, however often it is called", async () => {
    const { ctx, manager, loaded } = setup();
    await Promise.all([manager.unlock(), manager.unlock()]);
    await manager.unlock();
    expect(ctx.resumed).toBe(1);
    expect(loaded.sort()).toEqual(SHIPPED.map((id) => `${id}.mp3`).sort());
    expect(manager.ready).toBe(true);
    expect(manager.has("horn")).toBe(true);
  });

  it("can try again after the context refuses to resume", async () => {
    const ctx = new FakeContext();
    let refuse = true;
    ctx.resume = async () => {
      if (refuse) throw new Error("not allowed to start");
      ctx.state = "running";
    };
    const { manager } = setup(SHIPPED, ctx);
    await expect(manager.unlock()).rejects.toThrow("not allowed");
    expect(manager.play("ui_tap")).toBe(false);
    refuse = false;
    await manager.unlock();
    expect(manager.play("ui_tap")).toBe(true);
  });

  it("goes on silently, with one warning, when Web Audio is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const manager = new AudioManager({
      createContext: () => undefined,
      loadBytes: async () => new Uint8Array(1),
      manifest: manifestOf(SHIPPED),
    });
    await manager.unlock();
    expect(manager.play("horn")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("logs a sound that will not decode and keeps the others", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ctx = new FakeContext();
    ctx.failDecode.add(SHIPPED.indexOf("horn"));
    const { manager } = setup(SHIPPED, ctx);
    await manager.unlock();
    expect(manager.has("horn")).toBe(false);
    expect(manager.has("ui_tap")).toBe(true);
    expect(manager.play("horn")).toBe(false);
    expect(manager.play("ui_tap")).toBe(true);
    expect(warn.mock.calls[0]?.[0]).toContain('"horn"');
    expect(manager.ready).toBe(true);
  });
});

describe("AudioManager one-shots", () => {
  it("plays a sound once at the given gain through the effects bus", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    const before = ctx.sources.length;
    expect(manager.play("collision_heavy", 0.7)).toBe(true);
    const [source] = sourceOf(ctx, before);
    expect(source?.started).toBe(1);
    expect(source?.loop).toBe(false);
    const level = source?.connected[0] as FakeGain;
    expect(level.gain.value).toBe(0.7);
    source?.onended?.();
    expect(source?.disconnected).toBe(true);
  });

  it("does not play a sound that is not in the manifest (the skid)", async () => {
    const { manager } = setup();
    await manager.unlock();
    expect(manager.has("skid")).toBe(false);
    expect(manager.play("skid")).toBe(false);
  });
});

describe("AudioManager settings", () => {
  it("master off closes the master bus and stops one-shots; on opens it again", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    const master = ctx.gains[0] as FakeGain;
    expect(master.gain.last).toBe(1);
    manager.setToggles({ master: false, sfx: true, music: true });
    expect(master.gain.last).toBe(0);
    expect(manager.play("ui_tap")).toBe(false);
    manager.setToggles({ master: true, sfx: true, music: true });
    expect(master.gain.last).toBe(1);
    expect(manager.play("ui_tap")).toBe(true);
  });

  it("sfx off silences effects but leaves music open", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    manager.setToggles({ master: true, sfx: false, music: true });
    const [, sfx, music] = ctx.gains as [FakeGain, FakeGain, FakeGain];
    expect(sfx.gain.last).toBe(0);
    expect(music.gain.last).toBe(MUSIC_LEVEL);
    expect(manager.play("checkpoint")).toBe(false);
  });

  it("music off closes only the music bus", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    manager.setToggles({ master: true, sfx: true, music: false });
    const [, sfx, music] = ctx.gains as [FakeGain, FakeGain, FakeGain];
    expect(music.gain.last).toBe(0);
    expect(sfx.gain.last).toBe(1);
  });

  it("remembers toggles chosen before the first gesture", async () => {
    const { ctx, manager } = setup();
    manager.setToggles({ master: false, sfx: true, music: true });
    await manager.unlock();
    expect((ctx.gains[0] as FakeGain).gain.last).toBe(0);
  });
});

describe("AudioManager music and ducking", () => {
  it("starts the wanted music only after unlock, and switches by crossfade", async () => {
    const { ctx, manager } = setup();
    manager.playMusic("music_menu");
    await manager.unlock();
    const looped = ctx.sources.filter((s) => s.loop);
    expect(looped).toHaveLength(1);
    expect(looped[0]?.started).toBe(1);
    manager.playMusic("music_drive");
    const both = ctx.sources.filter((s) => s.loop);
    expect(both).toHaveLength(2);
    const menuGain = looped[0]?.connected[0] as FakeGain;
    const driveGain = both[1]?.connected[0] as FakeGain;
    expect(menuGain.gain.last).toBe(0);
    expect(driveGain.gain.last).toBe(1);
  });

  it("ducks the music bus during missions and restores it", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    const music = ctx.gains[2] as FakeGain;
    manager.setDucked(true);
    expect(music.gain.last).toBe(MUSIC_DUCK_LEVEL);
    manager.setDucked(true);
    expect(music.gain.targets.filter((v) => v === MUSIC_DUCK_LEVEL)).toHaveLength(1);
    manager.setDucked(false);
    expect(music.gain.last).toBe(MUSIC_LEVEL);
  });

  it("keeps the duck while music is off and returns to it when music comes back", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    const music = ctx.gains[2] as FakeGain;
    manager.setDucked(true);
    manager.setToggles({ master: true, sfx: true, music: false });
    expect(music.gain.last).toBe(0);
    manager.setToggles({ master: true, sfx: true, music: true });
    expect(music.gain.last).toBe(MUSIC_DUCK_LEVEL);
  });
});

describe("AudioManager engine", () => {
  it("runs two looping engine voices, pitched together and crossfaded by revs", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    manager.setEngine(engineParams(0, 0, 115));
    const [idle, rev] = ctx.sources.filter((s) => s.loop);
    expect(idle?.started).toBe(1);
    expect(rev?.started).toBe(1);
    const idleGain = idle?.connected[0] as FakeGain;
    const revGain = rev?.connected[0] as FakeGain;
    expect(idleGain.gain.last ?? 0).toBeGreaterThan(0);
    expect(revGain.gain.last).toBeCloseTo(0);

    const fast = engineParams(115, 1, 115);
    manager.setEngine(fast);
    expect(idleGain.gain.last).toBeCloseTo(0);
    expect(revGain.gain.last ?? 0).toBeGreaterThan(0);
    expect(idle?.playbackRate.last).toBeCloseTo(fast.rate);
    expect(rev?.playbackRate.last).toBeCloseTo(fast.rate);
    expect(ctx.sources.filter((s) => s.loop)).toHaveLength(2);
  });

  it("does not touch the audio graph when nothing audible changed", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    const p = engineParams(50, 0.4, 115);
    manager.setEngine(p);
    const idle = ctx.sources.filter((s) => s.loop)[0] as FakeSource;
    const calls = idle.playbackRate.targets.length;
    for (let i = 0; i < 30; i++) manager.setEngine(p);
    expect(idle.playbackRate.targets).toHaveLength(calls);
  });

  it("silences the engine when asked", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    manager.setEngine(engineParams(80, 1, 115));
    manager.setEngine(undefined);
    for (const source of ctx.sources.filter((s) => s.loop)) {
      expect((source.connected[0] as FakeGain).gain.last).toBeCloseTo(0);
    }
  });

  it("drives a skid voice from slip when a skid sample ships", async () => {
    const { ctx, manager } = setup([...SHIPPED, "skid"]);
    await manager.unlock();
    manager.setSkid(0);
    manager.setSkid(1);
    const skid = ctx.sources.filter((s) => s.loop).at(-1) as FakeSource;
    expect((skid.connected[0] as FakeGain).gain.last ?? 0).toBeGreaterThan(0);
    manager.setSkid(0);
    expect((skid.connected[0] as FakeGain).gain.last).toBe(0);
  });

  it("stops every loop and closes the context on dispose", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    manager.setEngine(engineParams(20, 0.5, 115));
    manager.playMusic("music_drive");
    manager.dispose();
    for (const source of ctx.sources.filter((s) => s.loop)) expect(source.stopped).toBe(1);
    expect(ctx.closed).toBe(1);
    expect(manager.play("ui_tap")).toBe(false);
  });
});

describe("AudioManager background", () => {
  it("does nothing before the first gesture", async () => {
    const { ctx, manager } = setup();
    await manager.suspend();
    await manager.resume();
    expect(ctx.suspended).toBe(0);
    expect(ctx.resumed).toBe(0);
  });

  it("suspends a running context and resumes it again", async () => {
    const { ctx, manager } = setup();
    await manager.unlock();
    expect(ctx.state).toBe("running");
    await manager.suspend();
    expect(ctx.suspended).toBe(1);
    expect(ctx.state).toBe("suspended");
    await manager.suspend();
    expect(ctx.suspended).toBe(1);
    await manager.resume();
    expect(ctx.state).toBe("running");
    expect(ctx.resumed).toBe(2);
    await manager.resume();
    expect(ctx.resumed).toBe(2);
  });
});
