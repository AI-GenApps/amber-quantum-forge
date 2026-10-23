import { getMap } from "@web-games/floodplain-dispatch-core";
import { createAudioManager, createFakeAudioContext, type HapticsDriver } from "@web-games/kit";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type AudioEngine, createAudioEngine } from "../src/audio/engine";
import { createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";
import { buttonByText, click, mountApp, press, q, type Rig, type RigOptions } from "./helpers";
import { Pilot, playUntilResult, tick } from "./pilot";

interface Harness {
  played: string[];
  haptics: string[];
  scenes: string[];
  flows: number[];
}

let rig: Rig | null = null;
const log: Harness = { played: [], haptics: [], scenes: [], flows: [] };

function driver(): HapticsDriver {
  return {
    name: "test",
    impact: (style) => void log.haptics.push(`impact:${style}`),
    notification: (kind) => void log.haptics.push(`notify:${kind}`),
    selection: () => void log.haptics.push("selection"),
  };
}

function fakeEngine(): AudioEngine {
  const engine = {
    progress: 1,
    scene: "off",
    play: (id: string) => {
      log.played.push(id);
      return true;
    },
    setScene: (scene: string) => void log.scenes.push(scene),
    setFlow: (level: number) => void log.flows.push(level),
    syncSettings: () => undefined,
  };
  return engine as unknown as AudioEngine;
}

const feedbackFor: NonNullable<RigOptions["feedback"]> = (settings) =>
  createFeedback({
    audio: fakeEngine(),
    haptics: createGameHaptics({ driver: driver() }),
    settings,
  });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  log.played = [];
  log.haptics = [];
  log.scenes = [];
  log.flows = [];
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const root = () => rig?.container as HTMLElement;
const v01 = getMap("v01");

async function openV01(): Promise<Pilot> {
  rig = await mountApp({ route: ["board", { mapId: "v01" }], feedback: feedbackFor });
  return new Pilot(rig, "v01");
}

describe("sound and haptics from the board", () => {
  it("plays the board music scene and a tap sound for buttons", async () => {
    await openV01();
    expect(log.scenes.at(-1)).toBe("play");
    await click(q(root(), "[data-tool='erase']"));
    expect(log.played).toContain("ui-tap");
    expect(log.haptics).toEqual([]);
  });

  it("placing a canal sounds and gives a light impact; an illegal placement warns", async () => {
    const pilot = await openV01();
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    expect(log.played.at(-1)).toBe("place-canal");
    expect(log.haptics).toEqual(["impact:light"]);
    await pilot.goto(1, 0);
    await press(pilot.host, "Enter");
    expect(log.played.at(-1)).toBe("invalid");
    expect(log.haptics.at(-1)).toBe("notify:warning");
  });

  it("removing a piece makes the remove sound and no haptic", async () => {
    const pilot = await openV01();
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    log.haptics.length = 0;
    await press(pilot.host, "Backspace");
    expect(log.played.at(-1)).toBe("remove-piece");
    expect(log.haptics).toEqual([]);
  });

  it("Run gives a medium impact and the run sound, then the water loop follows playback", async () => {
    const pilot = await openV01();
    await pilot.placeAll(v01.reference);
    log.haptics.length = 0;
    await press(pilot.host, " ");
    expect(log.played.at(-1)).toBe("run-start");
    expect(log.haptics).toEqual(["impact:medium"]);
    await tick(160 * 12);
    expect(log.flows.some((level) => level > 0)).toBe(true);
    await playUntilResult(rig as Rig);
    expect(log.flows.at(-1)).toBe(0);
  });

  it("plays badge sounds during playback and the three star successes on the result", async () => {
    const pilot = await openV01();
    await pilot.placeAll(v01.reference);
    await press(pilot.host, " ");
    await playUntilResult(rig as Rig);
    await tick(600);
    expect(log.played).toContain("house-supplied");
    expect(log.played).toContain("field-irrigated");
    expect(log.played.filter((id) => id.startsWith("star-"))).toEqual(["star-3"]);
    expect(log.haptics.filter((entry) => entry === "notify:success")).toHaveLength(3);
    expect(log.haptics).not.toContain("notify:error");
  });

  it("a failed season plays the fail sound and no stars", async () => {
    const pilot = await openV01();
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    await press(pilot.host, " ");
    await playUntilResult(rig as Rig);
    await tick(600);
    expect(log.played).toContain("result-fail");
    expect(log.played.filter((id) => id.startsWith("star-"))).toEqual([]);
  });

  it("opens sheets with the sheet sound", async () => {
    await openV01();
    log.played.length = 0;
    await click(buttonByText(root(), "Pause menu"));
    expect(log.played).toContain("ui-open-sheet");
  });

  it("plays unlock feedback when a region opens", async () => {
    rig = await mountApp({
      route: ["board", { mapId: "v10" }],
      feedback: feedbackFor,
      profile: {
        flags: { tutorial: true, "card-surge": true, "card-pump": true, "card-barrier": true },
        stars: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`v0${i + 1}`, 1 as const])),
      },
    });
    const pilot = new Pilot(rig, "v10");
    await pilot.placeAll(getMap("v10").reference);
    await press(pilot.host, " ");
    await playUntilResult(rig, 160, 700);
    await rig.flush();
    await tick(900);
    expect(log.played).toContain("region-unlock");
    expect(log.haptics.filter((entry) => entry === "notify:success")).toHaveLength(4);
  });
});

describe("settings take effect at once", () => {
  it("toggling haptics off stops vibration without reloading", async () => {
    const pilot = await openV01();
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    expect(log.haptics).toEqual(["impact:light"]);
    await act(async () => {
      await (rig as Rig).app.settings.set({ haptics: false });
    });
    await pilot.place({ kind: "canal", x: 0, y: 1 });
    expect(log.haptics).toEqual(["impact:light"]);
  });
});

describe("settings screen", () => {
  it("the haptics switch changes what the next event does", async () => {
    rig = await mountApp({ route: ["settings"], feedback: feedbackFor });
    const app = (rig as Rig).app;
    await click(buttonByText(root(), "Haptic feedback"));
    await (rig as Rig).flush();
    expect(app.settings.get().haptics).toBe(false);
    app.feedback?.fire({ type: "run" });
    expect(log.haptics).toEqual([]);
    expect(log.played).toContain("ui-toggle");
    await click(buttonByText(root(), "Haptic feedback"));
    await (rig as Rig).flush();
    app.feedback?.fire({ type: "run" });
    expect(log.haptics).toEqual(["impact:medium"]);
  });
});

describe("real engine behind the app", () => {
  it("stays silent until a gesture unlocks the contexts", async () => {
    const sfx = createFakeAudioContext();
    const ambience = createFakeAudioContext();
    const engine = createAudioEngine({
      sfx: createAudioManager({
        createContext: () => sfx,
        fetchBuffer: async () => new ArrayBuffer(8),
      }),
      ambience: createAudioManager({
        createContext: () => ambience,
        fetchBuffer: async () => new ArrayBuffer(8),
      }),
    });
    rig = await mountApp({
      route: ["board", { mapId: "v01" }],
      feedback: (settings) =>
        createFeedback({
          audio: engine,
          haptics: createGameHaptics({ driver: driver() }),
          settings,
        }),
    });
    const pilot = new Pilot(rig, "v01");
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    expect(sfx.sources).toHaveLength(0);
    expect(engine.play("ui-tap")).toBe(false);
  });
});
