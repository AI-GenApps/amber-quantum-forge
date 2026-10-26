import {
  defaultProfile,
  getChallenge,
  MAX_GALLERY,
  type Profile,
  TRAY_TAB_LABELS,
} from "@web-games/dress-rehearsal-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  all,
  buttonByText,
  click,
  currentScreen,
  mountApp,
  press,
  q,
  RIVIERA_IDS,
  type Rig,
  starsFor,
  text,
} from "./helpers";
import {
  card,
  dragPlace,
  dragTo,
  keyPlace,
  openTab,
  piece,
  RIV01_LOOK,
  settle,
  slotEl,
  startBoard,
  tapPlace,
} from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function openBoard(challengeId = "riv-01", profile: Partial<Profile> = {}): Promise<Rig> {
  rig = await mountApp({ route: ["styling", { challengeId }], profile });
  await startBoard();
  return rig;
}

const live = (r: Rig): string => text(q(r.container, "[data-testid='live']"));
const chip = (r: Rig, code: string): HTMLElement => q(r.container, `.dr-chip[data-code='${code}']`);
const harmonyValue = (r: Rig): string => text(q(r.container, "[data-testid='harmony-value']"));

async function finishAndRead(r: Rig): Promise<HTMLElement> {
  await click(buttonByText(r.container, "Finish look"));
  await settle(r);
  return q<HTMLElement>(document.body, "[data-testid='result']");
}

describe("campaign flow", () => {
  it("goes Home to Chapters to Challenges to Brief to Styling to Result", async () => {
    rig = await mountApp();
    await click(buttonByText(rig.container, "Play"));
    expect(currentScreen(rig)).toBe("chapters");
    await click(q(rig.container, "[data-chapter='riviera']"));
    expect(currentScreen(rig)).toBe("challenges");
    await click(q(rig.container, "[data-challenge='riv-01']"));
    expect(currentScreen(rig)).toBe("styling");
    const brief = q(document.body, "[data-testid='brief']");
    expect(text(brief)).toContain("Mireille Vasseur");
    expect(text(brief)).toContain("Lunch on the quay");
    expect(text(brief)).toContain("6 slots");
    await startBoard();
    expect(document.body.querySelector("[data-testid='brief']")).toBeNull();
    for (const id of RIV01_LOOK) await tapPlace(rig, id);
    await settle(rig);
    const result = await finishAndRead(rig);
    expect(text(result)).toContain("Polished");
    expect(all(result, ".wg-star--on")).toHaveLength(3);
    expect(rig.app.game.getState().profile.stars["riv-01"]).toBe(3);
  });

  it("reaches three stars by dragging every piece onto its slot", async () => {
    const r = await openBoard();
    for (const id of RIV01_LOOK) await dragPlace(r, id);
    await settle(r);
    for (const slot of ["top", "bottom", "shoes", "bag", "hat", "accessory"]) {
      expect(slotEl(r, slot).dataset.filled).toBe("true");
    }
    const result = await finishAndRead(r);
    expect(all(result, ".wg-star--on")).toHaveLength(3);
  });

  it("reaches three stars with the keyboard alone", async () => {
    const r = await openBoard();
    for (const id of RIV01_LOOK) await keyPlace(r, id);
    await settle(r);
    const finish = buttonByText(r.container, "Finish look");
    finish.focus();
    expect(finish.disabled).toBe(false);
    const result = await finishAndRead(r);
    expect(all(result, ".wg-star--on")).toHaveLength(3);
    expect(text(q(result, "[data-testid='result-star-name']"))).toBe("Polished");
  });

  it("keeps Finish look disabled until every slot is filled", async () => {
    const r = await openBoard();
    const hint = (): string => text(q(r.container, "[data-testid='finish-hint']"));
    expect(buttonByText(r.container, "Finish look").disabled).toBe(true);
    expect(hint()).toBe("6 slots left to fill");
    await tapPlace(r, "item-riviera-1");
    expect(hint()).toBe("5 slots left to fill");
    expect(buttonByText(r.container, "Finish look").disabled).toBe(true);
    for (const id of RIV01_LOOK.slice(1)) await tapPlace(r, id);
    expect(hint()).toBe("Every slot is filled.");
    expect(buttonByText(r.container, "Finish look").disabled).toBe(false);
  });

  it("updates the rule chips and harmony after every placement", async () => {
    const r = await openBoard();
    expect(chip(r, "needs-feature:shade").dataset.met).toBe("pending");
    expect(chip(r, "warmth-max:2").dataset.met).toBe("pending");
    expect(text(chip(r, "warmth-max:2"))).toContain("Not checked yet");
    expect(harmonyValue(r)).toBe("0 of 100");
    await tapPlace(r, "item-rainy-city-3");
    expect(chip(r, "needs-feature:shade").dataset.met).toBe("false");
    expect(chip(r, "warmth-max:2").dataset.met).toBe("true");
    expect(text(chip(r, "needs-feature:shade"))).toContain("Not met");
    await tapPlace(r, "item-riviera-7");
    expect(chip(r, "needs-feature:shade").dataset.met).toBe("true");
    expect(harmonyValue(r)).not.toBe("0 of 100");
    expect(live(r)).toContain("Hat: Wide-Brim Sun Hat placed.");
    expect(live(r)).toContain("Rules met 2 of 2.");
    expect(live(r)).toContain("Now met:");
    const before = harmonyValue(r);
    await tapPlace(r, "item-rainy-city-4");
    expect(harmonyValue(r)).not.toBe(before);
    expect(chip(r, "warmth-max:2").dataset.met).toBe("false");
    expect(all(chip(r, "warmth-max:2"), "svg[data-icon]")[0]?.dataset.icon).toBe("cross");
    expect(live(r)).toContain("No longer met:");
    await click(buttonByText(r.container, "Undo"));
    expect(all(chip(r, "warmth-max:2"), "svg[data-icon]")[0]?.dataset.icon).toBe("check");
  });

  it("refuses a wrong-category drop and a wrong tap with a toast naming the right slot", async () => {
    const r = await openBoard();
    await openTab(r, "hat");
    await dragTo(card(r, "item-riviera-7"), slotEl(r, "top"));
    expect(slotEl(r, "top").dataset.filled).toBe("false");
    expect(slotEl(r, "hat").dataset.filled).toBe("false");
    expect(text(q(document.body, ".wg-toast"))).toBe("Wide-Brim Sun Hat goes in the Hat slot.");
    await click(card(r, "item-riviera-7"));
    await click(slotEl(r, "bag"));
    expect(slotEl(r, "bag").dataset.filled).toBe("false");
    expect(live(r)).toContain("goes in the Hat slot");
  });

  it("cancels a drag released outside every slot", async () => {
    const r = await openBoard();
    await openTab(r, "hat");
    await dragTo(card(r, "item-riviera-7"), null);
    expect(slotEl(r, "hat").dataset.filled).toBe("false");
    expect(document.body.querySelector("[data-testid='ghost']")).toBeNull();
  });

  it("clears top and bottom for a dress on riv-03 and the dress for a top", async () => {
    const r = await openBoard("riv-03", { stars: starsFor(["riv-01", "riv-02"]) });
    await tapPlace(r, "item-riviera-1");
    await tapPlace(r, "item-riviera-3");
    expect(slotEl(r, "top").dataset.filled).toBe("true");
    expect(slotEl(r, "bottom").dataset.filled).toBe("true");
    await tapPlace(r, "item-rainy-city-7");
    expect(slotEl(r, "dress").dataset.filled).toBe("true");
    expect(slotEl(r, "top").dataset.filled).toBe("false");
    expect(slotEl(r, "bottom").dataset.filled).toBe("false");
    await tapPlace(r, "item-riviera-1");
    expect(slotEl(r, "dress").dataset.filled).toBe("false");
    expect(slotEl(r, "top").dataset.filled).toBe("true");
  });

  it("swaps, removes, undoes, redoes and clears", async () => {
    const r = await openBoard();
    await tapPlace(r, "item-riviera-1");
    await tapPlace(r, "item-rainy-city-3");
    expect(text(slotEl(r, "top"))).toContain("Grey Wool Jumper");
    expect(card(r, "item-riviera-1").dataset.placed).toBe("false");
    expect(card(r, "item-rainy-city-3").dataset.placed).toBe("true");
    expect(live(r)).toContain("Replaced Breton Stripe Tee.");

    await click(slotEl(r, "top"));
    expect(slotEl(r, "top").dataset.selected).toBe("true");
    await click(buttonByText(r.container, "Remove"));
    expect(slotEl(r, "top").dataset.filled).toBe("false");

    await click(buttonByText(r.container, "Undo"));
    expect(slotEl(r, "top").dataset.filled).toBe("true");
    expect(live(r)).toContain("Undone.");
    await click(buttonByText(r.container, "Redo"));
    expect(slotEl(r, "top").dataset.filled).toBe("false");
    await click(buttonByText(r.container, "Undo"));

    await tapPlace(r, "item-riviera-7");
    await click(buttonByText(r.container, "Clear"));
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(0);
    expect(live(r)).toContain("Board cleared.");
    await press(q(r.container, ".dr-styling"), "z", { ctrlKey: true });
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(2);
    await press(q(r.container, ".dr-styling"), "y", { ctrlKey: true });
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(0);
  });

  it("removes a piece with Backspace on a focused slot and by dragging it off the board", async () => {
    const r = await openBoard();
    await tapPlace(r, "item-riviera-7");
    await tapPlace(r, "item-riviera-6");
    const hat = slotEl(r, "hat");
    hat.focus();
    await press(hat, "Backspace");
    expect(hat.dataset.filled).toBe("false");
    await dragTo(slotEl(r, "bag"), null);
    expect(slotEl(r, "bag").dataset.filled).toBe("false");
  });

  it("selects a slot with Enter and opens its tray tab", async () => {
    const r = await openBoard();
    const shoes = slotEl(r, "shoes");
    shoes.focus();
    await press(shoes, "Enter");
    const selectedTab = q(r.container, "[role='tab'][aria-selected='true']");
    expect(text(selectedTab)).toBe("Shoes");
    expect(live(r)).toContain("Shoes tab opened.");
  });

  it("moves between tray cards with the arrow keys", async () => {
    const r = await openBoard();
    await openTab(r, "top");
    const first = q(r.container, ".dr-piece");
    first.focus();
    await press(first, "ArrowRight");
    const cards = all(r.container, ".dr-piece");
    expect(document.activeElement).toBe(cards[1]);
    expect(cards[1]?.tabIndex).toBe(0);
    await press(cards[1] as HTMLElement, "End");
    expect(document.activeElement).toBe(cards[cards.length - 1]);
    await press(cards[cards.length - 1] as HTMLElement, "Home");
    expect(document.activeElement).toBe(cards[0]);
  });
});

describe("hints", () => {
  it("spends coins, switches the tab and highlights one piece", async () => {
    const r = await openBoard("riv-01", { coins: 50 });
    await click(buttonByText(r.container, "Hint"));
    expect(text(q(document.body, "[data-testid='hint-balance']"))).toBe("You have 50 coins.");
    await click(buttonByText(document.body, "Buy for 20"));
    await settle(r);
    expect(r.app.game.getState().profile.coins).toBe(30);
    expect(r.app.game.getState().profile.stats.hintsUsed).toBe(1);
    expect(all(r.container, ".dr-piece[data-hint='true']")).toHaveLength(1);
    expect(all(r.container, ".dr-slot[data-hint='true']")).toHaveLength(1);
    expect(live(r)).toContain("Hint: try the");
    const hinted = q(r.container, ".dr-piece[data-hint='true']");
    const hintedSlot = q(r.container, ".dr-slot[data-hint='true']");
    expect(piece(hinted.dataset.pieceId ?? "").category).toBe(hintedSlot.dataset.boardSlot);
    expect(q(r.container, "[role='tab'][aria-selected='true']").textContent).toBe(
      TRAY_TAB_LABELS[piece(hinted.dataset.pieceId ?? "").category],
    );
    expect(hinted.dataset.placed).toBe("false");
  });

  it("cannot be bought without enough coins", async () => {
    const r = await openBoard("riv-01", { coins: 10 });
    await click(buttonByText(r.container, "Hint"));
    expect(text(q(document.body, "[data-testid='hint-balance']"))).toBe(
      "You have 10 coins and need 20.",
    );
    expect(buttonByText(document.body, "Buy for 20").disabled).toBe(true);
    await click(buttonByText(document.body, "Cancel"));
    expect(r.app.game.getState().profile.coins).toBe(10);
  });

  it("costs 30 coins on the daily", async () => {
    rig = await mountApp({ route: ["styling", { daily: true }], profile: { coins: 100 } });
    await startBoard();
    await click(buttonByText(rig.container, "Hint"));
    expect(text(q(document.body, ".dr-sheet"))).toContain("30 coins");
  });
});

describe("result sheet", () => {
  async function reachResult(r: Rig): Promise<HTMLElement> {
    for (const id of RIV01_LOOK) await tapPlace(r, id);
    return finishAndRead(r);
  }

  it("shows the rule breakdown, harmony parts, client line, coins and unlocks", async () => {
    const r = await openBoard();
    const result = await reachResult(r);
    expect(all(result, ".dr-chip")).toHaveLength(2);
    expect(all(result, ".dr-part")).toHaveLength(5);
    expect(text(q(result, "[data-testid='result-reaction']"))).toContain(
      "Perfect. I would frame this and send it home.",
    );
    expect(text(q(result, "[data-testid='result-coins']"))).toBe("+35 coins");
    expect(r.app.game.getState().profile.coins).toBe(75);
    expect(text(q(document.body, ".dr-sheet__actions"))).toContain("Next challenge");
  });

  it("shows one star and the matching client line for a look that misses a rule", async () => {
    const r = await openBoard();
    const weak = [
      "item-rainy-city-3",
      "item-rainy-city-4",
      "item-rainy-city-5",
      "item-riviera-6",
      "item-riviera-7",
      "item-riviera-8",
    ];
    for (const id of weak) await tapPlace(r, id);
    const result = await finishAndRead(r);
    expect(all(result, ".wg-star--on")).toHaveLength(1);
    expect(text(q(result, "[data-testid='result-star-name']"))).toBe("Presentable");
    expect(text(q(result, "[data-testid='result-reaction']"))).toContain("Wearable, darling");
    expect(chipsMet(result)).toEqual([false, true]);
  });

  it("retries, edits and moves to the next challenge", async () => {
    const r = await openBoard();
    await reachResult(r);
    await click(buttonByText(document.body, "Edit look"));
    expect(document.body.querySelector("[data-testid='result']")).toBeNull();
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(6);
    await click(buttonByText(r.container, "Finish look"));
    await settle(r);
    await click(buttonByText(document.body, "Retry"));
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(0);
    expect(r.app.game.getState().profile.stars["riv-01"]).toBe(3);
    for (const id of RIV01_LOOK) await tapPlace(r, id);
    await finishAndRead(r);
    await click(buttonByText(document.body, "Next challenge"));
    await settle(r);
    expect(r.app.router.current).toMatchObject({
      name: "styling",
      params: { challengeId: "riv-02" },
    });
    expect(text(document.body)).toContain("Market Morning");
  });

  it("saves to the gallery once and reports a full gallery", async () => {
    const r = await openBoard();
    await reachResult(r);
    await click(buttonByText(document.body, "Save to gallery"));
    await settle(r);
    expect(r.app.game.getState().profile.gallery).toHaveLength(1);
    expect(buttonByText(document.body, "Saved").disabled).toBe(true);
    expect(text(q(document.body, "[data-testid='result-note']"))).toBe("Saved to your gallery.");
    r.unmount();

    const entry = (n: number) => ({
      id: `campaign-riv-01-2026-10-0${(n % 9) + 1}-${n}`,
      kind: "campaign" as const,
      ref: "riv-01",
      look: getChallenge("riv-01")?.reference ?? {},
      stars: 3 as const,
      harmony: 80,
      savedKey: "2026-10-01",
    });
    const full = Array.from({ length: MAX_GALLERY }, (_, n) => entry(n));
    const again = await openBoard("riv-01", { gallery: full });
    await reachResult(again);
    await click(buttonByText(document.body, "Save to gallery"));
    await settle(again);
    expect(again.app.game.getState().profile.gallery).toHaveLength(MAX_GALLERY);
    expect(text(q(document.body, "[data-testid='result-note']"))).toContain("gallery is full");
  });

  it("records a daily result and the streak", async () => {
    rig = await mountApp({ route: ["styling", { daily: true }] });
    const { dailyChallenge } = await import("../src/state/session");
    const { unlockedPieces } = await import("@web-games/dress-rehearsal-core");
    const closet = unlockedPieces(rig.app.game.getState().profile);
    const challenge = dailyChallenge("2026-10-23", closet);
    await startBoard();
    for (const id of Object.values(challenge.reference)) await tapPlace(rig, id);
    const result = await finishAndRead(rig);
    expect(all(result, ".wg-star--on")).toHaveLength(3);
    expect(text(q(result, "[data-testid='result-streak']"))).toBe("Daily streak: 1");
    const profile = rig.app.game.getState().profile;
    expect(profile.daily.results["2026-10-23"]?.stars).toBe(3);
    expect(profile.coins).toBeGreaterThan(40);
  });
});

function chipsMet(root: HTMLElement): boolean[] {
  return all(root, ".dr-chip").map((el) => el.dataset.met === "true");
}

describe("back button routing", () => {
  it("leaves from the brief without a confirm", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }] });
    rig.app.router.push("home");
    rig.app.router.pop();
    expect(q(document.body, "[data-testid='brief']")).toBeTruthy();
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(rig.app.router.canGoBack).toBe(false);
  });

  it("closes sheets first, then asks before leaving a started look, then pops", async () => {
    rig = await mountApp({ route: ["home"] });
    rig.app.router.push("styling", { challengeId: "riv-01" });
    await rig.flush();
    await startBoard();
    await tapPlace(rig, "item-riviera-7");
    await click(buttonByText(rig.container, "Pause"));
    expect(text(document.body)).toContain("Paused");
    await act0(() => rig?.app.router.handleBack());
    expect(document.body.querySelector(".dr-sheet")).toBeNull();
    expect(currentScreen(rig)).toBe("styling");

    await act0(() => rig?.app.router.handleBack());
    expect(text(q(document.body, ".dr-sheet"))).toContain("Leave this look?");
    expect(currentScreen(rig)).toBe("styling");
    await act0(() => rig?.app.router.handleBack());
    expect(document.body.querySelector(".dr-sheet")).toBeNull();
    expect(currentScreen(rig)).toBe("styling");

    await act0(() => rig?.app.router.handleBack());
    await click(buttonByText(document.body, "Leave"));
    expect(currentScreen(rig)).toBe("home");
  });

  it("pops straight away when the board is empty", async () => {
    rig = await mountApp({ route: ["home"] });
    rig.app.router.push("styling", { challengeId: "riv-01" });
    await rig.flush();
    await startBoard();
    await act0(() => rig?.app.router.handleBack());
    expect(currentScreen(rig)).toBe("home");
  });

  it("does not ask again after a finished look", async () => {
    rig = await mountApp({ route: ["home"] });
    rig.app.router.push("styling", { challengeId: "riv-01" });
    await rig.flush();
    await startBoard();
    for (const id of RIV01_LOOK) await tapPlace(rig, id);
    await finishAndRead(rig);
    await click(buttonByText(document.body, "Edit look"));
    await act0(() => rig?.app.router.handleBack());
    expect(currentScreen(rig)).toBe("home");
  });

  it("restarts the look and shows the brief again from the pause sheet", async () => {
    const r = await openBoard();
    await tapPlace(r, "item-riviera-7");
    await click(buttonByText(r.container, "Pause"));
    await click(buttonByText(document.body, "Read the brief again"));
    expect(q(document.body, "[data-testid='brief']")).toBeTruthy();
    await startBoard();
    await click(buttonByText(r.container, "Pause"));
    await click(buttonByText(document.body, "Start this look over"));
    expect(all(r.container, ".dr-slot[data-filled='true']")).toHaveLength(0);
  });
});

async function act0(fn: () => unknown): Promise<void> {
  const { act } = await import("preact/test-utils");
  await act(() => {
    fn();
  });
}

describe("fixtures", () => {
  it("uses the riviera ids", () => {
    expect(RIVIERA_IDS).toHaveLength(7);
    expect(defaultProfile().coins).toBe(40);
  });
});
