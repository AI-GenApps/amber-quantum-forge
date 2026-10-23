import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import {
  buttonByText,
  buttonStarting,
  click,
  mountApp,
  q,
  qa,
  type Rig,
  tap,
  tapStarting,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const viewer = (objectId: string, options: Parameters<typeof mountApp>[0] = {}) =>
  mountApp({ route: ["viewer", { caseId: "01", objectId }], ...options });

describe("object viewer", () => {
  it("picks the object up and finds its front clue", async () => {
    rig = await viewer("01-3");
    await rig.flush();
    const c = rig.container;
    expect(text(q(c, "[data-testid='position']"))).toBe("Object 3 of 4");
    expect(rig.app.game.getState().active?.state.seenObjectIds).toEqual(["01-3"]);
    expect(text(q(c, "[data-clue-row='01-c2']"))).toContain("river-mud grit on the cuff");
    expect(text(q(c, "[data-testid='face-text']"))).toBe(
      "Front of the Muddy work glove. A stiff leather work glove, still damp at the fingers.",
    );
  });

  it("flips to the back and shows the clue written there", async () => {
    rig = await viewer("01-1");
    await rig.flush();
    const c = rig.container;
    expect(qa(c, "[data-clue-row]")).toHaveLength(0);
    await tapStarting(rig, "Turn over");
    expect(q(c, ".lp-mat").getAttribute("data-face")).toBe("back");
    expect(text(q(c, "[data-testid='face-text']"))).toContain("Back of the Seaside postcard.");
    expect(text(q(c, "[data-testid='face-text']"))).toContain("Wish you were here");
    expect(text(q(c, "[data-clue-row='01-c3']"))).toContain('unsigned "wish you were here"');
    expect(c.querySelector(".lp-face--flipping")).toBeNull();
    await tapStarting(rig, "Turn back");
    expect(q(c, ".lp-mat").getAttribute("data-face")).toBe("front");
  });

  it("says so when the back is blank", async () => {
    rig = await viewer("01-3");
    await rig.flush();
    await tapStarting(rig, "Turn over");
    expect(text(q(rig.container, "[data-testid='face-text']"))).toContain(
      "Nothing is written on the back.",
    );
  });

  it("flips with a horizontal swipe", async () => {
    rig = await viewer("01-1");
    await rig.flush();
    const mat = q(rig.container, ".lp-mat");
    await act(() => {
      mat.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 100 }),
      );
      mat.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 90, clientY: 108 }));
    });
    expect(mat.getAttribute("data-face")).toBe("back");
    await act(() => {
      mat.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 }),
      );
      mat.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 120, clientY: 100 }));
    });
    expect(mat.getAttribute("data-face")).toBe("back");
  });

  it("animates the flip only when motion is not reduced", async () => {
    rig = await viewer("01-1", { reducedMotion: false });
    await rig.flush();
    await tapStarting(rig, "Turn over");
    expect(rig.container.querySelector(".lp-face--flipping")).not.toBeNull();
    rig.unmount();
    rig = await viewer("01-1", { reducedMotion: true });
    await rig.flush();
    await tapStarting(rig, "Turn over");
    expect(rig.container.querySelector(".lp-face--flipping")).toBeNull();
    expect(q(rig.container, ".lp-mat").getAttribute("data-face")).toBe("back");
    rig.unmount();
    rig = await viewer("01-1", { settings: { reducedMotion: true }, reducedMotion: false });
    await rig.flush();
    await tapStarting(rig, "Turn over");
    expect(rig.container.querySelector(".lp-face--flipping")).toBeNull();
  });

  it("shows hotspots only while the magnifier is on and finds the zoom clue on a tap", async () => {
    rig = await viewer("01-2");
    await rig.flush();
    const c = rig.container;
    expect(qa(c, "[data-hotspot]")).toHaveLength(0);
    await tap(rig, "Magnifier on");
    const spots = qa<HTMLButtonElement>(c, "[data-hotspot]");
    expect(spots).toHaveLength(1);
    expect(spots[0]?.style.width).toBe("48px");
    expect(spots[0]?.style.minHeight).toBe("48px");
    expect(spots[0]?.getAttribute("aria-label")).toBe("Look closer, spot 1");
    expect(rig.app.game.getState().active?.state.foundClueIds).toEqual([]);
    await click(spots[0] as HTMLElement);
    await rig.flush();
    expect(rig.app.game.getState().active?.state.foundClueIds).toEqual(["01-c1"]);
    expect(text(q(c, "[data-clue-row='01-c1']"))).toContain("copper hair strand in the wool");
    expect(q(c, "[data-hotspot]").getAttribute("aria-label")).toBe("Spot 1, clue found");
    await tap(rig, "Magnifier off");
    expect(qa(c, "[data-hotspot]")).toHaveLength(0);
  });

  it("turns the magnifier off when the object is turned over", async () => {
    rig = await viewer("01-2");
    await rig.flush();
    await tap(rig, "Magnifier on");
    await tapStarting(rig, "Turn over");
    expect(q(rig.container, ".lp-mat").getAttribute("data-magnifier")).toBe("off");
    expect(buttonStarting(rig.container, "Magnifier on").disabled).toBe(true);
  });

  it("pins and unpins from the clue list", async () => {
    rig = await viewer("01-3");
    await rig.flush();
    await tapStarting(rig, "Pin");
    expect(rig.app.game.getState().active?.state.pinnedClueIds).toEqual(["01-c2"]);
    expect(buttonStarting(rig.container, "Unpin")).toBeTruthy();
    await tapStarting(rig, "Unpin");
    expect(rig.app.game.getState().active?.state.pinnedClueIds).toEqual([]);
  });

  it("moves between objects with the previous and next buttons", async () => {
    rig = await viewer("01-1");
    await rig.flush();
    await tap(rig, "Next object");
    expect(rig.app.router.current).toMatchObject({ name: "viewer", params: { objectId: "01-2" } });
    await tap(rig, "Previous object");
    await tap(rig, "Previous object");
    expect(rig.app.router.current).toMatchObject({ params: { objectId: "01-4" } });
    expect(text(q(rig.container, "[data-testid='position']"))).toBe("Object 4 of 4");
  });

  it("puts the hotspot inside the art box so its percentages follow the drawing", async () => {
    rig = await viewer("01-2");
    await rig.flush();
    await tap(rig, "Magnifier on");
    const spot = q(rig.container, "[data-hotspot]");
    expect(spot.parentElement?.className).toBe("lp-artbox");
    expect(spot.style.left).toBe("62%");
    expect(spot.style.top).toBe("38%");
  });

  it("offers an almanac button on flavour clues too, so the button says nothing about the clue", async () => {
    rig = await viewer("01-1");
    await rig.flush();
    await tapStarting(rig, "Turn over");
    await click(q(rig.container, "[aria-label^='Almanac entry for']"));
    await rig.flush();
    expect(rig.app.router.current).toMatchObject({ name: "almanac", params: { tab: "clues" } });
  });

  it("links a clue tag to its almanac entry", async () => {
    rig = await viewer("01-3");
    await rig.flush();
    await click(q(rig.container, "[aria-label='Almanac entry for river-mud grit on the cuff']"));
    await rig.flush();
    expect(rig.app.router.current).toMatchObject({
      name: "almanac",
      params: { tab: "clues", entry: "street:Quay Road" },
    });
    expect(q(rig.container, "[data-entry='street:Quay Road']").getAttribute("data-focused")).toBe(
      "true",
    );
  });

  it("gives every face a text equivalent in the page", async () => {
    rig = await viewer("01-4");
    await rig.flush();
    const c = rig.container;
    expect(text(q(c, "[data-testid='face-text']"))).toContain("brass pocket compass");
    await tapStarting(rig, "Turn over");
    expect(text(q(c, "[data-testid='face-text']"))).toContain("keep heading home");
    expect(buttonByText(c, "Back")).toBeTruthy();
  });
});
