import {
  defaultProfile,
  type OptionKey,
  type Profile,
  type SceneDef,
  sceneFor,
} from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import { CARDS } from "../src/onboarding/cardText";
import { CARD_FLAGS, type CardId, FLAG_TUTORIAL } from "../src/onboarding/flags";
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

const dayOne = (extra: Partial<Profile> = {}) => ({
  route: ["shift", { kind: "day", day: 1 }] as ["shift", unknown],
  onboarding: true,
  profile: {
    day: 1,
    stock: { pastries: ["pastry-1" as const], books: ["book-1" as const] },
    ...extra,
  },
});

const coach = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>("[aria-label='Tutorial']");
const clock = (container: HTMLElement): string =>
  q(container, "[data-testid='clock']").textContent ?? "";
const dialogTitle = (container: HTMLElement): string =>
  container.querySelector("[role='dialog'] .wg-sheet__title")?.textContent ?? "";

describe("Day 1 guided shift", () => {
  it("opens with Marit's note, halts the clock, and starts the shift when acknowledged", async () => {
    rig = await mountApp(dayOne());
    const container = rig.container;
    expect(dialogTitle(container)).toBe("Keep the lamp lit");
    expect(text(container)).toContain("Step 1 of 7");
    const before = clock(container);
    await rig.advance(5000);
    expect(clock(container)).toBe(before);
    await clickByText(container, "Open the shop");
    await rig.advance(2000);
    expect(clock(container)).not.toBe(before);
    expect(text(container)).toContain("Tobias");
  });

  it("walks every coach step by the real actions and saves the flag at the end", async () => {
    rig = await mountApp(dayOne());
    const game = rig;
    const container = game.container;
    await clickByText(container, "Open the shop");
    await game.advance(1100);
    expect(coach(container)?.textContent).toContain("Meet Tobias");
    await selectSeat(game, "Tobias");
    expect(coach(container)?.textContent).toContain("Make a Harbour Black");
    await makeDrink(game, "drink-1");
    expect(coach(container)?.textContent).toContain("Serve and see the tip");
    await serveActive(game);
    expect(coach(container)).toBeNull();
    expect(profileOf(game).flags[FLAG_TUTORIAL]).toBeUndefined();

    await game.advance(20000);
    expect(coach(container)?.textContent).toContain("Pastries and the oven");
    await selectSeat(game, "Priya");
    await makeDrink(game, "drink-3");
    await makePastry(game, "pastry-1");
    expect(coach(container)?.textContent).toContain("Pastries and the oven");
    await serveActive(game);
    expect(coach(container)).toBeNull();

    await game.advance(36000);
    expect(coach(container)?.textContent).toContain("A book for Odile");
    await selectSeat(game, "Odile");
    await makeDrink(game, "drink-1");
    await giveBook(game, "book-1");
    expect(coach(container)?.textContent).toContain("Watch the patience bar");
    await clickByText(container, "Finish the shift");
    expect(coach(container)).toBeNull();
    await game.flush();
    expect(profileOf(game).flags[FLAG_TUTORIAL]).toBe(true);
  });

  it("can be skipped, saves the flag and lets the shift run", async () => {
    rig = await mountApp(dayOne());
    const container = rig.container;
    expect(hasButton(container, "Skip tutorial")).toBe(true);
    await clickByText(container, "Skip tutorial");
    await rig.flush();
    expect(profileOf(rig).flags[FLAG_TUTORIAL]).toBe(true);
    expect(container.querySelector("[role='dialog']")).toBeNull();
    const before = clock(container);
    await rig.advance(3000);
    expect(clock(container)).not.toBe(before);
    await rig.advance(2000);
    expect(coach(container)).toBeNull();
  });

  it("never repeats once the flag is saved", async () => {
    rig = await mountApp({
      ...dayOne(),
      profile: { ...dayOne().profile, flags: { [FLAG_TUTORIAL]: true } },
    });
    await rig.advance(3000);
    expect(coach(rig.container)).toBeNull();
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
  });

  it("is only shown on Day 1", async () => {
    rig = await mountApp({ ...dayOne({ day: 2 }), route: ["shift", { kind: "day", day: 2 }] });
    await rig.advance(2000);
    expect(coach(rig.container)).toBeNull();
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
  });

  it("is replayed from How to play by clearing the flag and opening Day 1", async () => {
    rig = await mountApp({
      route: ["howto"],
      profile: { day: 4, flags: { [FLAG_TUTORIAL]: true } },
    });
    await clickByText(rig.container, "Replay the guided shift");
    await rig.flush();
    expect(profileOf(rig).flags[FLAG_TUTORIAL]).toBeUndefined();
    expect(currentScreen(rig)).toBe("day");
    expect(rig.app.router.current.params).toEqual({ day: 1 });
  });
});

describe("first-time cards", () => {
  const seen = (id: CardId): boolean => profileOf(rig as Rig).flags[CARD_FLAGS[id]] === true;
  const dialog = (container: HTMLElement): string => dialogTitle(container);

  it("shows the stock card once on the first plan", async () => {
    rig = await mountApp({
      route: ["prep", { kind: "day", day: 2 }],
      onboarding: true,
      profile: { day: 2 },
    });
    const container = rig.container;
    expect(dialog(container)).toBe(CARDS.stock.title);
    expect(text(container)).toContain("5 portions");
    await rig.flush();
    expect(seen("stock")).toBe(true);
    await clickByText(container, "Got it");
    expect(container.querySelector("[role='dialog']")).toBeNull();
    rig.unmount();
    rig = await mountApp({
      route: ["prep", { kind: "day", day: 3 }],
      onboarding: true,
      profile: { day: 3, flags: { [CARD_FLAGS.stock]: true } },
    });
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
  });

  it("shows the rain card on the first rainy shift and pauses the clock behind it", async () => {
    rig = await mountApp({
      route: ["shift", { kind: "day", day: 3 }],
      onboarding: true,
      profile: {
        day: 3,
        stock: { pastries: ["pastry-1"], books: ["book-1"] },
        flags: { [FLAG_TUTORIAL]: true },
      },
    });
    const container = rig.container;
    expect(dialogTitle(container)).toBe(CARDS.rain.title);
    const before = clock(container);
    await rig.advance(4000);
    expect(clock(container)).toBe(before);
    await clickByText(container, "Got it");
    await rig.advance(2000);
    expect(clock(container)).not.toBe(before);
    expect(seen("rain")).toBe(true);
  });

  it("shows the Late Shift card once on the first Late Shift", async () => {
    rig = await mountApp({
      route: ["shift", { kind: "late" }],
      onboarding: true,
      profile: { day: 15, stock: { pastries: ["pastry-1"], books: ["book-1"] } },
    });
    expect(dialogTitle(rig.container)).toBe(CARDS.late.title);
    await clickByText(rig.container, "Got it");
    await rig.flush();
    expect(seen("late")).toBe(true);
  });

  function readyScene(script: SceneDef): Partial<Profile> {
    return {
      day: 15,
      flags: { [CARD_FLAGS.stock]: true },
      regulars: {
        ...defaultProfile().regulars,
        [script.regular]: {
          fp: 8,
          visits: 5,
          scenesDone: script.index - 1,
          choices: {},
          ending: null,
        },
      },
      pendingEvening: [script.id],
    };
  }

  it("shows the story card once and the choice card at the first choice", async () => {
    const script = sceneFor(1, 3) as SceneDef;
    rig = await mountApp({
      route: ["scene", { ids: [script.id], index: 0, after: "home", replay: false }],
      onboarding: true,
      profile: readyScene(script),
    });
    const container = rig.container;
    expect(dialogTitle(container)).toBe(CARDS.scene.title);
    await clickByText(container, "Got it");
    await rig.flush();
    expect(seen("scene")).toBe(true);
    for (let guard = 0; guard < 60 && !container.querySelector("[data-testid='choice']"); guard++) {
      const dialogue = container.querySelector("[data-testid='dialogue']");
      if (!dialogue) break;
      await press(dialogue, "Enter");
    }
    expect(dialogTitle(container)).toBe(CARDS.choice.title);
    await clickByText(container, "Got it");
    await rig.flush();
    expect(seen("choice")).toBe(true);
    const pick: OptionKey = "a";
    await click(
      container.querySelectorAll("[data-testid='choice'] button")[
        pick === "a" ? 0 : 1
      ] as HTMLElement,
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("shows the decor card after the first purchase only", async () => {
    rig = await mountApp({
      route: ["shop"],
      onboarding: true,
      profile: { day: 4, coins: 200 },
    });
    const container = rig.container;
    await click(q(container, "[data-decor='decor-1']"));
    await clickByText(container, "Buy it");
    await rig.flush();
    expect(dialogTitle(container)).toBe(CARDS.decor.title);
    await clickByText(container, "Got it");
    await rig.flush();
    expect(seen("decor")).toBe(true);
    await click(q(container, "[data-decor='decor-2']"));
    await clickByText(container, "Buy it");
    await rig.flush();
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
