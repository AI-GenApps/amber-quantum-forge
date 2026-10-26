import type { Component, SeatState, Tray as TrayState } from "@web-games/the-last-window-core";
import { ItemIcon } from "../../art/ItemIcon";
import { bookTitle, drinkName, pastryName } from "../../labels";
import { t } from "../../strings";
import { Glyph } from "../../ui/Glyph";

const SLOTS: readonly Component[] = ["drink", "pastry", "book"];

function itemOf(tray: TrayState, slot: Component): { id: string; name: string } | null {
  if (slot === "drink" && tray.drink) return { id: tray.drink, name: drinkName(tray.drink) };
  if (slot === "pastry" && tray.pastry) return { id: tray.pastry, name: pastryName(tray.pastry) };
  if (slot === "book" && tray.book) return { id: tray.book, name: bookTitle(tray.book) };
  return null;
}

export function trayIsEmpty(seat: SeatState): boolean {
  return seat.tray.drink === null && seat.tray.pastry === null && seat.tray.book === null;
}

export interface TrayProps {
  seat: SeatState;
  onDiscard: (slot: Component) => void;
}

/** What is on the active customer's tray, each item with its own discard button. */
export function Tray({ seat, onDiscard }: TrayProps) {
  return (
    <div class="tlw-tray" data-testid="tray">
      {SLOTS.map((slot) => {
        const item = itemOf(seat.tray, slot);
        if (item === null) return null;
        return (
          <div key={slot} class="tlw-tray__item">
            <ItemIcon slot={item.id} />
            <span>{item.name}</span>
            <button
              type="button"
              class="tlw-tray__discard"
              aria-label={t("shiftDiscard", { item: item.name })}
              onClick={() => onDiscard(slot)}
            >
              <Glyph name="trash" />
            </button>
          </div>
        );
      })}
      {trayIsEmpty(seat) ? <p class="tlw-muted">{t("shiftTrayEmpty")}</p> : null}
    </div>
  );
}
