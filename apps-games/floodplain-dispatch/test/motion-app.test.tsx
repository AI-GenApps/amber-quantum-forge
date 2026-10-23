import { getMap } from "@web-games/floodplain-dispatch-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buttonByText, click, mountApp, press, q, type Rig } from "./helpers";
import { Pilot, playUntilResult, tick } from "./pilot";

let rig: Rig | null = null;
const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: () => undefined }));
const original = (Element.prototype as { animate?: unknown }).animate;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  animate.mockClear();
  Object.assign(Element.prototype, { animate });
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
  Object.assign(Element.prototype, { animate: original });
});

const root = () => rig?.container as HTMLElement;
const v01 = getMap("v01");

async function playV01(settings: Parameters<typeof mountApp>[0]): Promise<void> {
  rig = await mountApp({ route: ["board", { mapId: "v01" }], ...settings });
  const pilot = new Pilot(rig, "v01");
  await pilot.placeAll(v01.reference);
  await press(pilot.host, " ");
  await playUntilResult(rig);
  await tick(600);
}

describe("reduced motion in the app", () => {
  it("runs no animation and still reaches the final state", async () => {
    await playV01({ settings: { reducedMotion: true } });
    expect(animate).not.toHaveBeenCalled();
    const result = q(root(), "[data-testid='result']");
    const stars = Array.from(result.querySelectorAll<HTMLElement>(".wg-star--on"));
    expect(stars).toHaveLength(3);
    for (const star of stars) {
      expect(star.style.opacity).toBe("1");
      expect(star.style.transform).toContain("scale(1)");
    }
    const dialog = q<HTMLElement>(root(), "[role='dialog']");
    expect(dialog.style.opacity).toBe("1");
    expect(q(root(), "[data-testid='week-counter']").textContent).toContain("Week 20 of 20");
  });

  it("animates the sheet, the badges and the stars when motion is on", async () => {
    await playV01({});
    expect(animate).toHaveBeenCalled();
    const delays = animate.mock.calls
      .map((call) => (call as unknown as [Keyframe[], { delay: number }])[1].delay)
      .filter((delay) => delay > 0);
    expect(delays).toEqual([120, 240]);
  });

  it("leaves no placement pop on screen in reduced motion", async () => {
    rig = await mountApp({ route: ["board", { mapId: "v01" }], settings: { reducedMotion: true } });
    const pilot = new Pilot(rig, "v01");
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    await rig.flush();
    expect(animate).not.toHaveBeenCalled();
    expect(root().querySelector("[data-testid='placement-pop']")).toBeNull();
  });

  it("shows a placement pop while motion is on and removes it when it ends", async () => {
    rig = await mountApp({ route: ["board", { mapId: "v01" }] });
    const pilot = new Pilot(rig, "v01");
    await pilot.place({ kind: "canal", x: 0, y: 0 });
    await rig.flush();
    expect(animate).toHaveBeenCalled();
    expect(root().querySelector("[data-testid='placement-pop']")).toBeNull();
  });

  it("opens the pause sheet with its final frame applied", async () => {
    rig = await mountApp({ route: ["board", { mapId: "v01" }], settings: { reducedMotion: true } });
    await click(buttonByText(root(), "Pause menu"));
    expect(animate).not.toHaveBeenCalled();
    expect(q<HTMLElement>(root(), "[role='dialog']").style.opacity).toBe("1");
  });
});
