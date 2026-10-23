import { getMap } from "@web-games/floodplain-dispatch-core";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buttonByText, mountApp, press, q, type Rig, starsFor, text } from "./helpers";
import { clickByText, Pilot, tick } from "./pilot";

let rig: Rig | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const v01 = getMap("v01");

function toolButton(tool: string): HTMLButtonElement {
  return q<HTMLButtonElement>(rig?.container as HTMLElement, `[data-tool='${tool}']`);
}

async function openV01(options: Parameters<typeof mountApp>[0] = {}): Promise<Pilot> {
  rig = await mountApp({ route: ["board", { mapId: "v01" }], ...options });
  return new Pilot(rig, "v01");
}

describe("planning", () => {
  it("renders the board, forecast, budget, tray and actions for a map", async () => {
    await openV01();
    const root = rig?.container as HTMLElement;
    expect(q(root, "[data-screen='board']")).toBeTruthy();
    expect(text(q(root, "[data-testid='forecast']"))).toContain("No events forecast");
    expect(text(q(root, "[data-testid='budget-left']"))).toBe("9 of 9 left");
    expect(text(q(root, ".fd-budget__par"))).toBe("Par 6");
    const tools = Array.from(root.querySelectorAll<HTMLButtonElement>(".fd-tool"));
    expect(tools.map((t) => t.dataset.tool)).toEqual(["canal", "erase", "select"]);
    expect(tools[0]?.getAttribute("aria-label")).toBe("Canal, costs 1");
    expect(tools[0]?.getAttribute("aria-pressed")).toBe("true");
    for (const label of ["Undo", "Redo", "Clear", "Hint", "Run season"]) {
      expect(buttonByText(root, label)).toBeTruthy();
    }
    expect(buttonByText(root, "Undo").disabled).toBe(true);
    expect(rig?.ctx.count("fillRect")).toBeGreaterThan(50);
    expect(q(root, "[data-testid='board-live']").textContent).toContain("Board 8 by 12");
  });

  it("lists forecast events for a surge map", async () => {
    rig = await mountApp({
      route: ["board", { mapId: "v04" }],
      profile: { stars: starsFor(["v01", "v02", "v03"]) },
    });
    const forecast = text(q(rig.container, "[data-testid='forecast']"));
    expect(forecast).toContain("Surge plus 2, weeks 9 to 11");
  });

  it("places pieces with the keyboard, shows the cursor cell and updates the budget", async () => {
    const pilot = await openV01();
    await pilot.goto(1, 1);
    expect(pilot.live()).toContain("Column 2, row 2: empty land, height 5");
    await press(pilot.host, "Enter");
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
    expect(pilot.live()).toContain("Canal, height 5");
    expect(pilot.live()).toContain("pieces placed 1");
    await pilot.goto(2, 1);
    await press(pilot.host, "Enter");
    await press(pilot.host, "Backspace");
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
  });

  it("explains why a placement is refused", async () => {
    const pilot = await openV01();
    await pilot.goto(0, 2);
    await press(pilot.host, "Enter");
    expect(text(q(rig?.container as HTMLElement, ".wg-toast"))).toBe(
      "Only open land takes a piece.",
    );
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
  });

  it("undoes and redoes with the buttons and the keyboard", async () => {
    const pilot = await openV01();
    await pilot.place({ x: 1, y: 1, kind: "canal" });
    await pilot.place({ x: 2, y: 1, kind: "canal" });
    expect(pilot.budgetLeft()).toBe("7 of 9 left");
    await clickByText(rig as Rig, "Undo");
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
    expect(buttonByText(rig?.container as HTMLElement, "Redo").disabled).toBe(false);
    await clickByText(rig as Rig, "Redo");
    expect(pilot.budgetLeft()).toBe("7 of 9 left");
    await press(pilot.host, "z", { ctrlKey: true });
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
    await press(pilot.host, "z", { ctrlKey: true, shiftKey: true });
    expect(pilot.budgetLeft()).toBe("7 of 9 left");
    await clickByText(rig as Rig, "Clear");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
    await clickByText(rig as Rig, "Undo");
    expect(pilot.budgetLeft()).toBe("7 of 9 left");
  });

  it("paints a connected canal by dragging and undoes the stroke in one step", async () => {
    const pilot = await openV01();
    await pilot.drag([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 3 },
    ]);
    expect(pilot.budgetLeft()).toBe("4 of 9 left");
    await clickByText(rig as Rig, "Undo");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
  });

  it("cancels a drag that leaves the board", async () => {
    const pilot = await openV01();
    await pilot.pointer("down", 1, 1);
    await pilot.pointer("move", 2, 1);
    await act(() => {
      pilot.canvas.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: 9999, clientY: 9999 }),
      );
    });
    await pilot.pointer("move", 3, 1);
    await pilot.pointer("up", 3, 1);
    expect(pilot.budgetLeft()).toBe("7 of 9 left");
  });

  it("places with a tap, inspects a tapped piece and erases with the eraser or a long press", async () => {
    const pilot = await openV01();
    await pilot.tap(1, 1);
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
    await pilot.tap(1, 1);
    expect(rig?.container.querySelector("[role='dialog']")).not.toBeNull();
    await clickByText(rig as Rig, "Remove piece (Refunds 1)");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
    expect(rig?.container.querySelector("[role='dialog']")).toBeNull();

    await pilot.tap(2, 1);
    await act(() => toolButton("erase").click());
    await pilot.tap(2, 1);
    expect(pilot.budgetLeft()).toBe("9 of 9 left");

    await act(() => toolButton("canal").click());
    await pilot.tap(3, 1);
    await pilot.pointer("down", 3, 1);
    await tick(600);
    await pilot.pointer("up", 3, 1);
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
  });

  it("cycles the zoom steps and keeps the cursor cell on screen", async () => {
    const pilot = await openV01();
    const zoom = () => buttonByText(rig?.container as HTMLElement, "Zoom, now Fit");
    await act(() => zoom().click());
    expect(buttonByText(rig?.container as HTMLElement, "Zoom, now 1.5x")).toBeTruthy();
    await clickByText(rig as Rig, "1.5x");
    expect(buttonByText(rig?.container as HTMLElement, "Zoom, now 2x")).toBeTruthy();
    await pilot.goto(7, 11);
    await clickByText(rig as Rig, "2x");
    expect(buttonByText(rig?.container as HTMLElement, "Zoom, now Fit")).toBeTruthy();
  });
});

describe("hints", () => {
  it("spends coins, draws a ghost of the next reference piece and clears it when placed", async () => {
    const pilot = await openV01({ profile: { coins: 100 } });
    await clickByText(rig as Rig, "Hint");
    expect(text(q(rig?.container as HTMLElement, "[data-testid='hint-cost']"))).toBe(
      "Costs 25 coins. You have 100.",
    );
    rig?.ctx.reset();
    await clickByText(rig as Rig, "Show hint");
    await rig?.flush();
    expect(rig?.app.game.getState().profile.coins).toBe(75);
    expect(rig?.app.game.getState().profile.stats.hintsUsed).toBe(1);
    expect(pilot.live()).toContain("Hint: a Canal belongs at column 1, row 1");
    expect(rig?.ctx.calls("setLineDash").some((c) => JSON.stringify(c) === "[[4,3]]")).toBe(true);
    await pilot.place({ x: 0, y: 0, kind: "canal" });
    rig?.ctx.reset();
    await pilot.goto(2, 1);
    expect(rig?.ctx.calls("setLineDash").some((c) => JSON.stringify(c) === "[[4,3]]")).toBe(false);
  });

  it("refuses a hint the player cannot afford and says so when the plan already matches", async () => {
    const pilot = await openV01({ profile: { coins: 10 } });
    await clickByText(rig as Rig, "Hint");
    expect(buttonByText(rig?.container as HTMLElement, "Show hint").disabled).toBe(true);
    expect(text(rig?.container as HTMLElement)).toContain("Not enough coins for a hint yet.");
    await clickByText(rig as Rig, "Cancel");
    await pilot.placeAll(v01.reference);
    await clickByText(rig as Rig, "Hint");
    expect(rig?.container.querySelector("[role='dialog']")).toBeNull();
    expect(pilot.live()).toContain("Your plan already matches the reference.");
    expect(rig?.app.game.getState().profile.coins).toBe(10);
  });
});

describe("inspector", () => {
  it("rotates a pump and removes it", async () => {
    rig = await mountApp({
      route: ["board", { mapId: "v06" }],
      profile: { stars: starsFor(["v01", "v02", "v03", "v04", "v05"]) },
    });
    const pilot = new Pilot(rig, "v06");
    await pilot.place({ x: 5, y: 3, kind: "pump", dir: "E" });
    expect(pilot.live()).toContain("Pump east");
    await pilot.goto(5, 3);
    await press(pilot.host, "r");
    expect(pilot.live()).toContain("Pump south");
    await press(pilot.host, "Enter");
    expect(text(q(rig.container, "[data-testid='pump-facing']"))).toBe("Facing south");
    await clickByText(rig, "Rotate pump");
    expect(text(q(rig.container, "[data-testid='pump-facing']"))).toBe("Facing west");
    await clickByText(rig, "Remove piece (Refunds 3)");
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    expect(pilot.budgetLeft()).toBe("17 of 17 left");
  });

  it("changes the gate weeks with two steppers and keeps them valid", async () => {
    rig = await mountApp({
      route: ["board", { mapId: "d01" }],
      profile: {
        stars: starsFor(["v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v09", "v10"]),
      },
    });
    const pilot = new Pilot(rig, "d01");
    await pilot.place({ x: 2, y: 6, kind: "gate" });
    await press(pilot.host, "Enter");
    const opens = () => text(q(rig?.container as HTMLElement, "[data-testid='stepper-opens']"));
    const closes = () => text(q(rig?.container as HTMLElement, "[data-testid='stepper-closes']"));
    expect([opens(), closes()]).toEqual(["0", "22"]);
    const plus = (name: string) => buttonByText(rig?.container as HTMLElement, `${name}: Later`);
    const minus = (name: string) => buttonByText(rig?.container as HTMLElement, `${name}: Earlier`);
    await act(() => plus("Opens at week").click());
    await act(() => plus("Opens at week").click());
    await act(() => minus("Closes at week").click());
    expect([opens(), closes()]).toEqual(["2", "21"]);
    expect(minus("Opens at week").disabled).toBe(false);
    for (let i = 0; i < 25; i++) {
      if (!plus("Opens at week").disabled) await act(() => plus("Opens at week").click());
    }
    expect(opens()).toBe("20");
    expect(plus("Opens at week").disabled).toBe(true);
    expect(minus("Closes at week").disabled).toBe(true);
    await clickByText(rig, "Done");
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
  });
});
