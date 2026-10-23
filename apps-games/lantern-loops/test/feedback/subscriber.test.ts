import { createHaptics, createMotion } from "@web-games/kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SOUND_IDS, SOUNDS, type SoundId } from "../../src/audio/sounds";
import { createFeedbackBus } from "../../src/feedback/events";
import {
  attachFeedback,
  CONFLICT_HAPTIC_GAP_MS,
  HAPTIC_MAP,
  TILE_HAPTIC_GAP_MS,
} from "../../src/feedback/subscriber";
import { installAnimate, removeAnimate } from "../helpers/env";

const EXPECTED: Record<SoundId, string | null> = {
  "ui-tap": null,
  "ui-back": null,
  "sheet-open": null,
  "tile-place": "impact:light",
  "tile-rotate": "impact:light",
  "tile-erase": null,
  "loop-close": "impact:medium",
  "lantern-lit": null,
  conflict: "notification:warning",
  hint: "impact:light",
  undo: "impact:light",
  "win-1": "notification:success",
  "win-2": "notification:success",
  "win-3": "notification:success",
  "daily-done": null,
  "chapter-unlock": null,
  "freeze-used": null,
};

function setup(reduced = false) {
  const bus = createFeedbackBus();
  const played: Array<{ id: string; volume: number | undefined }> = [];
  const buzzes: string[] = [];
  const haptics = createHaptics({
    driver: {
      name: "recording",
      impact: (style) => void buzzes.push(`impact:${style}`),
      notification: (kind) => void buzzes.push(`notification:${kind}`),
      selection: () => undefined,
    },
  });
  const audio = {
    play(id: string, options?: { volume?: number }) {
      played.push({ id, volume: options?.volume });
      return true;
    },
  };
  const motion = createMotion(reduced);
  const detach = attachFeedback({ bus, audio, haptics, motion });
  return { bus, played, buzzes, haptics, detach };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  removeAnimate();
  document.body.replaceChildren();
});

describe("sound and haptic mapping", () => {
  it("lists all 17 ids and gives every one a sound", () => {
    expect(SOUND_IDS).toHaveLength(17);
    expect(Object.keys(EXPECTED).sort()).toEqual([...SOUND_IDS].sort());
  });

  it.each(SOUND_IDS)("%s plays its own sound and the mapped haptic", (id) => {
    const { bus, played, buzzes } = setup();
    bus.emit(id);
    expect(played).toEqual([{ id, volume: SOUNDS[id].volume }]);
    expect(buzzes).toEqual(EXPECTED[id] === null ? [] : [EXPECTED[id]]);
  });

  it("keeps the haptic map in sync with the expectations", () => {
    for (const id of SOUND_IDS) expect(HAPTIC_MAP[id] !== undefined).toBe(EXPECTED[id] !== null);
  });

  it("stops after detach", () => {
    const { bus, played, detach } = setup();
    detach();
    bus.emit("ui-tap");
    expect(played).toEqual([]);
  });
});

describe("throttles", () => {
  it("allows one tile haptic per 40 ms, shared by place and rotate", () => {
    const { bus, buzzes } = setup();
    bus.emit("tile-place");
    bus.emit("tile-rotate");
    vi.advanceTimersByTime(TILE_HAPTIC_GAP_MS - 1);
    bus.emit("tile-place");
    expect(buzzes).toEqual(["impact:light"]);
    vi.advanceTimersByTime(1);
    bus.emit("tile-place");
    expect(buzzes).toEqual(["impact:light", "impact:light"]);
  });

  it("allows one conflict haptic per 800 ms", () => {
    const { bus, buzzes } = setup();
    bus.emit("conflict");
    vi.advanceTimersByTime(CONFLICT_HAPTIC_GAP_MS - 1);
    bus.emit("conflict");
    expect(buzzes).toEqual(["notification:warning"]);
    vi.advanceTimersByTime(1);
    bus.emit("conflict");
    expect(buzzes).toEqual(["notification:warning", "notification:warning"]);
  });

  it("does not throttle the sounds or the unthrottled haptics", () => {
    const { bus, played, buzzes } = setup();
    for (let i = 0; i < 3; i++) bus.emit("tile-place");
    for (let i = 0; i < 3; i++) bus.emit("hint");
    expect(played.filter((p) => p.id === "tile-place")).toHaveLength(3);
    expect(buzzes.filter((b) => b === "impact:light")).toHaveLength(4);
  });
});

describe("haptics setting", () => {
  it("silences every haptic when off and leaves the sound alone", () => {
    const { bus, haptics, played, buzzes } = setup();
    haptics.syncSettings({ haptics: false });
    for (const id of SOUND_IDS) bus.emit(id);
    expect(buzzes).toEqual([]);
    expect(played).toHaveLength(17);
    haptics.syncSettings({ haptics: true });
    bus.emit("loop-close");
    expect(buzzes).toEqual(["impact:medium"]);
  });
});

function boardWith(cells: number[]): HTMLElement {
  const root = document.createElement("div");
  for (const cell of cells) {
    const holder = document.createElement("div");
    holder.setAttribute("data-cell", String(cell));
    for (const cls of ["ll-tile", "ll-lantern"]) {
      const el = document.createElement("div");
      el.className = cls;
      holder.appendChild(el);
    }
    root.appendChild(holder);
  }
  document.body.appendChild(root);
  return root;
}

describe("board motion", () => {
  it("animates placed tiles, closed loops and lit lanterns on the board", () => {
    const animate = installAnimate();
    const { bus } = setup();
    bus.setBoard(boardWith([0, 1, 5, 6]));
    bus.emit({ id: "tile-place", cells: [0] });
    expect(animate).toHaveBeenCalledTimes(1);
    bus.emit({ id: "loop-close", loops: [[0, 1, 6, 5]] });
    expect(animate).toHaveBeenCalledTimes(5);
    bus.emit({ id: "lantern-lit", cells: [0] });
    expect(animate).toHaveBeenCalledTimes(6);
    bus.emit("ui-tap");
    bus.emit("conflict");
    expect(animate).toHaveBeenCalledTimes(6);
  });

  it("does nothing without a board and applies final frames when motion is reduced", () => {
    const animate = installAnimate();
    const quiet = setup();
    quiet.bus.emit({ id: "tile-place", cells: [0] });
    expect(animate).not.toHaveBeenCalled();
    const reduced = setup(true);
    const root = boardWith([0, 1]);
    reduced.bus.setBoard(root);
    reduced.bus.emit({ id: "tile-place", cells: [0] });
    reduced.bus.emit({ id: "lantern-lit", cells: [1] });
    expect(animate).not.toHaveBeenCalled();
    const tile = root.querySelector<HTMLElement>('[data-cell="0"] .ll-tile');
    expect(tile?.style.getPropertyValue("transform")).toBe("scale(1)");
  });
});
