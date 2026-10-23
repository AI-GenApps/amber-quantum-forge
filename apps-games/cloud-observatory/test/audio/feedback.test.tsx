import {
  createAudioManager,
  createFakeAudioContext,
  createHaptics,
  type FakeContext,
  type HapticsDriver,
} from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { CUE_IDS, CUES, createGameAudio, type GameAudio } from "../../src/audio/cues";
import { createFeedback } from "../../src/audio/feedback";
import { START_MS } from "../session/harness";
import { cleanup, goTab, openScreen, renderApp } from "../ui/harness";

afterEach(cleanup);

interface Rig {
  readonly ctx: FakeContext;
  readonly audio: GameAudio;
  readonly calls: string[];
  /** Cue ids played so far, in order. */
  sounds(): string[];
}

/** A real pipeline over a fake audio context and a recording haptics driver. */
async function pipeline(): Promise<Rig & { make: Parameters<typeof renderApp>[0] }> {
  const ctx = createFakeAudioContext();
  const sizes = new Map<number, string>();
  const manager = createAudioManager({
    createContext: () => ctx,
    fetchBuffer: async (url) => {
      const id = url.replace(/^.*\//, "").replace(/\.mp3$/, "");
      const bytes = 10 + sizes.size;
      sizes.set(bytes, id);
      return new ArrayBuffer(bytes);
    },
  });
  const audio = createGameAudio(manager, { now: () => 0, random: () => 0.5 });
  await audio.unlock();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const calls: string[] = [];
  const driver: HapticsDriver = {
    name: "recording",
    impact: (style) => void calls.push(`impact:${style}`),
    notification: (kind) => void calls.push(`notify:${kind}`),
    selection: () => void calls.push("selection"),
  };
  const haptics = createHaptics({ driver });
  const rig: Rig = {
    ctx,
    audio,
    calls,
    sounds: () =>
      ctx.sources
        .filter((source) => !source.loop)
        .map((source) => sizes.get((source.buffer as { decoded: number }).decoded) ?? "?"),
  };
  return {
    ...rig,
    make: { wrapFeedback: (harness) => createFeedback(audio, haptics, harness.session.settings) },
  };
}

async function started(seed: Parameters<typeof renderApp>[0] = {}) {
  const rig = await pipeline();
  const r = await renderApp({ ...seed, ...rig.make });
  rig.calls.length = 0;
  return { rig, r, since: () => rig.sounds() };
}

const READY = { game: { starlight: 100, owned: { telescope: 2 } } };

describe("feedback pipeline", () => {
  it("covers every cue id with a file", () => {
    for (const id of CUE_IDS) expect(CUES[id].file).toBe(`${id}.mp3`);
  });

  it("Gather plays its cue once and has no haptic", async () => {
    const { rig, r, since } = await started();
    await r.click(r.q(".co-gather"));
    expect(since()).toEqual(["gather"]);
    expect(rig.calls).toEqual([]);
  });

  it("buying an instrument plays buy and a light impact once", async () => {
    const { rig, r, since } = await started({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    const mark = since().length;
    await r.click(r.q("[data-buy='telescope']"));
    const played = since().slice(mark);
    expect(played.filter((id) => id === "buy")).toHaveLength(1);
    expect(played.filter((id) => id === "lore")).toHaveLength(1);
    expect(rig.calls).toEqual(["impact:light"]);
  });

  it("buying an upgrade plays upgrade and a light impact once", async () => {
    const { rig, r, since } = await started({
      seed: { game: { starlight: 10000, owned: { telescope: 10 } } },
    });
    await goTab(r, "build");
    const mark = since().length;
    await r.click(r.q("[data-upgrade='u-telescope-1']"));
    expect(since().slice(mark)).toEqual(["upgrade"]);
    expect(rig.calls).toEqual(["impact:light"]);
  });

  it("a correct star lights lightly, a wrong star warns, the last star finishes the chart", async () => {
    const { rig, r, since } = await started({ seed: READY });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    const mark = since().length;
    rig.calls.length = 0;
    await r.click(r.q('[data-star="3"]'));
    expect(since().slice(mark)).toEqual(["star-miss"]);
    expect(rig.calls).toEqual(["notify:warning"]);

    rig.calls.length = 0;
    await r.click(r.q('[data-star="0"]'));
    expect(rig.calls).toEqual(["impact:light"]);

    for (const index of [1, 2, 3]) await r.click(r.q(`[data-star="${index}"]`));
    rig.calls.length = 0;
    const before = since().length;
    await r.click(r.q('[data-star="4"]'));
    const played = since().slice(before);
    expect(played.filter((id) => id === "star-ok")).toHaveLength(1);
    expect(played.filter((id) => id === "chart-done")).toHaveLength(1);
    expect(played.indexOf("star-ok")).toBeLessThan(played.indexOf("chart-done"));
    expect(played).toContain("achievement");
    expect(rig.calls.filter((call) => call === "impact:light")).toHaveLength(1);
    expect(rig.calls.filter((call) => call === "notify:success")).toHaveLength(
      played.filter((id) => id === "chart-done" || id === "achievement").length,
    );
  });

  it("the Eclipse plays its cue and a medium impact once", async () => {
    const { rig, r, since } = await started({
      seed: { game: { starlight: 5e9, cycleStarlight: 4e10, lifetimeStarlight: 4e10 } },
    });
    await goTab(r, "eclipse");
    await r.click(r.q(".co-eclipse-btn"));
    const mark = since().length;
    rig.calls.length = 0;
    await r.click(r.q(".co-eclipse-confirm"));
    expect(
      since()
        .slice(mark)
        .filter((id) => id === "eclipse"),
    ).toHaveLength(1);
    expect(rig.calls.filter((call) => call === "impact:medium")).toHaveLength(1);
  });

  it("buying a boon plays buy and a light impact once", async () => {
    const { rig, r, since } = await started({
      seed: { game: { shards: 20, shardsEarned: 20, eclipses: 1 } },
    });
    await goTab(r, "eclipse");
    const mark = since().length;
    rig.calls.length = 0;
    await r.click(r.q("[data-buy-boon]:not([disabled])"));
    const played = since().slice(mark);
    expect(played.filter((id) => id === "buy")).toHaveLength(1);
    expect(rig.calls).toEqual(["impact:light"]);
  });

  it("the Comet plays its cue and a success once", async () => {
    const { rig, r, since } = await started({ seed: { game: { charted: ["lyre"] } } });
    await openScreen(r, "comet");
    const mark = since().length;
    rig.calls.length = 0;
    const stars = r.qa("[data-star]");
    for (let index = 0; index < stars.length; index += 1)
      await r.click(r.q(`[data-star="${index}"]`));
    const played = since().slice(mark);
    expect(played.filter((id) => id === "comet")).toHaveLength(1);
    expect(rig.calls.filter((call) => call === "notify:success")).toHaveLength(1);
  });

  it("buttons play click and back", async () => {
    const { rig, r, since } = await started();
    await goTab(r, "build");
    expect(since()).toEqual(["click"]);
    await r.click(r.q(".wg-btn--icon, [aria-label='Open menu']"));
    await openScreen(r, "settings");
    await r.click(r.q("[aria-label='Back']"));
    expect(since().at(-1)).toBe("back");
    expect(rig.calls).toEqual([]);
  });

  it("Welcome Back plays its cue once when the sheet opens", async () => {
    const { since } = await started({
      seed: {
        game: { owned: { telescope: 10 } },
        profile: { lastSeenMs: START_MS - 2 * 3600 * 1000 },
      },
    });
    expect(since().filter((id) => id === "welcome")).toHaveLength(1);
  });
});

describe("settings take effect immediately", () => {
  it("sound off silences cues, music off stops the loop, haptics off silences impacts", async () => {
    const { rig, r, since } = await started({ seed: READY });
    const settings = r.harness.session.settings;

    await settings.set({ haptics: false });
    await goTab(r, "build");
    rig.calls.length = 0;
    await r.click(r.q("[data-buy='telescope']"));
    expect(rig.calls).toEqual([]);

    await settings.set({ sound: false });
    const before = since().length;
    await r.click(r.q(".co-tabs [role='tab']"));
    await r.click(r.q(".co-gather"));
    expect(since()).toHaveLength(before);

    await settings.set({ sound: true, haptics: true });
    await r.click(r.q(".co-gather"));
    expect(since().at(-1)).toBe("gather");
    await goTab(r, "build");
    rig.calls.length = 0;
    await r.click(r.q("[data-buy='telescope']"));
    expect(rig.calls).toEqual(["impact:light"]);

    expect(rig.ctx.sources.some((source) => source.loop)).toBe(true);
    await settings.set({ music: false });
    const loop = rig.ctx.sources.find((source) => source.loop);
    expect(loop?.stopped.length).toBeGreaterThan(0);
  });

  it("the choices persist in storage", async () => {
    const { r } = await started();
    await r.harness.session.settings.set({ sound: false, music: false, haptics: false });
    const stored = [...r.harness.adapter.entries.entries()].find(([key]) =>
      key.endsWith(".settings"),
    );
    expect(stored?.[1]).toContain('"sound":false');
    expect(stored?.[1]).toContain('"haptics":false');
  });
});
