import { defaultProfile, getRegular, levelForFp } from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  clickByText,
  currentScreen,
  mountApp,
  press,
  profileOf,
  q,
  type Rig,
  text,
} from "./helpers";
import { giveBook, makeDrink, makePastry, selectSeat, serveActive } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

let startedAt = 0;

/** Advances fake time until `seconds` of shift time have passed. */
async function advanceTo(game: Rig, seconds: number): Promise<void> {
  const target = startedAt + seconds * 1000;
  if (target > game.scheduler.now) await game.advance(target - game.scheduler.now);
}

async function openDayOneShift(): Promise<HTMLElement> {
  rig = await mountApp({ route: ["home"] });
  const container = rig.container;
  await clickByText(container, "Continue: Day 1");
  expect(currentScreen(rig)).toBe("day");
  await clickByText(container, "Plan the shelves");
  expect(currentScreen(rig)).toBe("prep");
  await clickByText(container, "Open shop");
  await rig.flush();
  expect(currentScreen(rig)).toBe("shift");
  startedAt = rig.scheduler.now;
  return container;
}

describe("a scripted Day 1", () => {
  it("plays Home to Day to Prep to Shift to Result to Scene to Home", async () => {
    const container = await openDayOneShift();
    const game = rig as Rig;
    expect(profileOf(game).coins).toBe(25);

    await advanceTo(game, 1.1);
    expect(text(container)).toContain("Tobias");
    await selectSeat(game, "Tobias");
    await makeDrink(game, "drink-1");
    expect(text(q(container, "[data-testid='tray']"))).toContain("Harbour Black");
    await serveActive(game);
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("Tobias is delighted");
    expect(
      Number(/\d+/.exec(q(container, "[data-testid='earned']").textContent ?? "")?.[0]),
    ).toBeGreaterThan(4);

    await advanceTo(game, 21);
    expect(text(container)).toContain("Priya");
    await selectSeat(game, "Priya");
    await makeDrink(game, "drink-3");
    await makePastry(game, "pastry-1");
    await serveActive(game);

    await advanceTo(game, 57);
    expect(text(container)).toContain("Odile");
    await selectSeat(game, "Odile");
    await makeDrink(game, "drink-1");
    await giveBook(game, "book-1");
    await serveActive(game);

    await game.advance(200000);
    expect(currentScreen(game)).toBe("result");
    expect(q(container, "[data-testid='result-title']").textContent).toBe("Day 1 complete");
    const profile = profileOf(game);
    expect(profile.day).toBe(2);
    expect(profile.diary).toEqual([1]);
    for (const id of [1, 2, 3]) {
      expect(levelForFp(profile.regulars[id]?.fp ?? 0)).toBeGreaterThanOrEqual(1);
    }
    expect(q(container, "[data-testid='scene-count']").textContent).toBe(
      "3 story scenes are waiting.",
    );

    await clickByText(container, "Read the evening scenes");
    for (let scene = 0; scene < 3; scene++) {
      expect(currentScreen(game)).toBe("scene");
      let guard = 0;
      while (container.querySelector("[data-testid='dialogue']") && guard++ < 30) {
        await press(q(container, "[data-testid='dialogue']"), "Enter");
      }
      const choice = container.querySelector("[data-testid='choice']");
      expect(choice).toBeNull();
      await game.flush();
      await clickByText(container, scene < 2 ? "Next" : "Continue");
    }
    expect(currentScreen(game)).toBe("home");
    const after = profileOf(game);
    expect(after.regulars[1]?.scenesDone).toBe(1);
    expect(after.regulars[2]?.scenesDone).toBe(1);
    expect(after.regulars[3]?.scenesDone).toBe(1);
    expect(after.pendingEvening).toEqual([]);
    expect(after.coins).toBeGreaterThan(25 + 15);
    expect(text(container)).toContain("Day 2");
    expect(getRegular(1).shortName).toBe("Odile");
  });

  it("serves one order with the keyboard only", async () => {
    const container = await openDayOneShift();
    const game = rig as Rig;
    await game.advance(1100);
    await press(document, "1");
    expect(q(container, "[data-seat='0']").getAttribute("aria-pressed")).toBe("true");
    for (const token of ["cup", "brew", "pour"]) {
      q<HTMLButtonElement>(
        container,
        `[data-testid="drink-station"] [data-token="${token}"]`,
      ).focus();
      q<HTMLButtonElement>(
        container,
        `[data-testid="drink-station"] [data-token="${token}"]`,
      ).click();
      if (token === "brew") await game.advance(900);
    }
    await game.flush();
    expect(text(q(container, "[data-testid='tray']"))).toContain("Harbour Black");
    await press(document, " ");
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("delighted");
    expect(q(container, "[data-testid='ticket']").textContent).toContain("Tap a seat");
  });

  it("empties the cup in the UI after a wrong step", async () => {
    const container = await openDayOneShift();
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    const station = q(container, "[data-testid='drink-station']");
    q<HTMLButtonElement>(station, "[data-token='cup']").click();
    await game.flush();
    expect(q(container, "[data-testid='cup-state']").textContent).toContain("Harbour Black");
    q<HTMLButtonElement>(station, "[data-token='pour']").click();
    await game.flush();
    expect(q(container, "[data-testid='cup-state']").textContent).toContain("No cup in use.");
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("Wrong step");
  });

  it("lets the patience bar run out and the customer leave", async () => {
    const container = await openDayOneShift();
    const game = rig as Rig;
    await advanceTo(game, 27);
    expect(q(container, "[data-testid='shift-live']").textContent).toContain(
      "Visitor sits at seat",
    );
    await advanceTo(game, 86.5);
    expect(q(container, "[data-testid='shift-live']").textContent).toBe("Visitor left.");
    expect(container.querySelector(".tlw-seat--ghost")).not.toBeNull();
  });

  it("shows a numeric patience badge under ten seconds", async () => {
    const container = await openDayOneShift();
    const game = rig as Rig;
    await advanceTo(game, 78);
    const low = container.querySelector(".tlw-seat--low");
    expect(low).not.toBeNull();
    expect(low?.querySelector(".tlw-patience__num")?.textContent).toMatch(/\d+s/);
    expect(defaultProfile().day).toBe(1);
  });
});
