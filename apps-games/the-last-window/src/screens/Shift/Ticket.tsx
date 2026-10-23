import { Button } from "@web-games/kit";
import type { Component, SeatState, ShiftState } from "@web-games/the-last-window-core";
import { customerName, orderText } from "../../labels";
import { t } from "../../strings";
import { MoodChip } from "../../ui/MoodChip";
import { Tray } from "./Tray";

export function activeSeat(state: ShiftState): SeatState | null {
  if (state.active === null) return null;
  const seat = state.seats[state.active];
  return seat && seat.customer !== null ? seat : null;
}

export interface TicketProps {
  state: ShiftState;
  onDiscard: (slot: Component) => void;
  onServe: () => void;
}

/** The active order: who is waiting, what they asked for, the tray and the Serve button. */
export function Ticket({ state, onDiscard, onServe }: TicketProps) {
  const seat = activeSeat(state);
  if (seat === null || seat.customer === null || seat.order === null) {
    return (
      <section class="tlw-ticket tlw-ticket--idle" aria-label={t("shiftTray")} data-testid="ticket">
        <p>{t("shiftNoTicket")}</p>
        <Button size="large" disabled>
          {t("shiftServe")}
        </Button>
      </section>
    );
  }
  const order = seat.order;
  return (
    <section class="tlw-ticket" aria-label={t("shiftTray")} data-testid="ticket">
      <p class="tlw-ticket__who">
        <strong>{t("shiftWants", { name: customerName(seat.customer) })}</strong> {orderText(order)}
        {order.mood !== null ? <MoodChip mood={order.mood} /> : null}
      </p>
      <Tray seat={seat} onDiscard={onDiscard} />
      <Button size="large" fullWidth onClick={onServe}>
        {t("shiftServe")}
      </Button>
    </section>
  );
}
