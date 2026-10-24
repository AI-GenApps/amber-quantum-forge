import type { HapticsDriver } from "@web-games/kit";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "../src/audio/engine";
import { createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";
import {
  buttonByText,
  click,
  mountApp,
  progress,
  q,
  type Rig,
  type RigOptions,
  tap,
  tapStarting,
} from "./helpers";

interface Log {
  played: string[];
  haptics: string[];
  scenes: string[];
  typing: boolean[];
}

const log: Log = { played: [], haptics: [], scenes: [], typing: [] };
let rig: Rig | null = null;

const driver: HapticsDriver = {
  name: "test",
  impact: (style) => void log.haptics.push(`impact:${style}`),
  notification: (kind) => void log.haptics.push(`notify:${kind}`),
  selection: () => void log.haptics.push("selection"),
};

const engine = {
  progress: 1,
  scene: "off",
  typing: false,
  play: (id: string) => {
    log.played.push(id);
    return true;
  },
  setScene: (scene: string) => void log.scenes.push(scene),
  setTyping: (on: boolean) => void log.typing.push(on),
  syncSettings: () => undefined,
} as unknown as AudioEngine;

const feedbackFor: NonNullable<RigOptions["feedback"]> = (settings) =>
  createFeedback({ audio: engine, haptics: createGameHaptics({ driver }), settings });

beforeEach(() => {
  log.played = [];
  log.haptics = [];
  log.scenes = [];
  log.typing = [];
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const root = () => rig?.container as HTMLElement;
const gameSounds = (): string[] =>
  log.played.filter((id) => !id.startsWith("ui-") && id !== "achievement");

async function openBoard(): Promise<Rig> {
  return mountApp({ route: ["table", { caseId: "01" }], feedback: feedbackFor });
}

describe("sound and haptics in the app", () => {
  it("plays the desk music on menus and the case music on the board", async () => {
    rig = await openBoard();
    expect(log.scenes.at(-1)).toBe("desk");
    await tap(rig, "Deduction board");
    expect(log.scenes.at(-1)).toBe("case");
    rig.app.router.handleBack();
    await rig.flush();
    expect(log.scenes.at(-1)).toBe("desk");
  });

  it("makes the sounds of picking up, finding, pinning, linking and flipping", async () => {
    rig = await openBoard();
    await click(q(root(), "[data-object='01-3']"));
    await rig.flush();
    expect(log.played).toContain("object-open");
    expect(log.played).toContain("clue-found");
    expect(log.played).not.toContain("ui-tap");
    await tapStarting(rig, "Pin");
    expect(log.played.at(-1)).toBe("clue-pin");
    expect(log.haptics).toEqual(["impact:light"]);
    await tapStarting(rig, "Turn over");
    expect(log.played.at(-1)).toBe("object-flip");
    await tapStarting(rig, "Turn back");
    await tap(rig, "Magnifier on");
    expect(log.played.at(-1)).toBe("zoom-toggle");
    await tapStarting(rig, "Unpin");
    expect(log.played.at(-1)).toBe("clue-unpin");
    expect(log.haptics).toEqual(["impact:light", "impact:light", "impact:light"]);
  });

  it("links, accuses wrongly and delivers with the mapped haptics", async () => {
    rig = await mountApp({
      route: ["board", { caseId: "01" }],
      feedback: feedbackFor,
    });
    await rig.flush();
    const game = rig.app.game;
    for (const object of ["01-1", "01-2", "01-3", "01-4"]) await game.inspect(object);
    await game.flip("01-1");
    await game.zoom("01-c1");
    await game.pin("01-c1");
    await game.pin("01-c2");
    await rig.flush();
    log.played = [];
    log.haptics = [];
    await click(q(root(), ".lp-pinned [data-clue='01-c1']"));
    await click(q(root(), "[data-card='p12']"));
    await rig.flush();
    await tap(rig, "Fits");
    expect(log.played.at(-1)).toBe("clue-link");
    expect(log.haptics).toEqual(["impact:light"]);
    await click(q(root(), ".lp-pinned [data-clue='01-c2']"));
    await click(q(root(), "[data-card='p12']"));
    await rig.flush();
    await tap(rig, "Fits");
    log.played = [];
    log.haptics = [];
    await click(q(root(), "[data-card='p12']"));
    await tapStarting(rig, "Accuse");
    await tap(rig, "Accuse");
    expect(gameSounds()).toEqual(["accuse", "wrong-guess"]);
    expect(log.haptics).toEqual(["impact:medium", "notify:warning"]);
  });

  it("follows the haptics switch at once from the settings screen", async () => {
    rig = await mountApp({ route: ["settings"], feedback: feedbackFor });
    rig.app.feedback?.fire({ type: "pin" });
    expect(log.haptics).toEqual(["impact:light"]);
    log.haptics = [];
    await tap(rig, "Haptics");
    expect(rig.app.settings.get().haptics).toBe(false);
    rig.app.feedback?.fire({ type: "pin" });
    expect(log.haptics).toEqual([]);
    await tap(rig, "Haptics");
    rig.app.feedback?.fire({ type: "pin" });
    expect(log.haptics).toEqual(["impact:light"]);
  });

  it("plays the interface sounds for taps, switches, sheets and back", async () => {
    rig = await mountApp({ route: ["home"], feedback: feedbackFor });
    await tap(rig, "Settings");
    expect(log.played).toContain("ui-tap");
    log.played = [];
    await tap(rig, "Sound");
    expect(log.played).toContain("ui-toggle");
    log.played = [];
    await tap(rig, "Reset progress");
    expect(log.played).toContain("ui-open-sheet");
    log.played = [];
    await tap(rig, "Cancel");
    expect(log.played).toEqual(["ui-tap"]);
    log.played = [];
    await click(buttonByText(root(), "Back"));
    expect(log.played).toEqual(["ui-back"]);
    expect(log.haptics).toEqual([]);
  });
});

describe("the reveal", () => {
  async function deliver(): Promise<Rig> {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const r = await mountApp({
      route: ["board", { caseId: "01" }],
      feedback: feedbackFor,
      reducedMotion: false,
    });
    await r.flush();
    const game = r.app.game;
    for (const object of ["01-1", "01-2", "01-3", "01-4"]) await game.inspect(object);
    await game.zoom("01-c1");
    await game.pin("01-c1");
    await game.pin("01-c2");
    await game.link("01-c1", "p01", "fits");
    await game.link("01-c2", "p01", "fits");
    await r.flush();
    log.played = [];
    log.haptics = [];
    log.typing = [];
    await click(q(r.container, "[data-card='p01']"));
    await tapStarting(r, "Accuse");
    await tap(r, "Accuse");
    return r;
  }

  it("lands the stamp, earns the stamps 140 ms apart and types with the loop only while typing", async () => {
    rig = await deliver();
    expect(rig.app.router.current.name).toBe("reveal");
    expect(gameSounds()).toEqual(["accuse"]);
    expect(log.typing.at(-1)).toBe(true);
    await act(() => {
      vi.advanceTimersByTime(519);
    });
    expect(gameSounds()).toEqual(["accuse"]);
    await act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(gameSounds().at(-1)).toBe("stamp-thud");
    await act(() => {
      vi.advanceTimersByTime(140 * 3);
    });
    expect(gameSounds().slice(1, 3)).toEqual(["stamp-thud", "stamp-3"]);
    expect(log.haptics).toEqual([
      "impact:medium",
      "notify:success",
      "notify:success",
      "notify:success",
      "notify:success",
    ]);
    await act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(log.played).toContain("ledger-found");
    expect(log.played).toContain("map-fill");
    expect(log.played).toContain("achievement");
    expect(log.typing.at(-1)).toBe(false);
  });

  it("finishes the typing at once on a tap", async () => {
    rig = await deliver();
    const typed = q(rig.container, "[data-testid='typewriter']");
    expect(typed.getAttribute("data-complete")).toBe("false");
    await click(typed);
    await act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(typed.getAttribute("data-complete")).toBe("true");
    expect(log.typing.at(-1)).toBe(false);
  });

  it("starts no animation when motion is reduced and still shows the result", async () => {
    const animate = vi.fn();
    const original = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = animate as never;
    try {
      rig = await mountApp({
        route: ["board", { caseId: "01" }],
        feedback: feedbackFor,
        reducedMotion: true,
        profile: progress([]),
      });
      await rig.flush();
      const game = rig.app.game;
      for (const object of ["01-1", "01-2", "01-3"]) await game.inspect(object);
      await game.zoom("01-c1");
      await game.pin("01-c1");
      await game.pin("01-c2");
      await game.link("01-c1", "p01", "fits");
      await game.link("01-c2", "p01", "fits");
      await rig.flush();
      await click(q(rig.container, "[data-card='p01']"));
      await tapStarting(rig, "Accuse");
      await tap(rig, "Accuse");
      expect(rig.app.router.current.name).toBe("reveal");
      expect(animate).not.toHaveBeenCalled();
      const typed = q(rig.container, "[data-testid='typewriter']");
      expect(typed.getAttribute("data-complete")).toBe("true");
      expect(q(rig.container, ".lp-rstamp").style.opacity).toBe("1");
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
});
