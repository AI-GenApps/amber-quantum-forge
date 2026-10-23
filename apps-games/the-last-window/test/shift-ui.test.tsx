import { PATIENCE_TABLE, type Profile, TICK_MS } from "@web-games/the-last-window-core";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import {
  click,
  clickByText,
  currentScreen,
  hasButton,
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

async function openShift(day: number, profile: Partial<Profile> = {}): Promise<HTMLElement> {
  rig = await mountApp({
    route: ["shift", { kind: "day", day }],
    profile: { day, stock: { pastries: ["pastry-1"], books: ["book-1"] }, ...profile },
  });
  return rig.container;
}

const clock = (container: HTMLElement): string =>
  q(container, "[data-testid='clock']").textContent ?? "";

describe("pause, quit and back", () => {
  it("stops the clock while the pause sheet is open and resumes after", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(5000);
    const before = clock(container);
    await clickByText(container, "Pause");
    expect(q(container, "[role='dialog']").textContent).toContain("Paused");
    await game.advance(20000);
    expect(clock(container)).toBe(before);
    await clickByText(container, "Resume");
    await game.advance(5000);
    expect(clock(container)).not.toBe(before);
  });

  it("opens the pause sheet when the page is hidden and holds the clock", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(3000);
    const before = clock(container);
    await act(() => game.visibility.setHidden(true));
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    await game.advance(10000);
    expect(clock(container)).toBe(before);
    await act(() => game.visibility.setHidden(false));
    await clickByText(container, "Resume");
    await game.advance(3000);
    expect(clock(container)).not.toBe(before);
  });

  it("Escape pauses and closes, Android back closes a sheet before pausing", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await press(document, "Escape");
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    await press(q(container, "[role='dialog']"), "Escape");
    expect(container.querySelector("[role='dialog']")).toBeNull();

    const [handler] = game.backHandlers;
    expect(handler).toBeDefined();
    expect(game.app.router.handleBack()).toBe(true);
    await game.flush();
    expect(container.querySelector("[role='dialog']")?.textContent).toContain("Paused");
    await clickByText(container, "Quit shift");
    expect(q(container, "[role='dialog']").textContent).toContain("Quit this shift?");
    game.app.router.handleBack();
    await game.flush();
    expect(q(container, "[role='dialog']").textContent).toContain("Paused");
    game.app.router.handleBack();
    await game.flush();
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(currentScreen(game)).toBe("shift");
  });

  it("quitting abandons the shift without rewards and returns to the previous screen", async () => {
    rig = await mountApp({ route: ["home"] });
    const container = rig.container;
    await clickByText(container, "Continue: Day 1");
    await clickByText(container, "Plan the shelves");
    await clickByText(container, "Open shop");
    await rig.flush();
    const paid = profileOf(rig).coins;
    await rig.advance(30000);
    await clickByText(container, "Pause");
    await clickByText(container, "Quit shift");
    await clickByText(container, "Quit shift");
    expect(currentScreen(rig)).toBe("day");
    expect(profileOf(rig).day).toBe(1);
    expect(profileOf(rig).coins).toBe(paid);
    expect(profileOf(rig).diary).toEqual([]);
  });

  it("asks before serving an empty tray", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    await serveActive(game);
    expect(q(container, "[role='dialog']").textContent).toContain("Serve an empty tray?");
    await clickByText(container, "Go back");
    expect(container.querySelector("[role='dialog']")).toBeNull();
    await press(document, " ");
    await clickByText(container, "Serve anyway");
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("disappointed");
  });

  it("asks to exit from the Android back button at the root", async () => {
    rig = await mountApp({ route: ["home"] });
    const container = rig.container;
    const [handler] = rig.backHandlers;
    expect(handler).toBeDefined();
    expect(rig.app.router.handleBack()).toBe(false);
    expect(rig.app.router.canGoBack).toBe(false);
    await clickByText(container, "Settings");
    expect(currentScreen(rig)).toBe("settings");
    expect(rig.app.router.handleBack()).toBe(true);
    expect(currentScreen(rig)).toBe("home");
  });
});

describe("stations", () => {
  it("lights the next recipe step when the guide is on and not when it is off", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    const glowing = (): string[] =>
      [...container.querySelectorAll("[data-testid='drink-station'] .tlw-step--guide")].map(
        (el) => el.getAttribute("data-token") ?? "",
      );
    expect(glowing()).toEqual(["cup"]);
    expect(
      q(container, "[data-testid='drink-station'] [data-token='cup']").getAttribute("aria-label"),
    ).toBe("Harbour Black step 1 of 3: cup");
    await click(q(container, "[data-token='cup']"));
    expect(glowing()).toEqual(["brew"]);
    rig?.unmount();

    const off = await openShift(1, {
      settings: { recipeGuide: false, relaxed: false, textSize: "normal" },
    });
    await (rig as Rig).advance(1100);
    await selectSeat(rig as Rig, "Tobias");
    expect(off.querySelectorAll(".tlw-step--guide")).toHaveLength(0);
  });

  it("bakes a pastry while the player makes a drink, then flashes the plate", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(21000);
    await selectSeat(game, "Priya");
    await click(q(container, "[data-pastry='pastry-1']"));
    expect(text(q(container, "[data-testid='plate-0']"))).toContain("Step 2 of 2");
    await click(q(container, "[data-testid='pastry-station'] .tlw-steps [data-token='warm']"));
    expect(text(q(container, "[data-testid='plate-0']"))).toContain("Oven");
    await makeDrink(game, "drink-3");
    expect(text(q(container, "[data-testid='tray']"))).toContain("Fog Tea");
    await game.advance(1500);
    expect(text(q(container, "[data-testid='tray']"))).toContain("Salted Butter Roll");
    await serveActive(game);
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("Priya is delighted");
  });

  it("discards a tray item and a plate", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(21000);
    await selectSeat(game, "Priya");
    await makePastry(game, "pastry-1");
    await game.advance(1500);
    expect(text(q(container, "[data-testid='tray']"))).toContain("Salted Butter Roll");
    await clickByText(container, "Discard Salted Butter Roll");
    expect(text(q(container, "[data-testid='tray']"))).toContain("Nothing on the tray yet.");
    await click(q(container, "[data-pastry='pastry-1']"));
    await clickByText(container, "Discard Salted Butter Roll");
    expect(text(q(container, "[data-testid='plate-0']"))).toContain("empty");
  });

  it("gives the requested book from the shelf", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    await makeDrink(game, "drink-1");
    await serveActive(game);
    await game.advance(56000 - game.scheduler.now + 1000);
    await selectSeat(game, "Odile");
    await giveBook(game, "book-1");
    expect(text(q(container, "[data-testid='tray']"))).toContain("The Lamplighter's Almanac");
    expect(container.querySelector("[data-book]")).toBeNull();
  });

  it("applies relaxed mode to the engine so customers wait longer", async () => {
    const day = PATIENCE_TABLE[0]?.seconds ?? 60;
    const normal = await openShift(2, {
      settings: { recipeGuide: true, relaxed: false, textSize: "normal" },
    });
    await (rig as Rig).advance(15000);
    const label = (root: HTMLElement): string =>
      root.querySelector("[data-seat]")?.getAttribute("aria-label") ?? "";
    const base = Number(/Patience (\d+) seconds/.exec(label(normal))?.[1]);
    rig?.unmount();
    const relaxed = await openShift(2, {
      settings: { recipeGuide: true, relaxed: true, textSize: "normal" },
    });
    await (rig as Rig).advance(15000);
    const longer = Number(/Patience (\d+) seconds/.exec(label(relaxed))?.[1]);
    expect(day).toBe(60);
    expect(longer).toBeGreaterThan(base);
    expect(longer).toBeGreaterThanOrEqual(Math.floor(base * 1.45));
    expect(TICK_MS).toBe(100);
  });
});

describe("keyboard", () => {
  it("leaves Space, 1, 2 and 3 alone while a sheet is open", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    const free = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    document.dispatchEvent(free);
    expect(free.defaultPrevented).toBe(true);
    await clickByText(container, "Pause");
    for (const key of [" ", "1", "2", "3"]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented, key).toBe(false);
    }
    expect(q(container, "[data-seat='0']").getAttribute("aria-pressed")).toBe("false");
  });

  it("suppresses the click that a handled Space key-up would cause", async () => {
    await openShift(1);
    await (rig as Rig).advance(1100);
    await press(document, " ");
    const up = new KeyboardEvent("keyup", { key: " ", bubbles: true, cancelable: true });
    document.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true);
    const other = new KeyboardEvent("keyup", { key: "a", bubbles: true, cancelable: true });
    document.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
  });
});

describe("seat taps", () => {
  it("serves when the active customer is tapped again", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    expect(q(container, "[data-seat='0']").getAttribute("aria-label")).toContain(
      "Taking all the time they need.",
    );
    await makeDrink(game, "drink-1");
    await click(q(container, "[data-seat='0']"));
    expect(q(container, "[data-testid='shift-live']").textContent).toContain("Tobias is delighted");
  });

  it("asks before a second tap serves an empty tray", async () => {
    const container = await openShift(1);
    const game = rig as Rig;
    await game.advance(1100);
    await selectSeat(game, "Tobias");
    await click(q(container, "[data-seat='0']"));
    expect(q(container, "[role='dialog']").textContent).toContain("Serve an empty tray?");
  });
});

describe("buttons that must not exist", () => {
  it("has no Late Shift button in the shift", async () => {
    const container = await openShift(1);
    expect(hasButton(container, "Late Shift")).toBe(false);
  });
});
