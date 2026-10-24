import { createMemoryAdapter, type HapticsDriver } from "@web-games/kit";
import {
  type CaseState,
  createCaseState,
  type EconomyEvent,
  getCase,
} from "@web-games/lost-parcel-desk-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "../src/audio/engine";
import { boardFeedback, cueFor, type FeedbackEvent, revealFeedback } from "../src/audio/events";
import { SOUND_IDS } from "../src/audio/slots";
import { uiCueFor } from "../src/audio/ui";
import { createFeedback } from "../src/feedback/feedback";
import { createGameHaptics } from "../src/feedback/haptics";
import { createGameSettings } from "../src/state/saveStores";

const LIGHT = { kind: "impact", style: "light" };
const MEDIUM = { kind: "impact", style: "medium" };
const SUCCESS = { kind: "notify", type: "success" };
const WARNING = { kind: "notify", type: "warning" };

describe("event table", () => {
  const table: Array<[FeedbackEvent, string | null, unknown]> = [
    [{ type: "ui", ui: "tap" }, "ui-tap", null],
    [{ type: "ui", ui: "back" }, "ui-back", null],
    [{ type: "ui", ui: "toggle" }, "ui-toggle", null],
    [{ type: "ui", ui: "sheet" }, "ui-open-sheet", null],
    [{ type: "parcel-open" }, "parcel-open", null],
    [{ type: "object-open" }, "object-open", null],
    [{ type: "flip" }, "object-flip", LIGHT],
    [{ type: "zoom" }, "zoom-toggle", null],
    [{ type: "clue-found" }, "clue-found", null],
    [{ type: "pin" }, "clue-pin", LIGHT],
    [{ type: "unpin" }, "clue-unpin", null],
    [{ type: "link" }, "clue-link", LIGHT],
    [{ type: "unlink" }, "clue-unlink", null],
    [{ type: "hint" }, "hint-use", null],
    [{ type: "accuse" }, "accuse", MEDIUM],
    [{ type: "wrong" }, "wrong-guess", WARNING],
    [{ type: "delivery" }, "stamp-thud", SUCCESS],
    [{ type: "stamp", index: 1, total: 1 }, "stamp-1", SUCCESS],
    [{ type: "stamp", index: 2, total: 2 }, "stamp-2", SUCCESS],
    [{ type: "stamp", index: 3, total: 3 }, "stamp-3", SUCCESS],
    [{ type: "stamp", index: 1, total: 3 }, null, SUCCESS],
    [{ type: "stamp", index: 2, total: 3 }, null, SUCCESS],
    [{ type: "ledger" }, "ledger-found", null],
    [{ type: "map-fill" }, "map-fill", null],
    [{ type: "achievement" }, "achievement", null],
    [{ type: "unlock", what: "chapter" }, "chapter-unlock", SUCCESS],
    [{ type: "unlock", what: "theme" }, "theme-unlock", SUCCESS],
    [{ type: "streak" }, "streak-up", null],
  ];

  it.each(table)("maps %j to sound %s and haptic %j", (event, sound, haptic) => {
    expect(cueFor(event)).toEqual({ sound, haptic });
  });

  it("uses only known sound ids and never vibrates for plain button taps", () => {
    for (const [event, sound] of table) {
      if (sound !== null) expect(SOUND_IDS).toContain(sound);
      if (event.type === "ui") expect(cueFor(event).haptic).toBeNull();
    }
  });

  it("covers every sound effect slot except the typing loop and the music", () => {
    const used = new Set(table.map(([, sound]) => sound).filter((id) => id !== null));
    const expected = SOUND_IDS.filter(
      (id) => id !== "typewriter" && id !== "music-desk" && id !== "music-case",
    );
    expect([...used].sort()).toEqual([...expected].sort());
  });
});

describe("board changes", () => {
  const def = getCase("01");
  if (!def) throw new Error("case 01 missing");
  const base = (): CaseState => createCaseState(def);
  const withState = (change: Partial<CaseState>): CaseState => ({ ...base(), ...change });

  it("is quiet for a new case, a reload and no change", () => {
    expect(boardFeedback(null, base())).toEqual([]);
    expect(boardFeedback(base(), null)).toEqual([]);
    expect(boardFeedback(base(), { ...base(), caseId: "02" })).toEqual([]);
    expect(boardFeedback(base(), base())).toEqual([]);
  });

  it("reports clues found, pins and unpins", () => {
    expect(boardFeedback(base(), withState({ foundClueIds: ["01-c1"] }))).toEqual([
      { type: "clue-found" },
    ]);
    const found = withState({ foundClueIds: ["01-c1"] });
    const pinned = { ...found, pinnedClueIds: ["01-c1"] };
    expect(boardFeedback(found, pinned)).toEqual([{ type: "pin" }]);
    expect(boardFeedback(pinned, found)).toEqual([{ type: "unpin" }]);
  });

  it("reports a link, a changed link and an unlink", () => {
    const none = withState({ pinnedClueIds: ["01-c1"] });
    const fits = {
      ...none,
      links: [{ clueId: "01-c1", personId: "p1", kind: "fits" as const }],
    };
    const rules = {
      ...none,
      links: [{ clueId: "01-c1", personId: "p1", kind: "rules-out" as const }],
    };
    expect(boardFeedback(none, fits)).toEqual([{ type: "link" }]);
    expect(boardFeedback(fits, rules)).toEqual([{ type: "link" }]);
    expect(boardFeedback(fits, none)).toEqual([{ type: "unlink" }]);
  });

  it("reports a hint on its own and a wrong accusation", () => {
    const before = base();
    const hinted = withState({
      hintsUsed: 1,
      pinnedClueIds: ["01-c1"],
      links: [{ clueId: "01-c1", personId: "p1", kind: "fits" }],
    });
    expect(boardFeedback(before, hinted)).toEqual([{ type: "hint" }]);
    expect(boardFeedback(before, withState({ wrongAccusations: 1 }))).toEqual([{ type: "wrong" }]);
  });
});

describe("reveal sequence", () => {
  const events: EconomyEvent[] = [
    { type: "ledger-unlocked", caseId: "01" },
    { type: "chapter-unlocked", chapter: 2 },
    { type: "theme-unlocked", themeId: "teal-blotter" },
    { type: "streak-extended", streak: 2 },
  ];

  it("lands the stamp, then earns each stamp 140 ms apart", () => {
    const plan = revealFeedback(3, [], true);
    expect(plan.slice(0, 4)).toEqual([
      { delayMs: 520, event: { type: "delivery" } },
      { delayMs: 660, event: { type: "stamp", index: 1, total: 3 } },
      { delayMs: 800, event: { type: "stamp", index: 2, total: 3 } },
      { delayMs: 940, event: { type: "stamp", index: 3, total: 3 } },
    ]);
    expect(plan).toHaveLength(4);
  });

  it("lands at once under reduced motion", () => {
    expect(revealFeedback(1, [], false)[0]).toEqual({ delayMs: 0, event: { type: "delivery" } });
  });

  it("follows with the ledger fragment, the map, unlocks and the streak in order", () => {
    const plan = revealFeedback(2, events, true);
    const after = plan.slice(3).map((step) => step.event.type);
    expect(after).toEqual(["ledger", "map-fill", "unlock", "unlock", "streak"]);
    const delays = plan.map((step) => step.delayMs);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    expect(plan.filter((s) => s.event.type === "unlock").map((s) => s.event)).toEqual([
      { type: "unlock", what: "chapter" },
      { type: "unlock", what: "theme" },
    ]);
  });

  it("plays no ledger or map sound when the case was already closed", () => {
    const plan = revealFeedback(
      1,
      [{ type: "stamp-gained", caseId: "01", stamps: 2, previous: 1 }],
      true,
    );
    expect(plan.map((step) => step.event.type)).toEqual(["delivery", "stamp"]);
  });
});

describe("generic taps", () => {
  const button = (html: string): Element => {
    const holder = document.createElement("div");
    holder.innerHTML = html;
    return holder.firstElementChild as Element;
  };

  it("classifies buttons and leaves out the ones with their own sound", () => {
    expect(uiCueFor(button('<button type="button">Go</button>'))).toBe("tap");
    expect(uiCueFor(button('<button type="button" aria-label="Back">x</button>'))).toBe("back");
    expect(uiCueFor(button('<button type="button" role="switch">x</button>'))).toBe("toggle");
    expect(uiCueFor(button('<button type="button" disabled>Go</button>'))).toBeNull();
    expect(uiCueFor(button('<button type="button" class="lp-chip">x</button>'))).toBeNull();
    expect(uiCueFor(button('<button type="button" class="lp-accuse">x</button>'))).toBeNull();
    expect(uiCueFor(button('<button type="button" class="lp-own-sfx">x</button>'))).toBeNull();
    expect(uiCueFor(button("<div>text</div>"))).toBeNull();
    expect(uiCueFor(null)).toBeNull();
  });
});

describe("feedback hub", () => {
  const played: string[] = [];
  const buzzed: string[] = [];
  const driver: HapticsDriver = {
    name: "test",
    impact: (style) => void buzzed.push(`impact:${style}`),
    notification: (kind) => void buzzed.push(`notify:${kind}`),
    selection: () => void buzzed.push("selection"),
  };
  const engine = {
    progress: 1,
    scene: "off",
    typing: false,
    play: (id: string) => {
      played.push(id);
      return true;
    },
    setScene: () => undefined,
    setTyping: () => undefined,
    syncSettings: (enabled: { sound: boolean; music: boolean }) => void synced.push(enabled),
  } as unknown as AudioEngine;
  const synced: Array<{ sound: boolean; music: boolean }> = [];

  beforeEach(() => {
    played.length = 0;
    buzzed.length = 0;
    synced.length = 0;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => vi.useRealTimers());

  async function hub() {
    const settings = createGameSettings(createMemoryAdapter());
    await settings.load();
    const feedback = createFeedback({
      audio: engine,
      haptics: createGameHaptics({ driver }),
      settings,
    });
    return { settings, feedback };
  }

  it("plays the sound and the haptic of an event", async () => {
    const { feedback } = await hub();
    feedback.fire({ type: "pin" });
    feedback.fire({ type: "ui", ui: "tap" });
    feedback.fire({ type: "accuse" });
    feedback.fire({ type: "wrong" });
    feedback.fire({ type: "delivery" });
    expect(played).toEqual(["clue-pin", "ui-tap", "accuse", "wrong-guess", "stamp-thud"]);
    expect(buzzed).toEqual(["impact:light", "impact:medium", "notify:warning", "notify:success"]);
  });

  it("is silent for haptics when they are switched off and again when switched on", async () => {
    const { feedback, settings } = await hub();
    await settings.toggle("haptics");
    feedback.fire({ type: "pin" });
    feedback.fire({ type: "wrong" });
    expect(buzzed).toEqual([]);
    expect(played).toEqual(["clue-pin", "wrong-guess"]);
    await settings.toggle("haptics");
    feedback.fire({ type: "flip" });
    expect(buzzed).toEqual(["impact:light"]);
  });

  it("is silent for haptics when the device has none", async () => {
    const settings = createGameSettings(createMemoryAdapter());
    await settings.load();
    const feedback = createFeedback({
      audio: engine,
      haptics: createGameHaptics({
        driver: { name: "none", impact() {}, notification() {}, selection() {} },
      }),
      settings,
    });
    expect(() => feedback.fire({ type: "accuse" })).not.toThrow();
    expect(played).toEqual(["accuse"]);
  });

  it("passes the sound and music switches to the audio engine at once", async () => {
    const { settings } = await hub();
    expect(synced.at(-1)).toEqual({ sound: true, music: true });
    await settings.toggle("sound");
    expect(synced.at(-1)).toEqual({ sound: false, music: true });
    await settings.toggle("music");
    expect(synced.at(-1)).toEqual({ sound: false, music: false });
  });

  it("fires later events on time and lets them be cancelled", async () => {
    const { feedback } = await hub();
    const cancel = feedback.fireLater({ type: "ledger" }, 400);
    feedback.fireLater({ type: "map-fill" }, 800);
    vi.advanceTimersByTime(399);
    expect(played).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(played).toEqual(["ledger-found"]);
    cancel();
    vi.advanceTimersByTime(800);
    expect(played).toEqual(["ledger-found", "map-fill"]);
    feedback.fireLater({ type: "streak" }, 0);
    expect(played.at(-1)).toBe("streak-up");
  });
});
