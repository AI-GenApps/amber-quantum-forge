import { createMemoryAdapter, createSettingsStore, type HapticsDriver } from "@web-games/kit";
import type { ShiftEvent } from "@web-games/the-last-window-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cueFor,
  cueForShift,
  progressFeedback,
  SERVE_COIN_DELAY_MS,
  SERVE_OUTCOME_DELAY_MS,
  STAR_STAGGER_MS,
  starFeedback,
} from "../src/audio/events";
import { SOUND_IDS } from "../src/audio/slots";
import { createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";

const base = { tick: 1 };

const served = (outcome: "delighted" | "satisfied" | "disappointed", pay = 4): ShiftEvent => ({
  ...base,
  type: "served",
  seat: 0,
  customerId: "regular-2",
  regularId: 2,
  outcome,
  payment: pay,
  tip: 0,
  fp: 1,
  face: "happy",
  scores: { drink: 10, pastry: null, book: null },
});

const ids = (event: ShiftEvent): string[] => cueForShift(event).sounds.map((s) => s.id);
const buzz = (event: ShiftEvent): string[] =>
  cueForShift(event).haptics.map((h) => (h.cue.kind === "impact" ? h.cue.style : h.cue.type));

describe("event map: sounds", () => {
  it("maps the shift events to their slots", () => {
    expect(
      ids({ ...base, type: "customer-seated", seat: 0, customerId: "a", order: {} as never }),
    ).toEqual(["customer-arrive"]);
    expect(ids({ ...base, type: "seat-selected", seat: 1 })).toEqual(["seat-select"]);
    expect(ids({ ...base, type: "oven-ready", plate: 0 })).toEqual(["oven-ready"]);
    expect(ids({ ...base, type: "patience-warning", seat: 0, customerId: "a" })).toEqual([
      "patience-warning",
    ]);
    expect(ids({ ...base, type: "customer-turned-away", customerId: "a" })).toEqual([
      "customer-left",
    ]);
    expect(ids({ ...base, type: "customer-left", seat: 0, customerId: "a", face: "sad" })).toEqual([
      "customer-left",
    ]);
    expect(ids({ ...base, type: "shift-closed" })).toEqual(["shift-end"]);
    expect(ids({ ...base, type: "item-ready", seat: 0, component: "book" })).toEqual(["book-pick"]);
    expect(ids({ ...base, type: "item-ready", seat: 0, component: "drink" })).toEqual([]);
  });

  it("adds the brew, steam, pour and oven sounds to the plain step tap", () => {
    const step = (token: string, station: "drink" | "pastry" = "drink"): ShiftEvent => ({
      ...base,
      type: "step-ok",
      station,
      token: token as never,
      plate: 0,
    });
    expect(ids(step("cup"))).toEqual(["step-tap"]);
    expect(ids(step("brew"))).toEqual(["step-tap", "step-brew"]);
    expect(ids(step("steam"))).toEqual(["step-tap", "step-steam"]);
    expect(ids(step("pour"))).toEqual(["step-tap", "step-pour"]);
    expect(ids(step("warm", "pastry"))).toEqual(["step-tap", "oven-start"]);
    expect(
      ids({
        ...base,
        type: "step-wrong",
        station: "drink",
        token: "pour",
        expected: "brew",
        plate: 0,
      }),
    ).toEqual(["step-wrong"]);
  });

  it("plays serve, then coin, then delighted or disappointed", () => {
    expect(cueForShift(served("delighted")).sounds).toEqual([
      { id: "serve", delayMs: 0 },
      { id: "coin", delayMs: SERVE_COIN_DELAY_MS },
      { id: "delighted", delayMs: SERVE_OUTCOME_DELAY_MS },
    ]);
    expect(ids(served("disappointed"))).toEqual(["serve", "coin", "disappointed"]);
    expect(ids(served("satisfied"))).toEqual(["serve", "coin"]);
    expect(ids(served("satisfied", 0))).toEqual(["serve"]);
  });

  it("maps the interface, story and progress events", () => {
    const sound = (event: Parameters<typeof cueFor>[0]): string[] =>
      cueFor(event).sounds.map((s) => s.id);
    expect(sound({ type: "ui", ui: "tap" })).toEqual(["ui-tap"]);
    expect(sound({ type: "ui", ui: "back" })).toEqual(["ui-back"]);
    expect(sound({ type: "ui", ui: "toggle" })).toEqual(["ui-toggle"]);
    expect(sound({ type: "ui", ui: "sheet" })).toEqual(["ui-open-sheet"]);
    expect(sound({ type: "shift-start" })).toEqual(["shift-start"]);
    expect(sound({ type: "scene-open" })).toEqual(["scene-open"]);
    expect(sound({ type: "choice" })).toEqual(["choice-pick"]);
    expect(sound({ type: "friendship" })).toEqual(["friendship-up"]);
    expect(sound({ type: "ending" })).toEqual(["ending"]);
    expect(sound({ type: "decor-buy" })).toEqual(["decor-buy"]);
    expect(sound({ type: "unlock" })).toEqual(["unlock"]);
    expect(sound({ type: "streak" })).toEqual(["streak-up"]);
  });

  it("only names slots that exist", () => {
    const known = new Set<string>(SOUND_IDS);
    for (const star of [1, 2, 3]) {
      for (const cue of starFeedback(star)) {
        for (const s of cueFor(cue.event).sounds) expect(known.has(s.id)).toBe(true);
      }
    }
  });

  it("reveals stars 120 ms apart and plays the jingle of the final star", () => {
    expect(STAR_STAGGER_MS).toBe(120);
    const cues = starFeedback(3);
    expect(cues.map((c) => c.delayMs)).toEqual([0, 120, 240]);
    expect(cues.flatMap((c) => cueFor(c.event).sounds.map((s) => s.id))).toEqual(["star-3"]);
    expect(starFeedback(1).flatMap((c) => cueFor(c.event).sounds.map((s) => s.id))).toEqual([
      "star-1",
    ]);
    expect(starFeedback(2).flatMap((c) => cueFor(c.event).sounds.map((s) => s.id))).toEqual([
      "star-2",
    ]);
  });

  it("turns friendship levels and unlocks into feedback events", () => {
    expect(
      progressFeedback([
        { type: "friendship-level", regularId: 1, level: 2 },
        { type: "unlock", kind: "drink", id: "drink-2", day: 2 },
        { type: "coins-gained", amount: 5, source: "shift" },
      ]).map((e) => e.type),
    ).toEqual(["friendship", "unlock"]);
  });
});

describe("event map: haptics", () => {
  it("is light on step taps and book picks, medium on serve", () => {
    expect(buzz({ ...base, type: "step-ok", station: "drink", token: "cup", plate: 0 })).toEqual([
      "light",
    ]);
    expect(buzz({ ...base, type: "item-ready", seat: 0, component: "book" })).toEqual(["light"]);
    expect(buzz(served("satisfied"))).toEqual(["medium"]);
  });

  it("adds success on delighted, warning on a wrong step and when a customer leaves", () => {
    expect(buzz(served("delighted"))).toEqual(["medium", "success"]);
    expect(buzz(served("disappointed"))).toEqual(["medium"]);
    expect(
      buzz({
        ...base,
        type: "step-wrong",
        station: "drink",
        token: "pour",
        expected: "brew",
        plate: 0,
      }),
    ).toEqual(["warning"]);
    expect(buzz({ ...base, type: "customer-left", seat: 0, customerId: "a", face: "sad" })).toEqual(
      ["warning"],
    );
  });

  it("is light on a choice, success on each star and friendship level, nothing on navigation", () => {
    const kinds = (event: Parameters<typeof cueFor>[0]): string[] =>
      cueFor(event).haptics.map((h) => (h.cue.kind === "impact" ? h.cue.style : h.cue.type));
    expect(kinds({ type: "choice" })).toEqual(["light"]);
    expect(kinds({ type: "friendship" })).toEqual(["success"]);
    for (const cue of starFeedback(3)) expect(kinds(cue.event)).toEqual(["success"]);
    for (const ui of ["tap", "back", "toggle", "sheet"] as const) {
      expect(kinds({ type: "ui", ui })).toEqual([]);
    }
    expect(buzz({ ...base, type: "seat-selected", seat: 0 })).toEqual([]);
  });
});

describe("feedback wiring", () => {
  type Call = [string, string?];
  let calls: Call[];
  const driver: HapticsDriver = {
    name: "fake",
    impact: (style) => void calls.push(["impact", style]),
    notification: (kind) => void calls.push(["notify", kind]),
    selection: () => void calls.push(["selection"]),
  };

  beforeEach(() => {
    calls = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  function rig() {
    const settings = createSettingsStore(createMemoryAdapter(), "tlw-test");
    const played: string[] = [];
    const audio = {
      play: (id: string) => {
        played.push(id);
        return true;
      },
      syncSettings: vi.fn(),
      setScene: vi.fn(),
      setRain: vi.fn(),
    };
    const haptics = createGameHaptics({ driver });
    const feedback = createFeedback({
      settings,
      audio: audio as never,
      haptics,
    });
    return { settings, played, audio, feedback };
  }

  it("fires the delayed serve sounds and the success haptic on a delighted serve", () => {
    const { feedback, played } = rig();
    feedback.fire({ type: "shift", event: served("delighted") });
    expect(played).toEqual(["serve"]);
    expect(calls).toEqual([["impact", "medium"]]);
    vi.advanceTimersByTime(SERVE_COIN_DELAY_MS);
    expect(played).toEqual(["serve", "coin"]);
    vi.advanceTimersByTime(SERVE_OUTCOME_DELAY_MS);
    expect(played).toEqual(["serve", "coin", "delighted"]);
    expect(calls).toEqual([
      ["impact", "medium"],
      ["notify", "success"],
    ]);
  });

  it("stays silent on haptics when the setting is off and wakes up when it is on", async () => {
    const { feedback, settings } = rig();
    await settings.set({ haptics: false });
    feedback.fire({ type: "choice" });
    expect(calls).toEqual([]);
    await settings.set({ haptics: true });
    feedback.fire({ type: "choice" });
    expect(calls).toEqual([["impact", "light"]]);
  });

  it("pushes the sound and music switches to the audio engine immediately", async () => {
    const { settings, audio } = rig();
    await settings.set({ sound: false });
    expect(audio.syncSettings).toHaveBeenLastCalledWith({ sound: false, music: true });
    await settings.set({ music: false });
    expect(audio.syncSettings).toHaveBeenLastCalledWith({ sound: false, music: false });
  });

  it("cancels a delayed cue", () => {
    const { feedback, played } = rig();
    const cancel = feedback.fireLater({ type: "choice" }, 200);
    cancel();
    vi.advanceTimersByTime(500);
    expect(played).toEqual([]);
    expect(calls).toEqual([]);
  });
});
