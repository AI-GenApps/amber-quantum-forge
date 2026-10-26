import {
  type Customer,
  OUTCOME_WORDS,
  type ShiftEvent,
  type ShiftState,
} from "@web-games/the-last-window-core";
import { customerName, orderText } from "../../labels";
import { t } from "../../strings";

export function customerById(state: ShiftState, id: string): Customer | null {
  return state.def.arrivals.find((arrival) => arrival.customer.id === id)?.customer ?? null;
}

function nameOf(state: ShiftState, id: string): string {
  const customer = customerById(state, id);
  return customer ? customerName(customer) : t("shiftVisitor");
}

/** The screen reader text for one engine event, or null when it needs no announcement. */
export function describeEvent(event: ShiftEvent, state: ShiftState): string | null {
  switch (event.type) {
    case "customer-seated":
      return t("shiftSeated", {
        name: nameOf(state, event.customerId),
        n: event.seat + 1,
        order: orderText(event.order),
      });
    case "patience-warning":
      return t("shiftWarning", { name: nameOf(state, event.customerId) });
    case "customer-left":
      return t("shiftLeft", { name: nameOf(state, event.customerId) });
    case "customer-turned-away":
      return t("shiftTurned", { name: nameOf(state, event.customerId) });
    case "served":
      return t("shiftServed", {
        name: nameOf(state, event.customerId),
        outcome: OUTCOME_WORDS[event.outcome].toLowerCase(),
        payment: event.payment,
        tip: event.tip,
      });
    case "step-wrong":
      return t("shiftWrong");
    default:
      return null;
  }
}

export function describeEvents(events: readonly ShiftEvent[], state: ShiftState): string[] {
  return events.flatMap((event) => describeEvent(event, state) ?? []);
}
