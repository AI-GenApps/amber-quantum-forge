import { PIECE_BY_ID } from "@web-games/dress-rehearsal-core";
import { afterEach, describe, expect, it } from "vitest";
import type { Scene } from "../src/audio/engine";
import type { FeedbackEvent } from "../src/audio/events";
import type { Feedback } from "../src/feedback/feedback";
import { buttonByText, click, mountApp, type Rig } from "./helpers";
import { RIV01_LOOK, settle, startBoard, tapPlace } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

function recorder() {
  const events: FeedbackEvent[] = [];
  const scenes: Scene[] = [];
  const feedback: Feedback = {
    fire: (event) => void events.push(event),
    fireLater: (event) => {
      events.push(event);
      return () => undefined;
    },
    setScene: (scene) => void scenes.push(scene),
    audio: null,
    haptics: null,
  };
  return { feedback, events, scenes };
}

const types = (events: FeedbackEvent[]): string[] => events.map((event) => event.type);

describe("game events reach the feedback layer", () => {
  it("plays place, rule, complete, finish, star and coin cues through a full riv-01 look", async () => {
    const rec = recorder();
    rig = await mountApp({
      route: ["styling", { challengeId: "riv-01" }],
      feedback: rec.feedback,
    });
    expect(rec.scenes.at(-1)).toBe("style");
    await startBoard();
    for (const id of RIV01_LOOK) await tapPlace(rig, id);
    const seen = types(rec.events);
    expect(seen.filter((type) => type === "place")).toHaveLength(RIV01_LOOK.length);
    expect(seen).toContain("tab");
    expect(seen).toContain("rule-met");
    expect(seen).toContain("look-complete");
    rec.events.length = 0;
    await click(buttonByText(rig.container, "Finish look"));
    await settle(rig);
    const after = types(rec.events);
    expect(after[0]).toBe("finish");
    expect(after.filter((type) => type === "star")).toHaveLength(3);
    expect(after).toContain("coins");
  });

  it("uses the menu music on menu screens and the style music on the board", async () => {
    const rec = recorder();
    rig = await mountApp({ feedback: rec.feedback });
    expect(rec.scenes.at(-1)).toBe("menu");
    rig.app.router.push("styling", { challengeId: "riv-01" });
    await rig.flush();
    expect(rec.scenes.at(-1)).toBe("style");
  });

  it("plays a swap cue when a slot is refilled and a plain tap sound for buttons", async () => {
    const rec = recorder();
    rig = await mountApp({
      route: ["styling", { challengeId: "riv-01" }],
      feedback: rec.feedback,
    });
    await startBoard();
    expect(rec.events).toContainEqual({ type: "ui", ui: "tap" });
    await tapPlace(rig, "item-riviera-1");
    rec.events.length = 0;
    const other = [...PIECE_BY_ID.values()].find(
      (piece) => piece.category === "top" && piece.id !== "item-riviera-1",
    );
    if (!other) throw new Error("no second top");
    await tapPlace(rig, other.id);
    expect(types(rec.events)).toContain("swap");
  });
});
