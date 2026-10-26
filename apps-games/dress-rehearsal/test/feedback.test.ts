import type { LivePreview, ProgressEvent, RuleResult } from "@web-games/dress-rehearsal-core";
import {
  createMemoryAdapter,
  createSettingsStore,
  type HapticsDriver,
  type ImpactStyle,
  type NotificationKind,
} from "@web-games/kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "../src/audio/engine";
import {
  cueFor,
  type FeedbackEvent,
  progressFeedback,
  resultFeedback,
  STAR_STAGGER_MS,
} from "../src/audio/events";
import { lookCues, ruleTransitions } from "../src/audio/lookCues";
import { SOUND_IDS } from "../src/audio/slots";
import { uiCueFor } from "../src/audio/ui";
import { bindAudioLifecycle, createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

function fakeDriver() {
  const calls: string[] = [];
  const driver: HapticsDriver = {
    name: "fake",
    impact: (style: ImpactStyle) => void calls.push(`impact:${style}`),
    notification: (kind: NotificationKind) => void calls.push(`notify:${kind}`),
    selection: () => void calls.push("selection"),
  };
  return { driver, calls };
}

function fakeAudio() {
  const played: string[] = [];
  const scenes: string[] = [];
  const synced: Array<{ sound: boolean; music: boolean }> = [];
  const audio = {
    play: (id: string) => {
      played.push(id);
      return true;
    },
    setScene: (scene: string) => void scenes.push(scene),
    syncSettings: (enabled: { sound: boolean; music: boolean }) => void synced.push(enabled),
  } as unknown as AudioEngine;
  return { audio, played, scenes, synced };
}

async function rig(haptics = true) {
  const settings = createSettingsStore(createMemoryAdapter(), "dr-test");
  await settings.load();
  await settings.set({ haptics });
  const { driver, calls } = fakeDriver();
  const sound = fakeAudio();
  const feedback = createFeedback({
    settings,
    audio: sound.audio,
    haptics: createGameHaptics({ driver }),
  });
  return { feedback, settings, calls, ...sound };
}

const ALL_EVENTS: FeedbackEvent[] = [
  { type: "ui", ui: "tap" },
  { type: "ui", ui: "back" },
  { type: "ui", ui: "toggle" },
  { type: "ui", ui: "sheet" },
  { type: "tab" },
  { type: "pick" },
  { type: "place" },
  { type: "swap" },
  { type: "remove" },
  { type: "invalid" },
  { type: "rule-met" },
  { type: "rule-broken" },
  { type: "look-complete" },
  { type: "finish" },
  { type: "star", index: 1, total: 1 },
  { type: "star", index: 2, total: 2 },
  { type: "star", index: 3, total: 3 },
  { type: "result-miss" },
  { type: "hint" },
  { type: "coins" },
  { type: "unlock", what: "chapter" },
  { type: "unlock", what: "frame" },
  { type: "unlock", what: "affinity" },
  { type: "streak" },
  { type: "export" },
  { type: "frame" },
];

describe("event to cue table", () => {
  it("maps every event to a sound that exists in the slot table", () => {
    for (const event of ALL_EVENTS) {
      const { sound } = cueFor(event);
      if (sound !== null) expect(SOUND_IDS).toContain(sound);
    }
    const used = new Set(ALL_EVENTS.map((event) => cueFor(event).sound));
    for (const id of SOUND_IDS.filter((entry) => !entry.startsWith("music-"))) {
      expect(used.has(id), `${id} has an event`).toBe(true);
    }
  });

  it("plays the documented sound for each game event", () => {
    const sound = (event: FeedbackEvent) => cueFor(event).sound;
    expect(sound({ type: "tab" })).toBe("ui-tab");
    expect(sound({ type: "pick" })).toBe("item-pick");
    expect(sound({ type: "place" })).toBe("item-place");
    expect(sound({ type: "swap" })).toBe("item-swap");
    expect(sound({ type: "remove" })).toBe("item-remove");
    expect(sound({ type: "invalid" })).toBe("item-invalid");
    expect(sound({ type: "rule-met" })).toBe("rule-met");
    expect(sound({ type: "rule-broken" })).toBe("rule-broken");
    expect(sound({ type: "look-complete" })).toBe("look-complete");
    expect(sound({ type: "finish" })).toBe("finish-look");
    expect(sound({ type: "result-miss" })).toBe("result-miss");
    expect(sound({ type: "hint" })).toBe("hint-use");
    expect(sound({ type: "coins" })).toBe("coin-gain");
    expect(sound({ type: "unlock", what: "chapter" })).toBe("unlock");
    expect(sound({ type: "streak" })).toBe("streak-up");
    expect(sound({ type: "export" })).toBe("export-shutter");
    expect(sound({ type: "frame" })).toBe("frame-select");
    expect(sound({ type: "ui", ui: "sheet" })).toBe("ui-open-sheet");
  });

  it("matches the haptic map exactly", () => {
    const haptic = (event: FeedbackEvent) => cueFor(event).haptic;
    const light = { kind: "impact", style: "light" };
    const success = { kind: "notify", type: "success" };
    expect(haptic({ type: "place" })).toEqual(light);
    expect(haptic({ type: "swap" })).toEqual(light);
    expect(haptic({ type: "invalid" })).toEqual({ kind: "notify", type: "warning" });
    expect(haptic({ type: "finish" })).toEqual({ kind: "impact", style: "medium" });
    expect(haptic({ type: "star", index: 1, total: 2 })).toEqual(success);
    expect(haptic({ type: "unlock", what: "chapter" })).toEqual(success);
    expect(haptic({ type: "unlock", what: "frame" })).toEqual(success);
    expect(haptic({ type: "unlock", what: "affinity" })).toEqual(success);
    expect(haptic({ type: "streak" })).toEqual(success);
  });

  it("never vibrates on plain button taps, tab changes or tray picks", () => {
    for (const event of ALL_EVENTS) {
      const vibrates = cueFor(event).haptic !== null;
      const expected = ["place", "swap", "invalid", "finish", "star", "unlock", "streak"].includes(
        event.type,
      );
      expect(vibrates, event.type).toBe(expected);
    }
  });

  it("plays one star jingle matching the count, on the last star", () => {
    expect(cueFor({ type: "star", index: 1, total: 3 }).sound).toBeNull();
    expect(cueFor({ type: "star", index: 2, total: 3 }).sound).toBeNull();
    expect(cueFor({ type: "star", index: 3, total: 3 }).sound).toBe("star-3");
    expect(cueFor({ type: "star", index: 2, total: 2 }).sound).toBe("star-2");
    expect(cueFor({ type: "star", index: 1, total: 1 }).sound).toBe("star-1");
  });
});

describe("result and progression cues", () => {
  it("staggers one cue per star by 120 ms and uses the miss cue for zero stars", () => {
    expect(STAR_STAGGER_MS).toBe(120);
    expect(resultFeedback(3).map((entry) => entry.delayMs)).toEqual([0, 120, 240]);
    expect(resultFeedback(1)).toHaveLength(1);
    expect(resultFeedback(0)).toEqual([{ delayMs: 0, event: { type: "result-miss" } }]);
  });

  it("derives coins, one unlock chime and the streak from progress events", () => {
    const events: ProgressEvent[] = [
      { type: "coins-gained", amount: 60, reason: "star" },
      { type: "chapter-unlocked", chapterIndex: 2 },
      { type: "chapter-unlocked", chapterIndex: 3 },
    ];
    expect(progressFeedback(events, true).map((event) => event.type)).toEqual([
      "coins",
      "unlock",
      "streak",
    ]);
    expect(progressFeedback(null)).toEqual([]);
    expect(progressFeedback([{ type: "coins-gained", amount: 0, reason: "star" }])).toEqual([]);
  });
});

function rule(code: string, met: boolean): RuleResult {
  return { code, met, chip: code, detail: "", rule: {} as RuleResult["rule"] };
}

function preview(rules: RuleResult[], complete = false): LivePreview {
  return { rules, complete, missing: [], metCount: 0, harmony: {} as LivePreview["harmony"] };
}

describe("look cues", () => {
  it("counts rules that flipped", () => {
    expect(
      ruleTransitions([rule("a", false), rule("b", true)], [rule("a", true), rule("b", false)]),
    ).toEqual({ met: 1, broken: 1 });
    expect(ruleTransitions([], [rule("a", true)])).toEqual({ met: 0, broken: 0 });
  });

  it("plays rule-met, lets rule-broken win, and chimes when the look completes", () => {
    const met = lookCues(preview([rule("a", false)]), preview([rule("a", true)]));
    expect(met.map((cue) => cue.event.type)).toEqual(["rule-met"]);
    const broken = lookCues(
      preview([rule("a", false), rule("b", true)]),
      preview([rule("a", true), rule("b", false)]),
    );
    expect(broken.map((cue) => cue.event.type)).toEqual(["rule-broken"]);
    const done = lookCues(preview([rule("a", true)], false), preview([rule("a", true)], true));
    expect(done.map((cue) => cue.event.type)).toEqual(["look-complete"]);
    const stays = lookCues(preview([rule("a", true)], true), preview([rule("a", true)], true));
    expect(stays).toEqual([]);
  });
});

describe("feedback dispatcher", () => {
  it("sends the sound and the haptic of an event to the manager and the driver", async () => {
    const r = await rig();
    r.feedback.fire({ type: "place" });
    r.feedback.fire({ type: "invalid" });
    r.feedback.fire({ type: "finish" });
    r.feedback.fire({ type: "tab" });
    r.feedback.fire({ type: "unlock", what: "frame" });
    expect(r.played).toEqual(["item-place", "item-invalid", "finish-look", "ui-tab", "unlock"]);
    expect(r.calls).toEqual(["impact:light", "notify:warning", "impact:medium", "notify:success"]);
  });

  it("is silent for haptics when the setting is off and follows the switch at once", async () => {
    const r = await rig(false);
    r.feedback.fire({ type: "place" });
    r.feedback.fire({ type: "streak" });
    expect(r.calls).toEqual([]);
    expect(r.played).toEqual(["item-place", "streak-up"]);
    await r.settings.set({ haptics: true });
    r.feedback.fire({ type: "place" });
    expect(r.calls).toEqual(["impact:light"]);
    await r.settings.set({ haptics: false });
    r.feedback.fire({ type: "place" });
    expect(r.calls).toEqual(["impact:light"]);
  });

  it("syncs sound and music switches into the audio engine", async () => {
    const r = await rig();
    expect(r.synced.at(-1)).toEqual({ sound: true, music: true });
    await r.settings.set({ sound: false });
    expect(r.synced.at(-1)).toEqual({ sound: false, music: true });
    await r.settings.set({ music: false });
    expect(r.synced.at(-1)).toEqual({ sound: false, music: false });
  });

  it("delays cues and can cancel them", async () => {
    vi.useFakeTimers();
    const r = await rig();
    const cancel = r.feedback.fireLater({ type: "coins" }, 200);
    r.feedback.fireLater({ type: "streak" }, 300);
    r.feedback.fireLater({ type: "hint" }, 0);
    expect(r.played).toEqual(["hint-use"]);
    cancel();
    vi.advanceTimersByTime(400);
    expect(r.played).toEqual(["hint-use", "streak-up"]);
  });

  it("forwards the scene to the audio engine", async () => {
    const r = await rig();
    r.feedback.setScene("style");
    expect(r.scenes).toEqual(["style"]);
  });

  it("swallows driver failures and never throws into game code", () => {
    const onError = vi.fn();
    const haptics = createGameHaptics({
      driver: {
        name: "broken",
        impact: () => {
          throw new Error("boom");
        },
        notification: () => Promise.reject(new Error("nope")),
        selection: () => undefined,
      },
      onError,
    });
    expect(() => haptics.fire({ kind: "impact", style: "light" })).not.toThrow();
    expect(() => haptics.fire({ kind: "notify", type: "success" })).not.toThrow();
    expect(() => haptics.fire(null)).not.toThrow();
  });
});

describe("audio lifecycle", () => {
  it("suspends on pause and resumes on return", () => {
    const audio = { suspend: vi.fn(async () => undefined), resume: vi.fn(async () => undefined) };
    let pause = () => {};
    let resume = () => {};
    const off = bindAudioLifecycle(audio, {
      onPause: (cb: () => void) => {
        pause = cb;
        return () => undefined;
      },
      onResume: (cb: () => void) => {
        resume = cb;
        return () => undefined;
      },
    });
    pause();
    expect(audio.suspend).toHaveBeenCalledTimes(1);
    resume();
    expect(audio.resume).toHaveBeenCalledTimes(1);
    off();
  });
});

describe("interface sound routing", () => {
  function button(html: string): HTMLButtonElement {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    return host.querySelector("button") as HTMLButtonElement;
  }

  it("gives plain buttons the tap sound and leaves own-sound areas alone", () => {
    expect(uiCueFor(button("<button>Play</button>"))).toBe("tap");
    expect(uiCueFor(button('<div data-sfx="own"><button>Piece</button></div>'))).toBeNull();
    expect(uiCueFor(button('<button role="tab">Tops</button>'))).toBeNull();
    expect(uiCueFor(button('<button role="switch">Sound</button>'))).toBe("toggle");
    expect(uiCueFor(button('<button aria-label="Back">x</button>'))).toBe("back");
    expect(uiCueFor(button("<button disabled>Nope</button>"))).toBeNull();
    expect(uiCueFor(document.body)).toBeNull();
    expect(uiCueFor(null)).toBeNull();
  });
});
