import { PORTIONS_PER_KIND, SEATS, type ShiftState } from "../../src";

export function violations(state: ShiftState): string[] {
  const out: string[] = [];
  const ids = [
    ...state.seats.flatMap((seat) => (seat.customer ? [seat.customer.id] : [])),
    ...state.door.map((entry) => state.def.arrivals[entry.arrivalIndex]?.customer.id ?? "?"),
  ];
  if (new Set(ids).size !== ids.length) out.push("a customer holds two places");
  if (state.seats.length !== SEATS) out.push("seat count changed");
  for (const [index, seat] of state.seats.entries()) {
    if ((seat.customer === null) !== (seat.order === null)) out.push(`seat ${index} half empty`);
    if (seat.customer === null && (seat.tray.drink || seat.tray.pastry || seat.tray.book)) {
      out.push(`empty seat ${index} has a tray`);
    }
    if (seat.patienceLeft < 0 || seat.patienceLeft > seat.patienceTotal) {
      out.push(`seat ${index} patience out of range`);
    }
  }
  if (state.active !== null && state.seats[state.active]?.customer == null) {
    out.push("active seat is empty");
  }
  if (state.cup && state.seats[state.cup.seat]?.customer == null) out.push("cup for an empty seat");
  for (const plate of state.plates) {
    if (plate && state.seats[plate.seat]?.customer == null) out.push("plate for an empty seat");
  }
  for (const entry of state.stock) {
    if (entry.portions < 0 || entry.portions > PORTIONS_PER_KIND) out.push("portions out of range");
  }
  const stats = state.stats;
  if (stats.payments < 0 || stats.tips < 0) out.push("negative coins");
  const resolved = Object.values(stats.counts).reduce((a, b) => a + b, 0);
  if (resolved !== stats.resolved.length) out.push("outcome counts disagree");
  if (
    resolved + state.seats.filter((s) => s.customer).length + state.door.length !==
    stats.arrived
  ) {
    out.push("arrived does not add up");
  }
  return out;
}
