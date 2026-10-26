import {
  type BookId,
  type DrinkId,
  drinkRule,
  type PastryId,
  pastryRule,
  stepDuration,
} from "@web-games/the-last-window-core";
import { click, q, type Rig } from "./helpers";

export function seatButton(rig: Rig, nameFragment: string): HTMLButtonElement {
  const seats = Array.from(rig.container.querySelectorAll<HTMLButtonElement>("[data-seat]"));
  const found = seats.find((el) => (el.getAttribute("aria-label") ?? "").includes(nameFragment));
  if (!found) throw new Error(`No seat for ${nameFragment}`);
  return found;
}

export async function selectSeat(rig: Rig, nameFragment: string): Promise<void> {
  await click(seatButton(rig, nameFragment));
}

export async function makeDrink(rig: Rig, id: DrinkId): Promise<void> {
  for (const token of drinkRule(id).steps) {
    await click(q(rig.container, `[data-testid="drink-station"] [data-token="${token}"]`));
    const ticks = stepDuration(token);
    if (ticks > 0) await rig.advance(ticks * 100 + 50);
  }
}

export async function makePastry(rig: Rig, id: PastryId): Promise<void> {
  await click(q(rig.container, `[data-pastry="${id}"]`));
  for (const token of pastryRule(id).steps.slice(1)) {
    await click(
      q(rig.container, `[data-testid="pastry-station"] .tlw-steps [data-token="${token}"]`),
    );
    const ticks = stepDuration(token);
    if (ticks > 0) await rig.advance(ticks * 100 + 50);
  }
}

export async function giveBook(rig: Rig, id: BookId): Promise<void> {
  await click(q(rig.container, '[data-testid="shelf-toggle"]'));
  await click(q(rig.container, `[data-book="${id}"]`));
}

export async function serveActive(rig: Rig): Promise<void> {
  const serve = Array.from(
    rig.container.querySelectorAll<HTMLButtonElement>("[data-testid='ticket'] button"),
  ).find((b) => (b.textContent ?? "").trim() === "Serve");
  if (!serve) throw new Error("No Serve button");
  await click(serve);
}
