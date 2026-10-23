import { getMap, type PieceKind } from "@web-games/floodplain-dispatch-core";
import {
  createMemoryAdapter,
  createSettingsStore,
  type HapticsDriver,
  type ImpactStyle,
  type NotificationKind,
} from "@web-games/kit";
import { describe, expect, it } from "vitest";
import type { AudioEngine } from "../src/audio/engine";
import {
  cueFor,
  economyFeedback,
  type FeedbackEvent,
  PLACE_SOUND,
  resultFeedback,
  STAR_STAGGER_MS,
} from "../src/audio/events";
import {
  flowLevel,
  newBadgeEvents,
  playbackFeedback,
  surgeReached,
} from "../src/audio/playbackEvents";
import { SOUND_IDS } from "../src/audio/slots";
import { uiCueFor } from "../src/audio/ui";
import type { Badge } from "../src/board/model";
import { bindAudioLifecycle, createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";

const PIECES: PieceKind[] = ["canal", "barrier", "pump", "gate", "reservoir"];

function fakeDriver(): HapticsDriver & { log: string[] } {
  const log: string[] = [];
  return {
    name: "fake",
    log,
    impact: (style: ImpactStyle) => void log.push(`impact:${style}`),
    notification: (kind: NotificationKind) => void log.push(`notify:${kind}`),
    selection: () => void log.push("selection"),
  };
}

function fakeAudio(): AudioEngine & { played: string[]; scene: string; flows: number[] } {
  const played: string[] = [];
  const flows: number[] = [];
  const settings: Array<{ sound: boolean; music: boolean }> = [];
  const audio = {
    played,
    flows,
    settings,
    scene: "off",
    progress: 1,
    play: (id: string) => {
      played.push(id);
      return true;
    },
    setScene(next: string) {
      audio.scene = next;
    },
    setFlow: (level: number) => void flows.push(level),
    syncSettings: (value: { sound: boolean; music: boolean }) => void settings.push(value),
  };
  return audio as unknown as AudioEngine & { played: string[]; scene: string; flows: number[] };
}

describe("event table", () => {
  const events: FeedbackEvent[] = [
    { type: "ui", ui: "tap" },
    { type: "ui", ui: "back" },
    { type: "ui", ui: "toggle" },
    { type: "ui", ui: "sheet" },
    ...PIECES.map((piece): FeedbackEvent => ({ type: "place", piece })),
    { type: "remove" },
    { type: "rotate" },
    { type: "invalid" },
    { type: "run" },
    { type: "surge" },
    { type: "badge", badge: "house-supplied" },
    { type: "badge", badge: "field-irrigated" },
    { type: "badge", badge: "house-flooded" },
    { type: "star", index: 1, total: 1 },
    { type: "star", index: 2, total: 2 },
    { type: "star", index: 3, total: 3 },
    { type: "result-fail" },
    { type: "unlock", what: "region" },
    { type: "unlock", what: "theme" },
    { type: "streak" },
  ];

  it("maps every event to a known sound slot", () => {
    for (const event of events) {
      const sound = cueFor(event).sound;
      if (sound) expect(SOUND_IDS, JSON.stringify(event)).toContain(sound);
    }
  });

  it("uses every sound slot except the loops and the intermediate stars", () => {
    const used = new Set(events.map((event) => cueFor(event).sound));
    for (const id of SOUND_IDS) {
      if (id === "water-loop" || id === "music-menu" || id === "music-play") continue;
      expect(used.has(id), id).toBe(true);
    }
  });

  it("gives each piece its own placing sound", () => {
    expect(new Set(PIECES.map((piece) => PLACE_SOUND[piece])).size).toBe(5);
    expect(cueFor({ type: "place", piece: "gate" }).sound).toBe("place-gate");
  });

  it("follows the haptic map exactly", () => {
    const haptic = (event: FeedbackEvent) => cueFor(event).haptic;
    const light = { kind: "impact", style: "light" };
    expect(haptic({ type: "place", piece: "canal" })).toEqual(light);
    expect(haptic({ type: "rotate" })).toEqual(light);
    expect(haptic({ type: "invalid" })).toEqual({ kind: "notify", type: "warning" });
    expect(haptic({ type: "run" })).toEqual({ kind: "impact", style: "medium" });
    expect(haptic({ type: "badge", badge: "house-flooded" })).toEqual({
      kind: "notify",
      type: "error",
    });
    const success = { kind: "notify", type: "success" };
    expect(haptic({ type: "star", index: 1, total: 3 })).toEqual(success);
    expect(haptic({ type: "unlock", what: "region" })).toEqual(success);
    expect(haptic({ type: "unlock", what: "theme" })).toEqual(success);
  });

  it("is silent on plain button taps and on events with no haptic", () => {
    for (const ui of ["tap", "back", "toggle", "sheet"] as const) {
      expect(cueFor({ type: "ui", ui }).haptic).toBeNull();
    }
    for (const event of [
      { type: "remove" },
      { type: "surge" },
      { type: "streak" },
      { type: "result-fail" },
      { type: "badge", badge: "house-supplied" },
      { type: "badge", badge: "field-irrigated" },
    ] satisfies FeedbackEvent[]) {
      expect(cueFor(event).haptic).toBeNull();
    }
  });

  it("plays one star sound for the final star count and a success per star", () => {
    for (const total of [1, 2, 3]) {
      const reveal = resultFeedback(total);
      expect(reveal.map((entry) => entry.delayMs)).toEqual(
        Array.from({ length: total }, (_, i) => i * STAR_STAGGER_MS),
      );
      const sounds = reveal.map((entry) => cueFor(entry.event).sound);
      expect(sounds.filter((sound) => sound !== null)).toEqual([`star-${total}`]);
      expect(reveal.every((entry) => cueFor(entry.event).haptic?.kind === "notify")).toBe(true);
    }
    const fail = resultFeedback(0);
    expect(fail).toHaveLength(1);
    expect(cueFor(fail[0]?.event as FeedbackEvent)).toEqual({ sound: "result-fail", haptic: null });
    expect(STAR_STAGGER_MS).toBe(120);
  });

  it("turns economy events into unlock and streak feedback", () => {
    const out = economyFeedback([
      { type: "coins-gained", amount: 5, reason: "star-gained" },
      { type: "region-unlocked", region: "delta" },
      { type: "theme-unlocked", themeId: "harvest-ochre" },
      { type: "streak-extended", streak: 3 },
      { type: "streak-reset" },
    ]);
    expect(out).toEqual([
      { type: "unlock", what: "region" },
      { type: "unlock", what: "theme" },
      { type: "streak" },
    ]);
    expect(economyFeedback(null)).toEqual([]);
  });
});

describe("playback events", () => {
  const badge = (kind: Badge["kind"], x: number, target: Badge["target"] = "house"): Badge => ({
    x,
    y: 0,
    kind,
    target,
  });

  it("reports only badges that appeared, one event per kind", () => {
    const before = [badge("supplied", 0)];
    const after = [
      badge("supplied", 0),
      badge("supplied", 1),
      badge("supplied", 2),
      badge("irrigated", 3, "field"),
      badge("flooded", 4),
    ];
    expect(newBadgeEvents(before, after)).toEqual([
      { type: "badge", badge: "house-supplied" },
      { type: "badge", badge: "field-irrigated" },
      { type: "badge", badge: "house-flooded" },
    ]);
    expect(newBadgeEvents(after, after)).toEqual([]);
    expect(newBadgeEvents([badge("dry", 0)], [badge("dry", 0)])).toEqual([]);
  });

  it("detects the first step of a surge week", () => {
    const def = getMap("v04");
    const surge = def.events.find((event) => event.type === "surge");
    expect(surge).toBeDefined();
    const week = surge?.week ?? 0;
    expect(surgeReached(def, week * 4 - 1, week * 4)).toBe(true);
    expect(surgeReached(def, week * 4, week * 4 + 1)).toBe(false);
    expect(surgeReached(def, week * 4 + 1, week * 4)).toBe(false);
    expect(surgeReached(getMap("v01"), 0, 80)).toBe(false);
  });

  it("stays quiet for scrubs and the skip jump", () => {
    const def = getMap("v04");
    const week = def.events.find((event) => event.type === "surge")?.week ?? 0;
    const from = { pos: 0, badges: [] };
    const to = { pos: week * 4, badges: [badge("supplied", 0)] };
    expect(playbackFeedback(def, from, to)).toEqual([]);
    expect(playbackFeedback(def, { pos: week * 4 - 1, badges: [] }, to)).toEqual([
      { type: "surge" },
      { type: "badge", badge: "house-supplied" },
    ]);
    expect(playbackFeedback(def, to, from)).toEqual([]);
  });

  it("scales the water level with the wet share of the board", () => {
    expect(flowLevel(new Uint8Array(100), 100)).toBe(0);
    const some = new Uint8Array(100);
    some.fill(1, 0, 10);
    expect(flowLevel(some, 100)).toBeCloseTo(0.4);
    expect(flowLevel(new Uint8Array(100).fill(3), 100)).toBe(1);
    expect(flowLevel(new Uint8Array(0), 0)).toBe(0);
  });
});

describe("interface sounds", () => {
  const html = (markup: string): Element => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    return host.firstElementChild as Element;
  };

  it("classifies clicks on buttons, back, switches, disabled buttons and Run", () => {
    expect(uiCueFor(html("<button><span>x</span></button>").firstElementChild)).toBe("tap");
    expect(uiCueFor(html('<button aria-label="Back">x</button>'))).toBe("back");
    expect(uiCueFor(html('<button role="switch" aria-checked="true">x</button>'))).toBe("toggle");
    expect(uiCueFor(html("<button disabled>x</button>"))).toBeNull();
    expect(uiCueFor(html('<button class="wg-btn fd-run">Run</button>'))).toBeNull();
    expect(uiCueFor(html("<div>no button</div>"))).toBeNull();
    expect(uiCueFor(null)).toBeNull();
  });
});

describe("haptics wiring", () => {
  it("fires the exact cue on the driver", () => {
    const driver = fakeDriver();
    const haptics = createGameHaptics({ driver });
    haptics.fire({ kind: "impact", style: "light" });
    haptics.fire({ kind: "impact", style: "medium" });
    haptics.fire({ kind: "notify", type: "warning" });
    haptics.fire({ kind: "notify", type: "error" });
    haptics.fire({ kind: "notify", type: "success" });
    haptics.fire(null);
    expect(driver.log).toEqual([
      "impact:light",
      "impact:medium",
      "notify:warning",
      "notify:error",
      "notify:success",
    ]);
  });

  it("is silent when the haptics setting is off, and the toggle takes effect at once", async () => {
    const driver = fakeDriver();
    const settings = createSettingsStore(createMemoryAdapter(), "test");
    await settings.load();
    const feedback = createFeedback({
      audio: fakeAudio(),
      haptics: createGameHaptics({ driver }),
      settings,
    });
    feedback.fire({ type: "place", piece: "canal" });
    expect(driver.log).toEqual(["impact:light"]);
    await settings.set({ haptics: false });
    feedback.fire({ type: "place", piece: "canal" });
    feedback.fire({ type: "invalid" });
    expect(driver.log).toEqual(["impact:light"]);
    await settings.set({ haptics: true });
    feedback.fire({ type: "invalid" });
    expect(driver.log).toEqual(["impact:light", "notify:warning"]);
  });

  it("does nothing on a platform without haptics and never throws", () => {
    const haptics = createGameHaptics({
      driver: {
        name: "broken",
        impact: () => {
          throw new Error("no motor");
        },
        notification: () => Promise.reject(new Error("no motor")),
        selection: () => undefined,
      },
    });
    expect(() => haptics.fire({ kind: "impact", style: "light" })).not.toThrow();
    expect(() => haptics.fire({ kind: "notify", type: "error" })).not.toThrow();
    expect(createGameHaptics().haptics.driverName).toBe("noop");
  });
});

describe("feedback dispatcher", () => {
  it("sends the sound and the haptic of an event", async () => {
    const driver = fakeDriver();
    const audio = fakeAudio();
    const settings = createSettingsStore(createMemoryAdapter(), "test");
    const feedback = createFeedback({ audio, haptics: createGameHaptics({ driver }), settings });
    feedback.fire({ type: "run" });
    feedback.fire({ type: "ui", ui: "tap" });
    expect(audio.played).toEqual(["run-start", "ui-tap"]);
    expect(driver.log).toEqual(["impact:medium"]);
    feedback.setScene("play");
    feedback.setFlow(0.3);
    expect(audio.scene).toBe("play");
    expect(audio.flows).toEqual([0.3]);
  });

  it("pushes the sound and music switches to the audio engine as they change", async () => {
    const audio = fakeAudio();
    const settings = createSettingsStore(createMemoryAdapter(), "test");
    await settings.load();
    createFeedback({ audio, haptics: createGameHaptics({ driver: fakeDriver() }), settings });
    await settings.set({ sound: false });
    await settings.set({ music: false });
    const log = (audio as unknown as { settings: Array<{ sound: boolean; music: boolean }> })
      .settings;
    expect(log.at(0)).toEqual({ sound: true, music: true });
    expect(log.at(-2)).toEqual({ sound: false, music: true });
    expect(log.at(-1)).toEqual({ sound: false, music: false });
  });

  it("delays staggered events and lets the caller cancel them", () => {
    const audio = fakeAudio();
    const settings = createSettingsStore(createMemoryAdapter(), "test");
    const feedback = createFeedback({
      audio,
      haptics: createGameHaptics({ driver: fakeDriver() }),
      settings,
    });
    const cancel = feedback.fireLater({ type: "streak" }, 5);
    cancel();
    feedback.fireLater({ type: "ui", ui: "back" }, 0);
    expect(audio.played).toEqual(["ui-back"]);
  });

  it("suspends and resumes audio with the app lifecycle", () => {
    const calls: string[] = [];
    const listeners: Record<string, () => void> = {};
    const off = bindAudioLifecycle(
      {
        suspend: async () => void calls.push("suspend"),
        resume: async () => void calls.push("resume"),
      },
      {
        onPause: (listener) => {
          listeners.pause = listener;
          return () => delete listeners.pause;
        },
        onResume: (listener) => {
          listeners.resume = listener;
          return () => delete listeners.resume;
        },
      },
    );
    listeners.pause?.();
    listeners.resume?.();
    expect(calls).toEqual(["suspend", "resume"]);
    off();
    expect(Object.keys(listeners)).toEqual([]);
  });
});
