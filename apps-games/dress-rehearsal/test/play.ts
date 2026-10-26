import { PIECE_BY_ID, TRAY_TAB_LABELS } from "@web-games/dress-rehearsal-core";
import { act } from "preact/test-utils";
import { vi } from "vitest";
import { buttonByText, click, press, q, type Rig } from "./helpers";

export function piece(id: string) {
  const found = PIECE_BY_ID.get(id);
  if (!found) throw new Error(`Unknown piece ${id}`);
  return found;
}

export async function openTab(rig: Rig, category: string): Promise<void> {
  const label = TRAY_TAB_LABELS[category as keyof typeof TRAY_TAB_LABELS];
  const tab = Array.from(rig.container.querySelectorAll<HTMLElement>("[role='tab']")).find(
    (el) => (el.textContent ?? "").trim() === label,
  );
  if (!tab) throw new Error(`No tab ${label}`);
  await click(tab);
}

export function card(rig: Rig, id: string): HTMLElement {
  return q(rig.container, `.dr-piece[data-piece-id="${id}"]`);
}

export function slotEl(rig: Rig, slot: string): HTMLElement {
  return q(rig.container, `.dr-slot[data-board-slot="${slot}"]`);
}

export async function startBoard(): Promise<void> {
  await click(buttonByText(document.body, "Start styling"));
}

/** Tap path: open the tab, tap the card, tap the slot. */
export async function tapPlace(rig: Rig, id: string): Promise<void> {
  const p = piece(id);
  await openTab(rig, p.category);
  await click(card(rig, id));
  await click(slotEl(rig, p.category));
}

/** Keyboard path: focus the card and press Enter. */
export async function keyPlace(rig: Rig, id: string): Promise<void> {
  const p = piece(id);
  await openTab(rig, p.category);
  const el = card(rig, id);
  el.focus();
  await press(el, "Enter");
}

function pointer(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, button: 0 });
}

/** Drag path with a stubbed hit test: drop at `target` (a slot element) or nowhere. */
export async function dragTo(source: HTMLElement, target: HTMLElement | null): Promise<void> {
  const original = document.elementFromPoint;
  document.elementFromPoint = (() => target) as typeof document.elementFromPoint;
  try {
    await act(() => {
      source.dispatchEvent(pointer("pointerdown", 10, 10));
    });
    await act(() => {
      window.dispatchEvent(pointer("pointermove", 80, 90));
    });
    await act(() => {
      window.dispatchEvent(pointer("pointerup", 90, 100));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
    });
  } finally {
    document.elementFromPoint = original;
  }
}

export async function dragPlace(rig: Rig, id: string): Promise<void> {
  const p = piece(id);
  await openTab(rig, p.category);
  await dragTo(card(rig, id), slotEl(rig, p.category));
}

export async function settle(rig: Rig): Promise<void> {
  await rig.flush();
  await rig.settle(5);
}

export const RIV01_LOOK = [
  "item-riviera-1",
  "item-riviera-4",
  "item-riviera-5",
  "item-riviera-6",
  "item-riviera-7",
  "item-riviera-8",
];

export function fakeTimers(): void {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
}
